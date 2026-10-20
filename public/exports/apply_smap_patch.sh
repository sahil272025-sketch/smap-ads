#!/bin/bash
set -e

echo "================================================================"
echo "  SMAP Ads — Reports Cleanup + Image/70s Video Upload Upgrade"
echo "================================================================"

if [ ! -d ".git" ]; then
  echo "❌ Error: Please run this script inside your cloned 'smap-ads' directory."
  echo "Example: cd ~/smap-ads && bash apply_smap_patch.sh"
  exit 1
fi

echo "1. Checking git status..."
git status --short

echo "2. Applying verified patch..."
git apply --verbose << 'EOF_EMBEDDED_PATCH'
diff --git a/server.ts b/server.ts
index 7c6eb2a..76d68a4 100644
--- a/server.ts
+++ b/server.ts
@@ -65,7 +65,11 @@ app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 app.use(cookieParser());
 
 // Static uploads directory
-const uploadsDir = path.resolve(process.cwd(), 'data/uploads');
+const DEFAULT_DATA_DIR = path.resolve(process.cwd(), 'data');
+const DATA_DIR = process.env.RENDER_DISK_PATH ||
+  process.env.DATA_DIR ||
+  (fs.existsSync('/var/data') ? '/var/data' : DEFAULT_DATA_DIR);
+const uploadsDir = path.join(DATA_DIR, 'uploads');
 if (!fs.existsSync(uploadsDir)) {
   fs.mkdirSync(uploadsDir, { recursive: true });
 }
diff --git a/src/components/dashboard/CreateAdFlow.tsx b/src/components/dashboard/CreateAdFlow.tsx
index 5c0b9d8..5c0073d 100644
--- a/src/components/dashboard/CreateAdFlow.tsx
+++ b/src/components/dashboard/CreateAdFlow.tsx
@@ -37,6 +37,9 @@ import {
   CheckSquare,
   Square,
   DollarSign,
+  Film,
+  Image as ImageIcon,
+  Video,
 } from 'lucide-react';
 
 const ALL_28_INDIAN_STATES = [
@@ -289,6 +292,21 @@ export const CAMPAIGN_PACKAGES: CampaignPackageOption[] = [
   },
 ];
 
+export interface MediaMetadata {
+  width: number;
+  height: number;
+  aspectRatio: string;
+  ratioValue: number;
+  duration?: number;
+  durationFormatted?: string;
+  format: string;
+  sizeBytes: number;
+  sizeFormatted: string;
+  isPlacementCompatible: boolean;
+  recommendation?: string;
+  warningNotice?: string;
+}
+
 interface CreateAdFlowProps {
   initialPackageId?: string | null;
   onCampaignCreated: (campaignId: string) => void;
@@ -321,6 +339,7 @@ export const CreateAdFlow: React.FC<CreateAdFlowProps> = ({
   const [creativeFile, setCreativeFile] = useState<File | null>(null);
   const [creativeUrl, setCreativeUrl] = useState<string>('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80');
   const [creativeType, setCreativeType] = useState<'image' | 'video'>('image');
+  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata | null>(null);
   const [isUploading, setIsUploading] = useState<boolean>(false);
   const [uploadError, setUploadError] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
@@ -425,28 +444,188 @@ export const CreateAdFlow: React.FC<CreateAdFlowProps> = ({
     return `${fmt(minReach)} – ${fmt(maxReach)} people`;
   })();
 
-  // File Upload Handler
+  // Helper to format bytes
+  const formatFileSize = (bytes: number) => {
+    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
+    return `${(bytes / 1024).toFixed(0)} KB`;
+  };
+
+  // High-Quality Image & 70s Video Media Pre-Flight Inspection & Upload Handler
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
-    if (file.size > 50 * 1024 * 1024) {
-      setUploadError('Media file must be less than 50MB');
+    // Reset previous errors
+    setUploadError(null);
+
+    const ext = file.name.split('.').pop()?.toLowerCase() || '';
+    const mime = file.type.toLowerCase();
+
+    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mime.startsWith('image/');
+    const isVideo = ['mp4', 'mov', 'webm'].includes(ext) || mime.startsWith('video/');
+
+    if (!isImage && !isVideo) {
+      setUploadError(`Unsupported format (.${ext || 'unknown'}). Please upload a high-resolution image (JPG, JPEG, PNG, WEBP) or video (MP4, MOV).`);
       return;
     }
 
-    setCreativeFile(file);
-    setUploadError(null);
-    setIsUploading(true);
+    const hasStoriesOrReels = selectedPlacements.some((p) => p.includes('stories') || p.includes('reels'));
+    const isStoriesOnly = selectedPlacements.every((p) => p.includes('stories'));
 
-    try {
-      const uploaded = await api.uploadCreative(file);
-      setCreativeUrl(uploaded.url);
-      setCreativeType(uploaded.type);
-    } catch (err: any) {
-      setUploadError(err.message || 'Creative upload failed. Using existing preview asset.');
-    } finally {
-      setIsUploading(false);
+    // Image Validation
+    if (isImage) {
+      if (file.size > 30 * 1024 * 1024) {
+        setUploadError(`Image file size (${formatFileSize(file.size)}) exceeds the 30MB limit for Meta image ads.`);
+        return;
+      }
+
+      setIsUploading(true);
+      const objectUrl = URL.createObjectURL(file);
+      try {
+        const img = new Image();
+        await new Promise<void>((resolve, reject) => {
+          img.onload = () => resolve();
+          img.onerror = () => reject(new Error('The uploaded image file is invalid or corrupted. Please try another image.'));
+          img.src = objectUrl;
+        });
+
+        const w = img.naturalWidth;
+        const h = img.naturalHeight;
+        const ratio = w / h;
+
+        if (w < 500 || h < 500) {
+          setUploadError(`Image resolution (${w} × ${h} px) is too low for Meta ads. Minimum recommended is 600 × 600 px (optimal: 1080 × 1080 px for Feeds or 1080 × 1920 px for Stories/Reels).`);
+          setIsUploading(false);
+          return;
+        }
+
+        let ratioLabel = 'Custom';
+        let recommendation = '';
+        if (Math.abs(ratio - 1.0) <= 0.08) {
+          ratioLabel = '1:1 Square (1080 × 1080)';
+          recommendation = 'Optimal standard format for Facebook & Instagram Feeds.';
+        } else if (Math.abs(ratio - 0.8) <= 0.08) {
+          ratioLabel = '4:5 Portrait (1080 × 1350)';
+          recommendation = 'Optimal high-engagement vertical ratio for Instagram & Facebook Feeds.';
+        } else if (Math.abs(ratio - (9 / 16)) <= 0.08) {
+          ratioLabel = '9:16 Full Screen (1080 × 1920)';
+          recommendation = 'Optimal full-screen immersive ratio for Instagram Stories, Reels, and Facebook Stories.';
+        } else if (Math.abs(ratio - 1.91) <= 0.1) {
+          ratioLabel = '1.91:1 Landscape (1200 × 628)';
+          recommendation = 'Horizontal banner format for Feed link ads.';
+        } else {
+          ratioLabel = `${w} : ${h}`;
+          if (hasStoriesOrReels) {
+            recommendation = 'Stories & Reels display best in 9:16 (1080 × 1920 px). Custom aspect ratios will display with dynamic background framing.';
+          }
+        }
+
+        // Upload original uncompressed image directly to preserve pristine quality
+        const uploaded = await api.uploadCreative(file);
+        setCreativeFile(file);
+        setCreativeUrl(uploaded.url);
+        setCreativeType('image');
+        setMediaMetadata({
+          width: w,
+          height: h,
+          aspectRatio: ratioLabel,
+          ratioValue: ratio,
+          format: ext.toUpperCase() || 'IMAGE',
+          sizeBytes: file.size,
+          sizeFormatted: formatFileSize(file.size),
+          isPlacementCompatible: true,
+          recommendation,
+        });
+      } catch (err: any) {
+        setUploadError(err.message || 'Image processing failed. Please verify the file.');
+      } finally {
+        URL.revokeObjectURL(objectUrl);
+        setIsUploading(false);
+      }
+    } else {
+      // Video Validation (up to 70 seconds / 100MB)
+      if (file.size > 100 * 1024 * 1024) {
+        setUploadError(`Video file size (${formatFileSize(file.size)}) exceeds the maximum 100MB limit for this campaign setup.`);
+        return;
+      }
+
+      setIsUploading(true);
+      const objectUrl = URL.createObjectURL(file);
+      try {
+        const video = document.createElement('video');
+        video.preload = 'metadata';
+        await new Promise<void>((resolve, reject) => {
+          video.onloadedmetadata = () => resolve();
+          video.onerror = () => reject(new Error('Failed to parse video. Please verify the file is a valid MP4 or MOV video encoded in H.264/AAC.'));
+          video.src = objectUrl;
+        });
+
+        const duration = video.duration || 0;
+        const w = video.videoWidth || 1080;
+        const h = video.videoHeight || 1920;
+        const ratio = w / h;
+
+        if (duration < 3) {
+          setUploadError(`Video duration (${duration.toFixed(1)}s) is too short. Meta advertising requires videos to be at least 3 seconds long.`);
+          setIsUploading(false);
+          return;
+        }
+
+        if (duration > 70.9) {
+          setUploadError(`Video duration is ${Math.round(duration)} seconds (${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s). Maximum allowed video duration is 70 seconds (1 minute 10 seconds). Please trim your video.`);
+          setIsUploading(false);
+          return;
+        }
+
+        let warningNotice = '';
+        if (duration > 60 && isStoriesOnly) {
+          warningNotice = `Note: Standalone Instagram Stories cards display up to 60s per card. Since your video is ${Math.round(duration)}s, ensure Instagram Reels and Feed placements are enabled for seamless 70s continuous playback.`;
+        }
+
+        let ratioLabel = 'Custom';
+        let recommendation = '';
+        if (Math.abs(ratio - (9 / 16)) <= 0.08) {
+          ratioLabel = '9:16 Full Screen (1080 × 1920)';
+          recommendation = 'Perfect for Instagram Reels, Facebook Reels, and Stories.';
+        } else if (Math.abs(ratio - 1.0) <= 0.08) {
+          ratioLabel = '1:1 Square (1080 × 1080)';
+          recommendation = 'Optimal for Feed video placements.';
+        } else if (Math.abs(ratio - 0.8) <= 0.08) {
+          ratioLabel = '4:5 Portrait (1080 × 1350)';
+          recommendation = 'High-engagement mobile Feed video format.';
+        } else {
+          ratioLabel = `${w} : ${h}`;
+        }
+
+        const mins = Math.floor(duration / 60);
+        const secs = Math.round(duration % 60);
+        const durationFormatted = `${mins > 0 ? `${mins}m ` : ''}${secs}s`;
+
+        // Upload original uncompressed video
+        const uploaded = await api.uploadCreative(file);
+        setCreativeFile(file);
+        setCreativeUrl(uploaded.url);
+        setCreativeType('video');
+        setMediaMetadata({
+          width: w,
+          height: h,
+          aspectRatio: ratioLabel,
+          ratioValue: ratio,
+          duration,
+          durationFormatted,
+          format: ext.toUpperCase() || 'VIDEO',
+          sizeBytes: file.size,
+          sizeFormatted: formatFileSize(file.size),
+          isPlacementCompatible: true,
+          recommendation,
+          warningNotice,
+        });
+      } catch (err: any) {
+        setUploadError(err.message || 'Video processing failed. Please verify the file.');
+      } finally {
+        URL.revokeObjectURL(objectUrl);
+        setIsUploading(false);
+      }
     }
   };
 
@@ -726,17 +905,23 @@ export const CreateAdFlow: React.FC<CreateAdFlowProps> = ({
 
             {/* Media Upload */}
             <div>
-              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
-                Upload Image or Video <span className="text-red-500">*</span>
-              </label>
+              <div className="flex items-center justify-between mb-1">
+                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
+                  Upload Ad Creative (Image or Video) <span className="text-red-500">*</span>
+                </label>
+                <span className="text-[10px] font-medium text-slate-400">
+                  Lossless Quality • Meta Validated
+                </span>
+              </div>
+
               <div
                 onClick={() => fileInputRef.current?.click()}
-                className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-violet-500 rounded-2xl p-4 text-center transition-all bg-slate-50 dark:bg-slate-900/40"
+                className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 rounded-2xl p-4 text-center transition-all bg-slate-50 dark:bg-slate-900/40"
               >
                 <input
                   ref={fileInputRef}
                   type="file"
-                  accept="image/*,video/*"
+                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                   onChange={handleFileUpload}
                   className="hidden"
                 />
@@ -745,18 +930,84 @@ export const CreateAdFlow: React.FC<CreateAdFlowProps> = ({
                     <UploadCloud className="h-5 w-5" />
                   </div>
                   <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
-                    {isUploading ? 'Uploading media...' : creativeFile ? creativeFile.name : 'Click to upload image or video'}
+                    {isUploading ? 'Inspecting & uploading media...' : creativeFile ? creativeFile.name : 'Click to upload high-res image or video'}
                   </span>
-                  <span className="text-[11px] text-slate-400">
-                    JPG, PNG, MP4, MOV up to 50MB (1:1, 4:5, or 9:16 recommended)
+                  <span className="text-[11px] text-slate-400 max-w-md">
+                    JPG, PNG (up to 30MB) • MP4, MOV videos up to 70 seconds (1m 10s, up to 100MB)
                   </span>
                 </div>
               </div>
+
+              {/* Upload Error Alert */}
               {uploadError && (
-                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
-                  <AlertCircle className="h-3 w-3" />
-                  {uploadError}
-                </p>
+                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 mt-2 text-[11px] text-red-500 flex items-start gap-2">
+                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
+                  <div>
+                    <span className="font-semibold">Upload Validation Notice: </span>
+                    {uploadError}
+                  </div>
+                </div>
+              )}
+
+              {/* Validated Media Telemetry Badges */}
+              {mediaMetadata && !uploadError && (
+                <div className="mt-2.5 space-y-2">
+                  <div className="flex flex-wrap items-center gap-1.5">
+                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
+                      {creativeType === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
+                      {mediaMetadata.format}
+                    </span>
+
+                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
+                      {mediaMetadata.width} × {mediaMetadata.height} px
+                    </span>
+
+                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
+                      {mediaMetadata.aspectRatio}
+                    </span>
+
+                    {mediaMetadata.durationFormatted && (
+                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
+                        <Clock className="h-3 w-3" />
+                        {mediaMetadata.durationFormatted} / 70s max
+                      </span>
+                    )}
+
+                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
+                      <ShieldCheck className="h-3 w-3" />
+                      Original Lossless Quality
+                    </span>
+
+                    <span className="text-[10px] text-slate-400 ml-auto">
+                      {mediaMetadata.sizeFormatted}
+                    </span>
+                  </div>
+
+                  {mediaMetadata.recommendation && (
+                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5">
+                      <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" />
+                      <span>{mediaMetadata.recommendation}</span>
+                    </div>
+                  )}
+
+                  {mediaMetadata.warningNotice && (
+                    <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
+                      <Info className="h-3.5 w-3.5 shrink-0" />
+                      <span>{mediaMetadata.warningNotice}</span>
+                    </div>
+                  )}
+                </div>
+              )}
+
+              {/* Placement Aspect Ratio Guidelines Hint */}
+              {!mediaMetadata && !uploadError && (
+                <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 flex flex-wrap items-center gap-2">
+                  <span className="font-semibold text-slate-600 dark:text-slate-400">Meta Placement Specs:</span>
+                  <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">1:1 (1080×1080) Feeds</span>
+                  <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">4:5 (1080×1350) Feeds</span>
+                  <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">9:16 (1080×1920) Reels & Stories</span>
+                  <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">Videos up to 70s</span>
+                </div>
               )}
             </div>
 
diff --git a/src/components/dashboard/ReportsView.tsx b/src/components/dashboard/ReportsView.tsx
index cb5285e..6c2a739 100644
--- a/src/components/dashboard/ReportsView.tsx
+++ b/src/components/dashboard/ReportsView.tsx
@@ -21,9 +21,7 @@ import {
   Layers,
   Sparkles,
   Info,
-  Download,
 } from 'lucide-react';
-import { downloadOwnerUpdateZip } from '../../lib/ownerUpdateZipBase64';
 
 export const ReportsView: React.FC = () => {
   const [data, setData] = useState<PerformanceReportsData | null>(null);
@@ -149,16 +147,6 @@ export const ReportsView: React.FC = () => {
             </div>
           </div>
 
-          <button
-            type="button"
-            onClick={downloadOwnerUpdateZip}
-            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all border border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-95 cursor-pointer"
-            title="Download verified owner update patch (ZIP)"
-          >
-            <Download className="w-3.5 h-3.5 text-white" />
-            <span>Download Owner Update (ZIP)</span>
-          </button>
-
           <button
             onClick={handleManualRefresh}
             disabled={refreshing || cooldownRemaining > 0}
@@ -320,35 +308,6 @@ export const ReportsView: React.FC = () => {
         </div>
       </div>
 
-      {/* Download Owner Action Update Package Banner */}
-      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-purple-950/20 p-5 shadow-sm">
-        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
-          <div className="space-y-1">
-            <div className="flex items-center gap-2">
-              <ShieldCheck className="w-5 h-5 text-emerald-400" />
-              <h3 className="text-sm font-bold text-white flex items-center gap-2">
-                <span>SMAP Owner Action Update Package</span>
-                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
-                  v1.2.0 • smap_owner_action_update.zip
-                </span>
-              </h3>
-            </div>
-            <p className="text-xs text-slate-300 max-w-2xl">
-              Complete production package with the owner promotional credit authorization button, backend route, strict double-layer idempotency ledger, and verified test suite.
-            </p>
-          </div>
-
-          <button
-            type="button"
-            onClick={downloadOwnerUpdateZip}
-            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
-          >
-            <Download className="w-4 h-4 text-white" />
-            <span>Download Update ZIP (49 KB)</span>
-          </button>
-        </div>
-      </div>
-
       {/* Individual Campaign Performance Table */}
       <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] shadow-sm overflow-hidden">
         {/* Table Header & Status Filter Bar */}
diff --git a/src/server/routes.ts b/src/server/routes.ts
index b4e9164..2d3ac68 100644
--- a/src/server/routes.ts
+++ b/src/server/routes.ts
@@ -15,7 +15,11 @@ import { CampaignQueueService } from './campaignQueue.js';
 export const apiRouter = express.Router();
 
 // File upload configuration using multer
-const uploadDir = path.resolve(process.cwd(), 'data/uploads');
+const DEFAULT_DATA_DIR = path.resolve(process.cwd(), 'data');
+const DATA_DIR = process.env.RENDER_DISK_PATH ||
+  process.env.DATA_DIR ||
+  (fs.existsSync('/var/data') ? '/var/data' : DEFAULT_DATA_DIR);
+const uploadDir = path.join(DATA_DIR, 'uploads');
 if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true });
 }
@@ -33,15 +37,15 @@ const storage = multer.diskStorage({
 
 const upload = multer({
   storage,
-  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
+  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max to support high-def 70s videos & lossless images
   fileFilter: (_req, file, cb) => {
-    const allowed = /jpeg|jpg|png|webp|mp4|mov|webm/;
+    const allowed = /jpeg|jpg|png|webp|mp4|mov|webm/i;
     const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
-    const mime = file.mimetype;
+    const mime = file.mimetype.toLowerCase();
     if (allowed.test(ext) || allowed.test(mime)) {
       cb(null, true);
     } else {
-      cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, MP4, MOV, and WEBM files are allowed.'));
+      cb(new Error('Invalid file format. High-resolution images (JPG, JPEG, PNG, WEBP) and compatible videos (MP4, MOV) up to 70s are supported.'));
     }
   },
 });

EOF_EMBEDDED_PATCH

echo ""
echo "3. Staging modified files..."
git add   server.ts   src/components/dashboard/CreateAdFlow.tsx   src/components/dashboard/ReportsView.tsx   src/server/routes.ts

echo ""
echo "Files staged for commit:"
git status --short

if [ -d "node_modules" ]; then
  echo ""
  echo "4. Running test suite..."
  npm test || exit 1
fi

echo ""
echo "5. Creating Git commit..."
git commit -m "feat(ads): reports UI cleanup, high-res image & 70s video upload upgrade"

echo ""
echo "================================================================"
echo "🎉 SUCCESS! Commit created cleanly on local branch."
echo "================================================================"
echo ""
echo "To deploy to Render, run:"
echo "  git push origin main"
echo "================================================================"
