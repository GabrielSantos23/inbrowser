import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { initTRPC } from "@trpc/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

// Environment
const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3001", 10),
};

// tRPC setup
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

// tRPC Router
const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
});

// Hono App
const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: () => ({}),
  }),
);

app.post("/api/convert", async (c) => {
  let file: File;
  let format: string;

  try {
    const formData = await c.req.formData();
    const f = formData.get("file");
    const fmt = formData.get("format");

    if (!f || !(f instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }
    if (!fmt) {
      return c.json({ error: "No target format provided" }, 400);
    }
    file = f;
    format = fmt as string;
  } catch (e) {
    console.error("Form data parsing error:", e);
    return c.json({ error: "Invalid form data or upload failed" }, 400);
  }

  const inputExt = file.name.split(".").pop()?.toLowerCase() || "";
  const outputExt = format.toLowerCase();

  console.log(`Conversion request: ${inputExt} -> ${outputExt}`);

  try {
    let result: Buffer | string = "";
    let contentType: string = "";
    let filename: string = "";

    // Validation: Check if conversion is supported

    // Convert to PDF
    if (outputExt === "pdf") {
      if (inputExt === "txt" || inputExt === "md") {
        const text = await file.text();
        const pdf = new jsPDF();
        const lines = pdf.splitTextToSize(text, 180);
        pdf.text(lines, 15, 15);
        result = Buffer.from(pdf.output("arraybuffer"));
        contentType = "application/pdf";
        filename = file.name.replace(/\.[^/.]+$/, ".pdf");
      } else if (
        ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "avif"].includes(inputExt)
      ) {
        // Convert image to PDF using FFmpeg for better format support
        const { default: fluentFfmpeg } = await import("fluent-ffmpeg");
        const { default: ffmpegPath } = await import("ffmpeg-static");
        const fs = await import("node:fs");
        const path = await import("node:path");
        const { tmpdir } = await import("node:os");

        if (ffmpegPath) {
          fluentFfmpeg.setFfmpegPath(ffmpegPath);
        }

        const tempDir = fs.mkdtempSync(path.join(tmpdir(), "convert-"));
        const inputPath = path.join(tempDir, `input.${inputExt}`);
        const outputPath = path.join(tempDir, "output.pdf");

        try {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          await fs.promises.writeFile(inputPath, fileBuffer);

          await new Promise((resolve, reject) => {
            fluentFfmpeg(inputPath)
              .output(outputPath)
              .on("end", resolve)
              .on("error", reject)
              .run();
          });

          result = Buffer.from(await fs.promises.readFile(outputPath));
          contentType = "application/pdf";
          filename = file.name.replace(/\.[^/.]+$/, ".pdf");
        } catch (err) {
          console.error("Image to PDF conversion failed:", err);
          // Fallback to jsPDF for basic formats or convert complex formats first
          if (["jpg", "jpeg", "png"].includes(inputExt)) {
            const pdf = new jsPDF();
            const imgData = Buffer.from(await file.arrayBuffer()).toString("base64");
            const imgType = inputExt === "png" ? "PNG" : "JPEG";
            pdf.addImage(imgData, imgType, 10, 10, 190, 0);
            result = Buffer.from(pdf.output("arraybuffer"));
            contentType = "application/pdf";
            filename = file.name.replace(/\.[^/.]+$/, ".pdf");
          } else if (["gif", "webp", "bmp", "tiff", "avif"].includes(inputExt)) {
            // Convert complex image to PNG first, then use jsPDF
            try {
              const tempImagePath = path.join(tempDir, `temp.png`);
              await new Promise((resolve, reject) => {
                const command = fluentFfmpeg(inputPath)
                  .output(tempImagePath)
                  .outputOptions([
                    "-vf", "select=eq(n\\,0)", // Select first frame
                    "-vsync", "0", // No frame sync
                    "-frames:v", "1", // Only one frame
                    "-q:v", "2", // High quality
                    "-update", "1" // Required for single image
                  ])
                  .on("end", resolve)
                  .on("error", reject);
                command.run();
              });
              
              const tempImageBuffer = Buffer.from(await fs.promises.readFile(tempImagePath));
              const pdf = new jsPDF();
              const imgData = tempImageBuffer.toString("base64");
              pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
              result = Buffer.from(pdf.output("arraybuffer"));
              contentType = "application/pdf";
              filename = file.name.replace(/\.[^/.]+$/, ".pdf");
            } catch (conversionErr) {
              console.error("Complex image to PDF conversion failed:", conversionErr);
              return c.json(
                {
                  error: `Cannot convert ${inputExt.toUpperCase()} to PDF directly via document task.`,
                },
                400,
              );
            }
          } else {
            return c.json(
              {
                error: `Cannot convert ${inputExt.toUpperCase()} to PDF directly via document task.`,
              },
              400,
            );
          }
        } finally {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
          }
        }
      } else {
        return c.json(
          {
            error: `Cannot convert ${inputExt.toUpperCase()} to PDF directly via document task.`,
          },
          400,
        );
      }
    }
    // Convert to DOCX
    else if (outputExt === "docx") {
      if (inputExt === "txt" || inputExt === "md") {
        const text = await file.text();
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: text,
                      size: 24,
                    }),
                  ],
                }),
              ],
            },
          ],
        });

        const buffer = await Packer.toBuffer(doc);
        result = buffer;
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        filename = file.name.replace(/\.[^/.]+$/, ".docx");
      } else {
        return c.json(
          {
            error: `Cannot convert ${inputExt.toUpperCase()} to DOCX directly via document task.`,
          },
          400,
        );
      }
    }
    // Convert to TXT
    else if (outputExt === "txt") {
      if (inputExt === "txt" || inputExt === "md") {
        const text = await file.text();
        result = text;
        contentType = "text/plain";
        filename = file.name.replace(/\.[^/.]+$/, ".txt");
      } else if (inputExt === "pdf") {
        const { PDFParse } = await import("pdf-parse");
        const buffer = Buffer.from(await file.arrayBuffer());
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        result = data.text;
        contentType = "text/plain";
        filename = file.name.replace(/\.[^/.]+$/, ".txt");
        await parser.destroy();
      } else {
        return c.json(
          {
            error: `Cannot convert ${inputExt.toUpperCase()} to TXT directly via document task.`,
          },
          400,
        );
      }
    }
// PDF to Image conversion
    else if (
      inputExt === "pdf" &&
      (outputExt === "jpg" || outputExt === "png")
    ) {
      try {
        // Check if canvas is available (serverless environments might not have it)
        let createCanvas;
        try {
          const canvasModule = await import("@napi-rs/canvas");
          createCanvas = canvasModule.createCanvas;
        } catch (canvasError) {
          console.warn("Canvas not available for PDF to image conversion:", canvasError);
          return c.json(
            { 
              error: `PDF to ${outputExt.toUpperCase()} conversion requires native dependencies not available in serverless environment.` 
            },
            400,
          );
        }

        // Use pdfjs-dist with proper worker setup
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

        // Set up worker properly - use empty string to use bundled worker
        (pdfjs.GlobalWorkerOptions as any).workerSrc = "";

        const buffer = Buffer.from(await file.arrayBuffer());
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(buffer),
          verbosity: 0,
        });

        const pdfDocument = await loadingTask.promise;
        const page = await pdfDocument.getPage(1); // Get first page
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext("2d");

        await (page as any).render({
          canvasContext: context as any,
          canvas: canvas as any,
          viewport: viewport,
        }).promise;

        if (outputExt === "png") {
          result = await canvas.toBuffer("image/png");
        } else {
          result = await canvas.toBuffer("image/jpeg");
        }
        contentType = outputExt === "png" ? "image/png" : "image/jpeg";
        filename = file.name.replace(/\.[^/.]+$/, `.${outputExt}`);

        await pdfDocument.destroy();
      } catch (pdfError) {
        console.error("PDF to image conversion failed:", pdfError);
        return c.json(
          { error: `PDF to ${outputExt.toUpperCase()} conversion failed: ${pdfError.message}` },
          400,
        );
      }
    }
    // Text to Image conversion
    else if (["txt", "md"].includes(inputExt) && ["jpg", "jpeg", "png", "webp", "avif"].includes(outputExt)) {
      try {
        // Try to import canvas - it might not be available in serverless environments
        const canvasModule = await import("@napi-rs/canvas");
        const createCanvas = canvasModule.createCanvas;
        
        // Use canvas if available
        const textContent = await file.text();
        const lines = textContent.split('\n').slice(0, 20); // Limit to 20 lines
        
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);
        
        // Black text
        ctx.fillStyle = 'black';
        ctx.font = '16px monospace';
        
        let y = 30;
        for (const line of lines) {
          if (y > 580) break; // Stop if we run out of space
          ctx.fillText(line.substring(0, 80), 20, y); // Limit line length
          y += 20;
        }
        
        if (outputExt === "png") {
          result = await canvas.toBuffer("image/png");
        } else {
          result = await canvas.toBuffer("image/jpeg");
        }
        contentType = outputExt === "png" ? "image/png" : "image/jpeg";
        filename = file.name.replace(/\.[^/.]+$/, `.${outputExt}`);
      } catch (canvasError) {
        console.error("Text to image conversion failed:", canvasError);
        return c.json(
          {
            error: `Cannot convert ${inputExt.toUpperCase()} to ${outputExt.toUpperCase()}: Text rendering requires native dependencies not available in serverless environment.`,
          },
          400,
        );
      }
    }
    // General Media Conversion (FFmpeg)
    else {
      // Dynamic imports to avoid issues if deps are missing during build/lint in some envs
      const { default: fluentFfmpeg } = await import("fluent-ffmpeg");
      const { default: ffmpegPath } = await import("ffmpeg-static");
      const fs = await import("node:fs");
      const path = await import("node:path");
      const { tmpdir } = await import("node:os");

      if (ffmpegPath) {
        fluentFfmpeg.setFfmpegPath(ffmpegPath);
      }

      // Create a temporary directory for this conversion
      const tempDir = fs.mkdtempSync(path.join(tmpdir(), "convert-"));
      const inputPath = path.join(tempDir, `input.${inputExt}`);
      const outputPath = path.join(tempDir, `output.${outputExt}`);

      try {
        // Write the input file to disk
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.promises.writeFile(inputPath, fileBuffer);

        console.log(`Starting ffmpeg: ${inputPath} -> ${outputPath}`);

        await new Promise((resolve, reject) => {
          const command = fluentFfmpeg(inputPath).output(outputPath);

          // Special handling for different conversions
          if (inputExt === "gif" && ["png", "jpg", "jpeg", "webp", "avif"].includes(outputExt)) {
            // Convert GIF to static image - extract first frame with better handling
            command.outputOptions([
              "-vf", "select=eq(n\\,0)", // Select first frame
              "-vsync", "0", // No frame sync
              "-frames:v", "1", // Only one frame
              "-q:v", "2", // High quality
              "-update", "1" // Required for single image output
            ]);
} else if (["mp4", "webm", "gif"].includes(outputExt)) {
            command.outputOptions("-preset ultrafast");
          } else if (outputExt === "webp") {
            // WEBP doesn't support ultrafast preset
            command.outputOptions("-preset fast");
          } else if (outputExt === "avif") {
            // Special handling for AVIF to avoid timeout
            command.outputOptions([
              "-preset", "fast", // Use fast preset instead of ultrafast
              "-crf", "30", // Lower quality for faster conversion
              "-t", "10" // Limit to 10 seconds of input
            ]);
          }

          command
            .on("end", () => {
              console.log("FFmpeg conversion finished");
              resolve(null);
            })
            .on("error", (err, _stdout, stderr) => {
              console.error("FFmpeg error:", err.message);
              console.error("FFmpeg stderr:", stderr);
              reject(new Error(`FFmpeg failed: ${err.message}`));
            });

          command.run();
        });

        // Read the result
        result = Buffer.from(await fs.promises.readFile(outputPath));

        // Determine content type
        const contentTypes: Record<string, string> = {
          mp3: "audio/mpeg",
          wav: "audio/wav",
          ogg: "audio/ogg",
          mp4: "video/mp4",
          webm: "video/webm",
          avi: "video/x-msvideo",
          mov: "video/quicktime",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
        };
        contentType = contentTypes[outputExt] || "application/octet-stream";
        filename = file.name.replace(/\.[^/.]+$/, `.${outputExt}`);
      } catch (err: any) {
        console.error("Media conversion processing failed:", err.message);
        return c.json(
          { error: `Incompatible or invalid conversion: ${err.message}` },
          400,
        );
      } finally {
        // Cleanup temp files
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupErr) {
          console.error("Cleanup error:", cleanupErr);
        }
      }
    }

    if (!result) {
      return c.json({ error: "Unsupported conversion" }, 400);
    }

    // Convert result to base64 for JSON response
    const base64Data =
      typeof result === "string"
        ? Buffer.from(result).toString("base64")
        : result.toString("base64");

    return c.json(
      {
        success: true,
        filename: filename,
        contentType: contentType,
        data: base64Data,
        size: result.length,
      },
      200,
    );
  } catch (error) {
    console.error("Conversion error:", error);
    return c.json({ error: "Conversion failed" }, 500);
  }
});

export default app;
