import pdfParse from "pdf-parse";
import fs from "fs";

async function test() {
  try {
    const buffer = fs.readFileSync("apps/server/files/file-sample_150kB.pdf");
    console.log("Buffer size:", buffer.length);
    const data = await pdfParse(buffer);
    console.log("Text length:", data.text.length);
    console.log("First 100 chars:", data.text.substring(0, 100));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
