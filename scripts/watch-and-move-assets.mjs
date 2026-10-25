import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
import chokidar from 'chokidar';
import sharp from 'sharp';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const WATCH_DIR = path.resolve(REPO_ROOT, 'public/projects');
const EXTERNAL_BACKUP_DIR = path.resolve(REPO_ROOT, '../Original_Raw_Assets');
const SCANNED_JSON = path.resolve(REPO_ROOT, 'src/data/scannedProjectFolders.json');

if (!fs.existsSync(EXTERNAL_BACKUP_DIR)) {
  fs.mkdirSync(EXTERNAL_BACKUP_DIR, { recursive: true });
}

console.log(`[Auto-Asset-Pipeline] Monitoring images & videos in: ${WATCH_DIR}`);
console.log(`[Auto-Asset-Pipeline] Originals will move to: ${EXTERNAL_BACKUP_DIR}`);

// Maintain active processing set and processed set to prevent duplicate triggers & infinite loops
const processing = new Set();
const processedFiles = new Set();

// Helper for safe move across filesystems (EXDEV fallback)
function safeMoveSync(source, destination) {
  try {
    fs.renameSync(source, destination);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(source, destination);
      fs.unlinkSync(source);
    } else {
      throw err;
    }
  }
}

// Helper to update scannedProjectFolders.json so new assets are immediately visible
function updateScannedFolders(folderName, newAssetRel, oldAssetRel = null) {
  try {
    if (!fs.existsSync(SCANNED_JSON)) return;
    const raw = fs.readFileSync(SCANNED_JSON, 'utf-8');
    const scanned = JSON.parse(raw);
    const proj = scanned.find((p) => p.folder === folderName);
    if (proj && Array.isArray(proj.media)) {
      if (oldAssetRel && oldAssetRel !== newAssetRel) {
        const oldIndex = proj.media.indexOf(oldAssetRel);
        if (oldIndex !== -1) {
          proj.media[oldIndex] = newAssetRel;
        } else if (!proj.media.includes(newAssetRel)) {
          proj.media.push(newAssetRel);
        }
      } else if (!proj.media.includes(newAssetRel)) {
        proj.media.push(newAssetRel);
      }
      fs.writeFileSync(SCANNED_JSON, JSON.stringify(scanned, null, 2), 'utf-8');
      console.log(`[Auto-Asset-Pipeline] Updated scannedProjectFolders.json with: ${newAssetRel}`);
    }
  } catch (e) {
    // Non-critical, vite watcher will also handle it
  }
}

// Helper to check if a video is already optimized and compressed
async function isAlreadyOptimizedVideo(filePath, destinationPath) {
  if (processedFiles.has(filePath)) return true;

  try {
    const { stdout } = await execPromise(
      `ffprobe -v quiet -show_entries format_tags=comment -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    if (stdout.trim().toLowerCase().includes('optimized_asset')) {
      return true;
    }
  } catch {
    // ffprobe error or no tag
  }

  return false;
}

// Helper to run FFmpeg compression ensuring size reduction
async function compressWithFFmpeg(inputPath, outputPath, initialCrf = 22) {
  const origStat = fs.statSync(inputPath);
  const origBytes = origStat.size;
  let chosenCrf = initialCrf;

  const runCommand = async (crf) => {
    // FFmpeg compression command: web-optimized, high quality, faststart, yuv420p
    const cmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -crf ${crf} -preset medium -pix_fmt yuv420p -movflags +faststart -metadata comment="optimized_asset" "${outputPath}"`;
    await execPromise(cmd);
  };

  await runCommand(chosenCrf);
  let compStat = fs.statSync(outputPath);

  // If the result is larger than or equal to original raw video, attempt higher CRF (24, then 26) to achieve size reduction
  if (compStat.size >= origBytes) {
    for (const testCrf of [24, 26]) {
      chosenCrf = testCrf;
      await runCommand(chosenCrf);
      compStat = fs.statSync(outputPath);
      if (compStat.size < origBytes) break;
    }
  }

  return {
    origBytes,
    compBytes: compStat.size,
    crf: chosenCrf
  };
}

// Process a single video file (live watch or retroactive)
async function processVideo(filePath, rawSourceOverride = null) {
  if (!fs.existsSync(filePath) && !rawSourceOverride) return null;
  const parsed = path.parse(filePath);

  if (processing.has(filePath) || parsed.name.endsWith('_temp_opt') || parsed.name.endsWith('_optimized')) {
    return null;
  }

  const relativeToWatch = path.relative(WATCH_DIR, filePath);
  const destinationPath = path.join(EXTERNAL_BACKUP_DIR, relativeToWatch);
  const destinationDir = path.dirname(destinationPath);

  // Check if already compressed to avoid infinite loops or re-compressing existing videos
  if (!rawSourceOverride && (await isAlreadyOptimizedVideo(filePath, destinationPath))) {
    processedFiles.add(filePath);
    return null;
  }

  processing.add(filePath);

  const tempOptimizedPath = path.join(parsed.dir, `${parsed.name}_temp_opt.mp4`);
  const finalLocalPath = path.join(parsed.dir, `${parsed.name}.mp4`);

  try {
    const rawInput = rawSourceOverride || filePath;
    const beforeStat = fs.statSync(rawInput);
    const beforeMB = (beforeStat.size / (1024 * 1024)).toFixed(2);

    console.log(`[Auto-Video] Compressing: ${relativeToWatch} (${beforeMB} MB) via FFmpeg...`);

    const { compBytes, crf } = await compressWithFFmpeg(rawInput, tempOptimizedPath, 22);
    const afterMB = (compBytes / (1024 * 1024)).toFixed(2);
    const pctSaved = (((beforeStat.size - compBytes) / beforeStat.size) * 100).toFixed(1);

    // Ensure mirrored directory exists in EXTERNAL_BACKUP_DIR
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Move raw original to EXTERNAL_BACKUP_DIR preserving identical subfolder path
    if (!rawSourceOverride && !fs.existsSync(destinationPath)) {
      safeMoveSync(filePath, destinationPath);
      console.log(`[Auto-Video] Moved original raw video to: ${destinationPath}`);
    } else if (rawSourceOverride && rawSourceOverride !== destinationPath) {
      safeMoveSync(rawSourceOverride, destinationPath);
      console.log(`[Auto-Video] Mirrored original raw video to: ${destinationPath}`);
    }

    // Mark final path as processed before renaming to avoid re-triggering watcher
    processedFiles.add(finalLocalPath);

    // Clean up original non-mp4 if applicable (.mov / .webm)
    if (filePath !== finalLocalPath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    // Replace local version with compressed web file
    safeMoveSync(tempOptimizedPath, finalLocalPath);
    console.log(`[Auto-Video] Saved compressed web version: ${parsed.name}.mp4 (${beforeMB} MB -> ${afterMB} MB, ${pctSaved}% reduced, CRF ${crf})`);

    // Update scannedProjectFolders.json if needed
    const parts = relativeToWatch.split(path.sep);
    if (parts.length > 0) {
      const folderName = parts[0];
      const videoRel = path.relative(path.join(WATCH_DIR, folderName), finalLocalPath).replace(/\\/g, '/');
      const oldRel = path.relative(path.join(WATCH_DIR, folderName), filePath).replace(/\\/g, '/');
      updateScannedFolders(folderName, videoRel, oldRel);
    }

    return {
      file: relativeToWatch,
      beforeMB: `${beforeMB} MB`,
      afterMB: `${afterMB} MB`,
      pctSaved: `${pctSaved}%`,
      crf
    };
  } catch (err) {
    console.error(`[Auto-Video] Failed compressing ${parsed.base}:`, err.message);
    if (fs.existsSync(tempOptimizedPath)) {
      try {
        fs.unlinkSync(tempOptimizedPath);
      } catch {}
    }
    return null;
  } finally {
    processing.delete(filePath);
  }
}

async function processImage(filePath) {
  if (!fs.existsSync(filePath)) return;
  const parsed = path.parse(filePath);

  if (processing.has(filePath)) return;
  processing.add(filePath);

  const targetWebP = path.join(parsed.dir, `${parsed.name}.webp`);

  try {
    console.log(`[Auto-Image] Converting: ${parsed.base} -> ${parsed.name}.webp`);

    await sharp(filePath)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({
        quality: 82,
        effort: 6,
        smartSubsample: true
      })
      .toFile(targetWebP);

    console.log(`[Auto-Image] Successfully created: ${parsed.name}.webp`);

    const relativeToWatch = path.relative(WATCH_DIR, filePath);
    const destinationPath = path.join(EXTERNAL_BACKUP_DIR, relativeToWatch);
    const destinationDir = path.dirname(destinationPath);

    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    safeMoveSync(filePath, destinationPath);
    console.log(`[Auto-Image] Moved original image to: ${destinationPath}`);

    const parts = relativeToWatch.split(path.sep);
    if (parts.length > 0) {
      const folderName = parts[0];
      const webpRel = path.relative(path.join(WATCH_DIR, folderName), targetWebP).replace(/\\/g, '/');
      const oldRel = path.relative(path.join(WATCH_DIR, folderName), filePath).replace(/\\/g, '/');
      updateScannedFolders(folderName, webpRel, oldRel);
    }
  } catch (err) {
    console.error(`[Auto-Image] Failed processing ${parsed.base}:`, err.message);
  } finally {
    processing.delete(filePath);
  }
}

// Recursively find all files matching extensions in dir
function findFilesRecursively(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursively(fullPath, extensions));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// 1. One-time pass to ensure all raw backups in EXTERNAL_BACKUP_DIR mirror subfolder hierarchy
function ensureMirroredRawHierarchy() {
  const publicVideos = findFilesRecursively(WATCH_DIR, ['.mp4', '.mov', '.webm']);
  for (const vidPath of publicVideos) {
    const rel = path.relative(WATCH_DIR, vidPath);
    const mirroredDest = path.join(EXTERNAL_BACKUP_DIR, rel);
    if (!fs.existsSync(mirroredDest)) {
      // Check if unnested exists in EXTERNAL_BACKUP_DIR (e.g. BMW or Tata Motors or EAAA)
      const parts = rel.split(path.sep);
      const folder = parts[0];
      const basename = path.basename(vidPath);
      const unnested = path.join(EXTERNAL_BACKUP_DIR, folder, basename);
      if (fs.existsSync(unnested)) {
        const destDir = path.dirname(mirroredDest);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        safeMoveSync(unnested, mirroredDest);
        console.log(`[Asset-Mirror] Mirrored unnested raw backup: ${folder}/${basename} -> ${rel}`);
      }
    }
  }
}

// 2. Retroactive scan and compress pass across all subfolders
async function runRetroactiveCompressionPass() {
  console.log('\n=============================================================');
  console.log('[Retroactive Pass] Scanning public/projects/** for uncompressed videos...');
  console.log('=============================================================');

  ensureMirroredRawHierarchy();

  const publicVideos = findFilesRecursively(WATCH_DIR, ['.mp4', '.mov', '.webm']);
  console.log(`[Retroactive Pass] Found ${publicVideos.length} total video files across subfolders.`);

  const processedReport = [];

  for (const vidPath of publicVideos) {
    const rel = path.relative(WATCH_DIR, vidPath);
    const mirroredDest = path.join(EXTERNAL_BACKUP_DIR, rel);

    // Check if it is already verified and compressed
    const alreadyDone = await isAlreadyOptimizedVideo(vidPath, mirroredDest);
    if (alreadyDone) {
      processedFiles.add(vidPath);
      continue;
    }

    console.log(`[Retroactive Pass] Processing for compression: ${rel}`);
    // If raw original is available in EXTERNAL_BACKUP_DIR, use it as raw input source
    const rawSource = fs.existsSync(mirroredDest) ? mirroredDest : null;
    const result = await processVideo(vidPath, rawSource);
    if (result) {
      processedReport.push(result);
    }
  }

  if (processedReport.length > 0) {
    console.log('\n=============================================================');
    console.log('[Retroactive Pass] RETROACTIVE COMPRESSION SUMMARY:');
    console.log('=============================================================');
    for (const r of processedReport) {
      console.log(`  - ${r.file}: ${r.beforeMB} -> ${r.afterMB} (${r.pctSaved} saved, CRF ${r.crf})`);
    }
    console.log('=============================================================\n');
  } else {
    console.log('[Retroactive Pass] All existing videos are verified and compressed.\n');
  }
}

// Initialize watcher with recursive subfolder monitoring
function startWatcher() {
  const watcher = chokidar.watch(WATCH_DIR, {
    ignored: /(^|[\/\\])\..|.*\.webp$|.*_temp_opt\.(mp4|mov|webm)$/i,
    persistent: true,
    ignoreInitial: true, // Retroactive pass handles initial existing files
    depth: 99, // Recursively monitor all nested subfolder depths
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 200
    }
  });

  watcher.on('add', (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      processImage(filePath);
    } else if (['.mp4', '.mov', '.webm'].includes(ext)) {
      processVideo(filePath);
    }
  });

  watcher.on('ready', () => {
    console.log('[Auto-Asset-Pipeline] Live deep recursive subfolder watcher active and ready.');
  });
}

// Main execution: Run retroactive pass immediately, then keep watching live
(async () => {
  try {
    await runRetroactiveCompressionPass();
  } catch (err) {
    console.error('[Retroactive Pass] Error during pass:', err);
  }
  startWatcher();
})();
