import fs from "node:fs";
import path from "node:path";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const FILES_DIR = resolve(
  "/mnt/hd-compartilhado/projects/InBrowser/apps/server/files",
);
const GENERATED_FILES_DIR = resolve(
  "/mnt/hd-compartilhado/projects/InBrowser/apps/server/generated_test_files",
);

if (!fs.existsSync(GENERATED_FILES_DIR)) fs.mkdirSync(GENERATED_FILES_DIR);

function log(msg: string) {
  process.stdout.write(msg + "\n");
}

// Sample content for different file types
const SAMPLE_TEXT = "This is a sample text file for conversion testing.\nIt contains multiple lines.\nAnd some special characters: @#$%^&*()";

const SAMPLE_MARKDOWN = `# Sample Markdown File

This is a **sample** markdown file for conversion testing.

## Features
- Bold text
- *Italic text*
- Code blocks
- Lists

\`\`\`javascript
console.log("Hello World");
\`\`\`

This should convert properly to other formats.`;

async function createMissingFiles() {
  log("--- Creating Missing Source Files ---");

  const missingFormats = [
    "mov", "mkv", "flv", "wmv", "m4v", // Video
    "m4a", "wma", // Audio  
    "jpeg", "bmp", "tiff", // Images
    "md", // Documents
  ];

  // Check what we already have
  const existingFiles = new Set<string>();
  if (fs.existsSync(FILES_DIR)) {
    const files = fs.readdirSync(FILES_DIR);
    files.forEach(file => {
      const ext = file.split(".").pop()?.toLowerCase();
      if (ext) existingFiles.add(ext);
    });
  }

  if (fs.existsSync(GENERATED_FILES_DIR)) {
    const files = fs.readdirSync(GENERATED_FILES_DIR);
    files.forEach(file => {
      const ext = file.split(".").pop()?.toLowerCase();
      if (ext) existingFiles.add(ext);
    });
  }

  log(`Existing formats: ${Array.from(existingFiles).sort().join(", ")}`);
  log(`Missing formats: ${missingFormats.filter(f => !existingFiles.has(f)).join(", ")}`);

  // Create text-based files
  if (!existingFiles.has("md")) {
    log("Creating sample.md...");
    fs.writeFileSync(path.join(GENERATED_FILES_DIR, "sample.md"), SAMPLE_MARKDOWN);
  }

  // Create image files using FFmpeg from existing images
  const imageFormats = ["jpeg", "bmp", "tiff"];
  for (const format of imageFormats) {
    if (!existingFiles.has(format)) {
      // Find a source image (prefer PNG or JPG)
      let sourceImage: string | null = null;
      if (fs.existsSync(FILES_DIR)) {
        const files = fs.readdirSync(FILES_DIR);
        const imageFile = files.find(f => 
          f.toLowerCase().endsWith(".png") || f.toLowerCase().endsWith(".jpg")
        );
        if (imageFile) sourceImage = path.join(FILES_DIR, imageFile);
      }

      if (sourceImage) {
        log(`Creating ${format} from ${path.basename(sourceImage)}...`);
        try {
          execSync(`ffmpeg -i "${sourceImage}" "${path.join(GENERATED_FILES_DIR, `sample.${format}`)}" -y`, 
            { stdio: 'pipe' });
        } catch (e) {
          log(`Failed to create ${format}: ${e}`);
        }
      }
    }
  }

  // Create video files using FFmpeg from existing videos
  const videoFormats = ["mov", "mkv", "flv", "wmv", "m4v"];
  for (const format of videoFormats) {
    if (!existingFiles.has(format)) {
      // Find a source video
      let sourceVideo: string | null = null;
      if (fs.existsSync(FILES_DIR)) {
        const files = fs.readdirSync(FILES_DIR);
        const videoFile = files.find(f => 
          f.toLowerCase().endsWith(".mp4") || f.toLowerCase().endsWith(".webm")
        );
        if (videoFile) sourceVideo = path.join(FILES_DIR, videoFile);
      }

      if (sourceVideo) {
        log(`Creating ${format} from ${path.basename(sourceVideo)}...`);
        try {
          execSync(`ffmpeg -i "${sourceVideo}" "${path.join(GENERATED_FILES_DIR, `sample.${format}`)}" -y`, 
            { stdio: 'pipe' });
        } catch (e) {
          log(`Failed to create ${format}: ${e}`);
        }
      }
    }
  }

  // Create audio files using FFmpeg from existing audio
  const audioFormats = ["m4a", "wma"];
  for (const format of audioFormats) {
    if (!existingFiles.has(format)) {
      // Find a source audio
      let sourceAudio: string | null = null;
      if (fs.existsSync(FILES_DIR)) {
        const files = fs.readdirSync(FILES_DIR);
        const audioFile = files.find(f => 
          f.toLowerCase().endsWith(".mp3") || f.toLowerCase().endsWith(".wav")
        );
        if (audioFile) sourceAudio = path.join(FILES_DIR, audioFile);
      }

      if (sourceAudio) {
        log(`Creating ${format} from ${path.basename(sourceAudio)}...`);
        try {
          execSync(`ffmpeg -i "${sourceAudio}" "${path.join(GENERATED_FILES_DIR, `sample.${format}`)}" -y`, 
            { stdio: 'pipe' });
        } catch (e) {
          log(`Failed to create ${format}: ${e}`);
        }
      }
    }
  }

  log("\n--- File Generation Complete ---");
}

createMissingFiles().catch(console.error);