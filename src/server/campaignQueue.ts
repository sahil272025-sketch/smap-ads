import { db, Campaign } from './db.js';
import { MetaService } from './metaService.js';

export interface QueueJob {
  campaignId: string;
  queuedAt: number;
  retryCount: number;
  executeAt: number;
}

export interface QueueStats {
  queuedCount: number;
  processingCount: number;
  activeWorkers: number;
  completedCount: number;
  failedCount: number;
  retriedCount: number;
  liveSubmissionsEnabled: boolean;
}

export class CampaignQueueService {
  private static queue: QueueJob[] = [];
  private static processing: Set<string> = new Set();
  private static MAX_CONCURRENCY = 2;
  private static MAX_RETRIES = 3;
  private static INITIAL_BACKOFF_MS = 15000; // 15 seconds
  private static MAX_BACKOFF_MS = 300000; // 5 minutes
  private static sweepTimer: NodeJS.Timeout | null = null;
  private static stats = {
    completedCount: 0,
    failedCount: 0,
    retriedCount: 0,
  };

  /**
   * Initializes queue, runs crash recovery for any interrupted submissions, and starts periodic recovery sweeper.
   */
  public static start() {
    db.log('QUEUE', 'INFO', 'Starting Campaign Submission Background Queue Service');
    
    // Recover stuck jobs from previous process restarts/crashes
    this.recoverStuckJobs();

    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
    }

    // Periodic sweep every 60 seconds to ensure no job remains stuck indefinitely
    this.sweepTimer = setInterval(() => {
      this.recoverStuckJobs();
      this.processNext();
    }, 60000);
  }

  public static stop() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    db.log('QUEUE', 'INFO', 'Campaign Queue Service stopped');
  }

  /**
   * Enqueue a campaign for background processing.
   * Returns immediately so client requests never wait on external Meta API network calls.
   */
  public static enqueue(campaignId: string, delayMs: number = 0, retryCount: number = 0): {
    queued: boolean;
    jobId: string;
    position: number;
    executeAt: string;
  } {
    const executeAt = Date.now() + Math.max(0, delayMs);

    // Prevent duplicate entries for the same campaign in pending queue
    const existingIndex = this.queue.findIndex(j => j.campaignId === campaignId);
    if (existingIndex !== -1) {
      db.log('QUEUE', 'WARN', `Campaign ${campaignId} is already queued at position ${existingIndex + 1}`);
      return {
        queued: true,
        jobId: campaignId,
        position: existingIndex + 1,
        executeAt: new Date(this.queue[existingIndex].executeAt).toISOString(),
      };
    }

    // Update campaign record state in DB
    db.updateCampaign(campaignId, {
      queue_status: 'QUEUED',
      retry_count: retryCount,
      next_retry_at: delayMs > 0 ? new Date(executeAt).toISOString() : null,
      meta_status_message: delayMs > 0 
        ? `Queued for background retry attempt ${retryCount + 1}/${this.MAX_RETRIES}...`
        : 'Queued in SMAP background worker for automated Meta submission...',
    });

    this.queue.push({
      campaignId,
      queuedAt: Date.now(),
      retryCount,
      executeAt,
    });

    db.log('QUEUE', 'INFO', `Campaign ${campaignId} enqueued (delay: ${delayMs}ms, retry: ${retryCount})`, {
      queueLength: this.queue.length,
      executeAt: new Date(executeAt).toISOString(),
    });

    // Schedule or trigger processing
    if (delayMs > 0) {
      setTimeout(() => {
        this.processNext();
      }, delayMs);
    } else {
      setImmediate(() => {
        this.processNext();
      });
    }

    return {
      queued: true,
      jobId: campaignId,
      position: this.queue.length,
      executeAt: new Date(executeAt).toISOString(),
    };
  }

  /**
   * Main queue worker dispatcher respecting concurrency limits.
   */
  private static async processNext() {
    if (this.processing.size >= this.MAX_CONCURRENCY) {
      return;
    }

    const now = Date.now();
    const readyJobIndex = this.queue.findIndex(job => job.executeAt <= now && !this.processing.has(job.campaignId));
    if (readyJobIndex === -1) {
      return;
    }

    const [job] = this.queue.splice(readyJobIndex, 1);
    this.processing.add(job.campaignId);

    // Execute job asynchronously in worker pool
    this.executeJob(job).finally(() => {
      this.processing.delete(job.campaignId);
      // Trigger next available job
      setImmediate(() => this.processNext());
    });
  }

  /**
   * Executes a single campaign submission job with idempotency and error classification.
   */
  private static async executeJob(job: QueueJob): Promise<void> {
    const { campaignId, retryCount } = job;
    const campaign = db.findCampaignById(campaignId);

    if (!campaign) {
      db.log('QUEUE', 'ERROR', `Job dropped: Campaign ${campaignId} not found in database.`);
      return;
    }

    // Idempotency check: If campaign already has an active or submitted Meta campaign ID, skip duplicate submission
    if (campaign.meta_campaign_id && (campaign.status === 'UNDER_REVIEW' || campaign.status === 'ACTIVE')) {
      db.log('QUEUE', 'INFO', `Idempotency guard: Campaign ${campaignId} already has Meta ID ${campaign.meta_campaign_id}. Marking queue completed.`);
      db.updateCampaign(campaignId, { queue_status: 'COMPLETED' });
      this.stats.completedCount++;
      return;
    }

    db.updateCampaign(campaignId, {
      queue_status: 'PROCESSING',
      status: campaign.status === 'QUEUED' ? 'SUBMITTING' : campaign.status,
      last_retry_at: new Date().toISOString(),
      meta_status_message: 'Worker processing campaign submission to Meta Marketing API...',
    });

    db.log('QUEUE', 'INFO', `Worker started processing campaign ${campaignId} (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1})`);

    try {
      const metaConn = db.findMetaConnectionByUserId(campaign.user_id);
      const isDryRun = !MetaService.canSubmitLiveCampaigns().allowed;
      const submitRes = await MetaService.submitCampaignToMeta(campaign, metaConn, { dryRun: isDryRun });

      if (submitRes.success) {
        if (submitRes.dryRun) {
          // Dry-run mode: Pre-flight validation passed safely, campaign held pending Meta live activation
          db.updateCampaign(campaignId, {
            status: 'UNDER_REVIEW',
            queue_status: 'COMPLETED',
            meta_campaign_id: null,
            meta_adset_id: null,
            meta_creative_id: null,
            meta_ad_id: null,
            meta_status_message: submitRes.notes || 'Pre-flight validation passed (Safe Dry-Run Mode). Campaign held safely pending Meta Live Activation. ₹0 spent on Meta.',
            error_details: null,
            rejection_reason: null,
          });

          this.stats.completedCount++;
          db.log('QUEUE', 'INFO', `Campaign ${campaignId} passed pre-flight validation in safe dry-run mode.`);
        } else {
          // Successful live submission to Meta Graph API
          db.updateCampaign(campaignId, {
            status: submitRes.status || 'UNDER_REVIEW',
            queue_status: 'COMPLETED',
            meta_campaign_id: submitRes.meta_campaign_id || null,
            meta_adset_id: submitRes.meta_adset_id || null,
            meta_creative_id: submitRes.meta_creative_id || null,
            meta_ad_id: submitRes.meta_ad_id || null,
            meta_status_message: 'Campaign submitted successfully to Meta Marketing API. Under standard ad review.',
            error_details: null,
            rejection_reason: null,
          });

          this.stats.completedCount++;
          db.log('QUEUE', 'INFO', `Campaign ${campaignId} successfully processed and registered on Meta (ID: ${submitRes.meta_campaign_id}).`);
        }
      } else if (submitRes.status === 'BUDGET_ADJUSTMENT_REQUIRED') {
        const errorMsg = submitRes.error || 'Meta daily budget floor adjustment required';
        const pkg = db.findPackageById(campaign.package_id);
        db.updateCampaign(campaignId, {
          status: 'BUDGET_ADJUSTMENT_REQUIRED',
          queue_status: 'COMPLETED',
          error_details: errorMsg,
          meta_status_message: errorMsg,
          budget_breakdown: submitRes.budgetDetails ? {
            platform_fee: pkg?.platform_fee || 200,
            media_spend: submitRes.budgetDetails.mediaSpend,
            daily_media_spend: submitRes.budgetDetails.dailyMediaSpend,
            min_daily_media_spend: submitRes.budgetDetails.minDailyBudget,
            currency: 'INR',
            recommended_duration_days: submitRes.budgetDetails.recommendedDurationDays,
            recommended_topup_amount: submitRes.budgetDetails.recommendedTopupAmount,
          } : undefined,
        });
        db.log('QUEUE', 'WARN', `Campaign ${campaignId} requires customer budget/duration adjustment: ${errorMsg}`);
      } else {
        // Meta API returned error or rejection
        const errorMsg = submitRes.error || 'Meta campaign submission rejected';
        this.handleFailure(campaign, job, errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Unexpected exception during Meta campaign processing';
      this.handleFailure(campaign, job, errorMsg);
    }
  }

  /**
   * Distinguishes between fatal errors (e.g. policy violations, invalid parameters)
   * vs transient errors (rate limit, temporary Meta network hiccups).
   */
  private static handleFailure(campaign: Campaign, job: QueueJob, errorMsg: string) {
    const isTransient = this.isTransientError(errorMsg);

    if (isTransient && job.retryCount < this.MAX_RETRIES) {
      // Calculate exponential backoff with jitter
      const nextRetry = job.retryCount + 1;
      const jitter = Math.floor(Math.random() * 5000);
      const backoffDelay = Math.min(
        this.INITIAL_BACKOFF_MS * Math.pow(2, job.retryCount) + jitter,
        this.MAX_BACKOFF_MS
      );

      this.stats.retriedCount++;
      db.log('QUEUE', 'WARN', `Transient Meta error on campaign ${campaign.id}: "${errorMsg}". Scheduling retry ${nextRetry}/${this.MAX_RETRIES} in ${Math.round(backoffDelay / 1000)}s.`);

      db.updateCampaign(campaign.id, {
        queue_status: 'RETRYING',
        retry_count: nextRetry,
        next_retry_at: new Date(Date.now() + backoffDelay).toISOString(),
        meta_status_message: `Temporary Meta API issue (${errorMsg}). Auto-retrying in ${Math.round(backoffDelay / 1000)}s (Attempt ${nextRetry}/${this.MAX_RETRIES}).`,
      });

      this.enqueue(campaign.id, backoffDelay, nextRetry);
    } else {
      // Permanent failure or max retries exceeded
      this.stats.failedCount++;
      const finalReason = isTransient 
        ? `Exceeded maximum automated retries (${this.MAX_RETRIES}) due to persistent Meta network/service issues: ${errorMsg}`
        : errorMsg;

      db.log('QUEUE', 'ERROR', `Permanent failure for campaign ${campaign.id}: ${finalReason}`);

      db.updateCampaign(campaign.id, {
        status: 'FAILED',
        queue_status: 'FAILED',
        error_details: finalReason,
        rejection_reason: finalReason,
        meta_status_message: `Campaign submission failed: ${finalReason}`,
      });
    }
  }

  /**
   * Inspects error message or code to identify transient/recoverable vs fatal errors.
   */
  public static isTransientError(error: string): boolean {
    const lower = (error || '').toLowerCase();
    
    // Explicit permanent errors
    if (
      lower.includes('oauth') ||
      lower.includes('invalid access token') ||
      lower.includes('session has expired') ||
      lower.includes('permission') ||
      lower.includes('pages_manage_ads') ||
      lower.includes('ad creative') && lower.includes('invalid') ||
      lower.includes('policy') ||
      lower.includes('disapproved')
    ) {
      return false;
    }

    // Explicit transient errors
    if (
      lower.includes('rate limit') ||
      lower.includes('calls') ||
      lower.includes('too many') ||
      lower.includes('timeout') ||
      lower.includes('etimedout') ||
      lower.includes('econnreset') ||
      lower.includes('fetch failed') ||
      lower.includes('network') ||
      lower.includes('temporary') ||
      lower.includes('please retry') ||
      lower.includes('500') ||
      lower.includes('502') ||
      lower.includes('503') ||
      lower.includes('504') ||
      lower.includes('code 4') ||
      lower.includes('code 17')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Crash Recovery:
   * Inspects the database for any campaigns left in QUEUED, PROCESSING, or RETRYING states
   * when the server started, and safely restores them to the active queue.
   */
  public static recoverStuckJobs() {
    try {
      const allCampaigns = db.getCampaigns();
      const now = Date.now();

      for (const campaign of allCampaigns) {
        // Look for campaigns that were paid or queued but not completed/failed
        const isQueued = campaign.status === 'QUEUED' || campaign.queue_status === 'QUEUED';
        const isProcessing = campaign.status === 'SUBMITTING' || campaign.queue_status === 'PROCESSING';
        const isRetrying = campaign.queue_status === 'RETRYING';

        if ((isQueued || isProcessing || isRetrying) && campaign.status !== 'ACTIVE' && campaign.status !== 'COMPLETED' && campaign.status !== 'FAILED') {
          // If already in memory queue or currently processing, leave it
          const inQueue = this.queue.some(j => j.campaignId === campaign.id);
          const inProcessing = this.processing.has(campaign.id);

          if (!inQueue && !inProcessing) {
            // Check if stuck for more than 2 minutes without update
            const lastUpdated = campaign.updated_at ? new Date(campaign.updated_at).getTime() : 0;
            const isStuck = (now - lastUpdated) > 120000;

            if (isStuck || isQueued) {
              const currentRetries = campaign.retry_count || 0;
              if (currentRetries < this.MAX_RETRIES) {
                db.log('QUEUE', 'WARN', `Crash Recovery: Re-enqueuing interrupted campaign ${campaign.id} (status: ${campaign.status}, queue_status: ${campaign.queue_status})`);
                this.enqueue(campaign.id, 2000, currentRetries);
              } else {
                db.log('QUEUE', 'ERROR', `Crash Recovery: Campaign ${campaign.id} exceeded max retries. Marking FAILED.`);
                db.updateCampaign(campaign.id, {
                  status: 'FAILED',
                  queue_status: 'FAILED',
                  error_details: 'Submission interrupted by server restart and exceeded retry limit.',
                  rejection_reason: 'Submission interrupted and exceeded retry limit.',
                });
              }
            }
          }
        }
      }
    } catch (err: any) {
      db.log('QUEUE', 'ERROR', `Exception during crash recovery sweep: ${err?.message}`);
    }
  }

  /**
   * Diagnostic summary of current queue state.
   */
  public static getQueueStats(): QueueStats {
    return {
      queuedCount: this.queue.length,
      processingCount: this.processing.size,
      activeWorkers: this.processing.size,
      completedCount: this.stats.completedCount,
      failedCount: this.stats.failedCount,
      retriedCount: this.stats.retriedCount,
      liveSubmissionsEnabled: process.env.META_LIVE_SUBMISSIONS_ENABLED === 'true',
    };
  }
}
