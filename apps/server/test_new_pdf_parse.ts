import { PDFParse } from "pdf-parse";
import fs from "fs";

async function test() {
  try {
    const buffer = fs.readFileSync("files/file-sample_150kB.pdf");
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const data = await parser.getText();
    console.log("Keys of result:", Object.keys(data));
    console.log("Text preview:", data.text?.substring(0, 100));
    await parser.destroy();
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
