import pdfImgConvert from "pdf-img-convert";
import fs from "fs";

async function test() {
  try {
    const buffer = fs.readFileSync("files/file-sample_150kB.pdf");
    console.log("Input size:", buffer.length);
    const pdfArray = await pdfImgConvert.convert(buffer, { width: 1200 });
    console.log("Pages converted:", pdfArray.length);
    if (pdfArray[0]) {
      fs.writeFileSync(
        "test_outputs/debug_pdf_out.jpg",
        Buffer.from(pdfArray[0]),
      );
      console.log("Saved page 0");
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
