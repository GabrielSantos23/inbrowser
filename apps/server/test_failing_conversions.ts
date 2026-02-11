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

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

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
    const id = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

async function testFailingConversions() {
  log("--- Testing Previously Failing Conversions ---");

  const tests = [
    {
      input:
        "generated_test_files/file_example_AVI_480_750kB_to_1770681156120.gif",
      output: "png",
      key: "gif->png",
    },
    {
      input:
        "generated_test_files/file_example_AVI_480_750kB_to_1770681156120.gif",
      output: "jpg",
      key: "gif->jpg",
    },
    {
      input:
        "generated_test_files/file_example_AVI_480_750kB_to_1770681156120.gif",
      output: "avif",
      key: "gif->avif",
    },
    {
      input:
        "generated_test_files/file_example_AVI_480_750kB_to_1770681156120.gif",
      output: "pdf",
      key: "gif->pdf",
    },

    {
      input: "files/Animais_Cat_November_2010-1a.png",
      output: "pdf",
      key: "png->pdf",
    },
    {
      input: "generated_test_files/sample.jpeg",
      output: "pdf",
      key: "jpeg->pdf",
    },

    { input: "files/file-sample_150kB.pdf", output: "jpg", key: "pdf->jpg" },
    { input: "files/file-sample_150kB.pdf", output: "png", key: "pdf->png" },

    { input: "generated_test_files/sample.md", output: "jpg", key: "md->jpg" },
    { input: "generated_test_files/sample.md", output: "png", key: "md->png" },
  ];

  const results: any[] = [];

  for (const test of tests) {
    if (!fs.existsSync(test.input)) {
      log(`[SKIP] ${test.key}: Source file not found (${test.input})`);
      continue;
    }

    log(`[TEST] ${test.key}`);
    const res = await convert(test.input, test.output, OUTPUT_DIR);
    results.push({ key: test.key, success: res.success, error: res.error });

    if (res.success) {
      log(`  ✓ Success`);
    } else {
      log(`  ✗ Failed: ${res.error}`);
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

testFailingConversions().catch((e) => log(e.message));
