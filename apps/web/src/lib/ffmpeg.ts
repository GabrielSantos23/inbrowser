export interface FFmpegProgress {
  progress: number;
  time: number;
}

export type ProgressCallback = (progress: FFmpegProgress) => void;

// Keep this for compatibility with existing code calls, but it will do nothing/resolve immediately
export async function loadFFmpeg(
  onProgress?: (loaded: number, total: number) => void,
): Promise<any> {
  onProgress?.(100, 100);
  return Promise.resolve({});
}

// Keep this for compatibility
export function getFFmpeg(): any {
  return {};
}

export interface ConversionOptions {
  inputFile: File;
  outputFormat: string;
  quality?: "low" | "medium" | "high" | "ultra";
  startTime?: number;
  endTime?: number;
  onProgress?: ProgressCallback;
}

export interface ConversionResult {
  blob: Blob;
  fileName: string;
  size: number;
  duration?: number;
}

const API_URL = "http://localhost:3000/api/convert";

export async function convertFile(
  options: ConversionOptions,
): Promise<ConversionResult> {
  const { inputFile, outputFormat, onProgress } = options;

  // Validate support before sending
  const supported = getSupportedOutputFormats(inputFile.name);
  if (!supported.includes(outputFormat)) {
    throw new Error(
      `Incompatible conversion: ${inputFile.name.split(".").pop()?.toUpperCase()} cannot be converted to ${outputFormat.toUpperCase()}`,
    );
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL);

    const formData = new FormData();
    formData.append("file", inputFile);
    formData.append("format", outputFormat);
    if (options.quality) formData.append("quality", options.quality);
    if (options.startTime)
      formData.append("startTime", options.startTime.toString());
    if (options.endTime) formData.append("endTime", options.endTime.toString());

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        // Show upload progress
        const percent = (event.loaded / event.total) * 100;
        onProgress({ progress: percent, time: 0 });
      }
    };

    xhr.responseType = "blob";

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response;
        const baseName = inputFile.name.replace(/\.[^/.]+$/, "");
        const outputFileName = `${baseName}.${outputFormat}`;

        resolve({
          blob,
          fileName: outputFileName,
          size: blob.size,
        });
      } else {
        try {
          // Try to read error message if blob is text
          const reader = new FileReader();
          reader.onload = () => {
            reject(
              new Error(
                `Conversion failed: ${reader.result || xhr.statusText}`,
              ),
            );
          };
          reader.readAsText(xhr.response);
        } catch (e) {
          reject(new Error(`Conversion failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during conversion request"));
    };

    xhr.send(formData);
  });
}

export const SUPPORTED_FORMATS = {
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

export function getSupportedOutputFormats(inputFileName: string): string[] {
  const ext = inputFileName.split(".").pop()?.toLowerCase() || "";

  for (const [type, formats] of Object.entries(SUPPORTED_FORMATS)) {
    if (formats.input.includes(ext)) {
      return formats.output.filter((f) => f !== ext);
    }
  }

  return [];
}

export function getFileTypeCategory(
  fileName: string,
): "video" | "audio" | "image" | "unknown" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  for (const [type, formats] of Object.entries(SUPPORTED_FORMATS)) {
    if (formats.input.includes(ext)) {
      return type as "video" | "audio" | "image";
    }
  }

  return "unknown";
}
