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
      } else {
        return c.json(
          {
            error: `Cannot convert ${inputExt.toUpperCase()} to TXT directly via document task.`,
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
        await Bun.write(inputPath, file);

        console.log(`Starting ffmpeg: ${inputPath} -> ${outputPath}`);

        await new Promise((resolve, reject) => {
          const command = fluentFfmpeg(inputPath)
            .output(outputPath)
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

    if (typeof result === "string") {
      return c.body(result, 200, {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
    } else {
      return c.body(new Uint8Array(result), 200, {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
    }
  } catch (error) {
    console.error("Conversion error:", error);
    return c.json({ error: "Conversion failed" }, 500);
  }
});

export default app;
