import { db, Campaign } from './db.js';
import { MetaService } from './metaService.js';

export class SchedulerService {
  private static intervalHandle: NodeJS.Timeout | null = null;
  private static isRunning = false;

  public static start(intervalMs = 30000) {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }

    db.log('SCHEDULER', 'INFO', `Campaign expiry background scheduler started (check interval: ${intervalMs / 1000}s)`);

    // Run first check after 5 seconds, then every interval
    setTimeout(() => {
      this.checkExpiredCampaigns();
    }, 5000);

    this.intervalHandle = setInterval(() => {
      this.checkExpiredCampaigns();
    }, intervalMs);
  }

  public static stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      db.log('SCHEDULER', 'INFO', 'Campaign expiry scheduler stopped');
    }
  }

  public static async checkExpiredCampaigns() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const allCampaigns = db.getCampaigns();
      const activeCampaigns = allCampaigns.filter(c => c.status === 'ACTIVE' && c.end_at);

      for (const campaign of activeCampaigns) {
        if (!campaign.end_at) continue;

        const endDate = new Date(campaign.end_at);
        if (now >= endDate) {
          db.log('SCHEDULER', 'INFO', `Campaign ${campaign.id} reached scheduled end_at (${campaign.end_at}). Initiating automated pause.`, {
            campaignId: campaign.id,
            metaCampaignId: campaign.meta_campaign_id,
          });

          if (campaign.meta_campaign_id) {
            // Call official Meta API to pause/deactivate campaign
            const pauseResult = await MetaService.pauseCampaign(campaign);

            if (pauseResult.success) {
              // Only after confirmation change internal status to COMPLETED
              db.updateCampaign(campaign.id, {
                status: 'COMPLETED',
                meta_status_message: 'Campaign concluded successfully after duration completed. Deactivated on Meta.',
              });

              db.log('SCHEDULER', 'INFO', `Campaign ${campaign.id} confirmed paused on Meta and marked COMPLETED.`);
            } else {
              // Meta API pause failed! Do not falsely mark COMPLETED
              db.updateCampaign(campaign.id, {
                meta_status_message: `Campaign duration ended but automatic pause via Meta API failed: ${pauseResult.error || 'Unknown error'}`,
              });

              db.log('SCHEDULER', 'ERROR', `Automatic Meta pause failed for expired campaign ${campaign.id}: ${pauseResult.error}`);
            }
          } else {
            // Internal scheduled completion
            db.updateCampaign(campaign.id, {
              status: 'COMPLETED',
              meta_status_message: 'Campaign concluded at scheduled duration.',
            });
            db.log('SCHEDULER', 'INFO', `Campaign ${campaign.id} marked COMPLETED (no external Meta campaign ID linked).`);
          }
        }
      }
    } catch (err: any) {
      db.log('SCHEDULER', 'ERROR', `Exception during scheduler run: ${err?.message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
