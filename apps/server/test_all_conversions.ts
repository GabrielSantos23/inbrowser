import fs from "node:fs";
import path from "node:path";
import { resolve } from "node:path";

const API_URL = "http://localhost:3000/api/convert";

function log(msg: string) {
  process.stdout.write(msg + "\n");
}
const FILES_DIR = resolve(
  "/mnt/hd-compartilhado/projects/InBrowser/apps/server/files",
);
const OUTPUT_DIR = resolve(
  "/mnt/hd-compartilhado/projects/InBrowser/apps/server/test_outputs",
);
const GENERATED_FILES_DIR = resolve(
  "/mnt/hd-compartilhado/projects/InBrowser/apps/server/generated_test_files",
);

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(GENERATED_FILES_DIR)) fs.mkdirSync(GENERATED_FILES_DIR);

const SUPPORTED_FORMATS = {
  video: {
    input: ["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv", "m4v"],
    output: ["mp4", "webm", "gif", "mp3", "wav", "aac"],
  },
  audio: {
    input: ["mp3", "wav", "ogg", "aac", "flac", "m4a", "wma"],
    output: ["mp3", "wav", "ogg", "aac", "flac"],
  },
  image: {
    input: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "avif"],
    output: ["webp", "png", "jpg", "avif", "pdf"],
  },
  document: {
    input: ["pdf", "txt", "md"],
    output: ["pdf", "txt", "jpg", "png", "docx"],
  },
};

const fileRegistry: Record<string, string> = {};

function scanFiles() {
  const files = fs.readdirSync(FILES_DIR);
  for (const file of files) {
    const ext = file.split(".").pop()?.toLowerCase() || "";
    if (!fileRegistry[ext]) {
      fileRegistry[ext] = path.join(FILES_DIR, file);
    }
  }
  const genFiles = fs.readdirSync(GENERATED_FILES_DIR);
  for (const file of genFiles) {
    const ext = file.split(".").pop()?.toLowerCase() || "";
    if (!fileRegistry[ext]) {
      fileRegistry[ext] = path.join(GENERATED_FILES_DIR, file);
    }
  }
}

async function convert(
  filePath: string,
  outputFormat: string,
  saveDir: string,
) {
  const fileName = path.basename(filePath);
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  formData.append("file", blob, fileName);
  formData.append("format", outputFormat);

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(API_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text };
    }

    const result = (await res.json()) as any;
    if (result.success && result.data) {
      const outputBuffer = Buffer.from(result.data, "base64");
      const outPath = path.join(
        saveDir,
        `${path.parse(fileName).name}_to_${outputFormat}.${outputFormat}`,
      );
      fs.writeFileSync(outPath, outputBuffer);
      return { success: true, path: outPath };
    }
    return { success: false, error: "API returned fail" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function bootstrap() {
  log("--- Bootstrapping Missing File Types ---");
  scanFiles();
  const allInputs = new Set(
    Object.values(SUPPORTED_FORMATS).flatMap((c) => c.input),
  );

  let progress = true;
  while (progress) {
    progress = false;
    for (const ext of allInputs) {
      if (fileRegistry[ext]) continue;

      for (const [srcExt, srcPath] of Object.entries(fileRegistry)) {
        let isPossible = false;
        for (const cat of Object.values(SUPPORTED_FORMATS)) {
          if (cat.input.includes(srcExt) && cat.output.includes(ext)) {
            isPossible = true;
            break;
          }
        }

        if (isPossible) {
          log(
            `Creating .${ext} from .${srcExt} (${path.basename(srcPath)})...`,
          );
          const res = await convert(srcPath, ext, GENERATED_FILES_DIR);
          if (res.success && res.path) {
            fileRegistry[ext] = res.path;
            progress = true;
            break;
          }
        }
      }
    }
  }
}

async function runTests() {
  await bootstrap();
  log("\n--- Testing All Possible Pairs ---");

  const results: any[] = [];
  const handled = new Set<string>();

  for (const [_, cat] of Object.entries(SUPPORTED_FORMATS)) {
    for (const inputExt of cat.input) {
      const srcPath = fileRegistry[inputExt];
      if (!srcPath) {
        log(`[SKIP] No source for .${inputExt}`);
        continue;
      }

      for (const outputExt of cat.output) {
        if (inputExt === outputExt) continue;
        const key = `${inputExt}->${outputExt}`;
        if (handled.has(key)) continue;

        log(`[TEST] ${key}`);
        const res = await convert(srcPath, outputExt, OUTPUT_DIR);
        results.push({ key, success: res.success, error: res.error });
        handled.add(key);
      }
    }
  }

  log("\n" + "=".repeat(30));
  log("SUMMARY");
  log("=".repeat(30));
  const passed = results.filter((r) => r.success).length;
  log(`Passed: ${passed} / ${results.length}`);

  if (passed < results.length) {
    log("\nFAILURES:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        log(`- ${r.key}: ${r.error}`);
      });
  }
}

runTests().catch((e) => log(e.message));
