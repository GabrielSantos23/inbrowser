"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  Play,
  CheckCircle2,
  Loader2,
  Download,
  Plus,
  FileType,
  Trash2,
  UploadCloud,
  Cpu,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useFileStore,
  type FileItem,
  formatFileSize,
  generateFileId,
} from "@/lib/file-store";
import {
  getSupportedOutputFormats,
  getSupportedOutputFormats as getFormats,
  convertFile,
  getFileTypeCategory,
} from "@/lib/ffmpeg";
import { FormatSelector } from "./format-selector";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import JSZip from "jszip";

type HealthStatus = "healthy" | "loading" | "error";

function useHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          "https://inbrowser-api.vercel.app/api/health",
          {
            method: "GET",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!mounted) return;

        if (response.ok) {
          try {
            const data = await response.json();
            if (
              data.status === "ok" ||
              data.ok === true ||
              response.status === 200
            ) {
              setStatus("healthy");
              setError(null);
            } else {
              setStatus("error");
              setError("API returned unhealthy status");
            }
          } catch (parseError) {
            setStatus("healthy");
            setError(null);
          }
        } else {
          setStatus("error");
          setError(`API unavailable (${response.status})`);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Health check error:", err);
        setStatus("error");
        setError(
          err instanceof Error && err.name === "AbortError"
            ? "Connection timeout"
            : "Unable to connect",
        );
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, []);

  return { status, error };
}

function TechnicalProgress({ value }: { value: number }) {
  return (
    <div className="flex flex-col w-full gap-1.5">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Processing</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden w-full">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ ease: "linear" }}
        />
      </div>
    </div>
  );
}

export function ConversionQueue() {
  const {
    files,
    removeFile,
    setOutputFormat,
    setConversionStatus,
    addFiles,
    setConversionProgress,
    setConversionResult,
    getFilesForConversion,
  } = useFileStore();

  const [isConverting, setIsConverting] = useState(false);
  const { status: healthStatus, error: healthError } = useHealthCheck();

  const isSystemReady = healthStatus === "healthy";

  const processFiles = useCallback(
    (acceptedFiles: File[]) => {
      if (!isSystemReady) {
        toast.error("System is not ready. Please wait.");
        return;
      }

      const fileItems: FileItem[] = acceptedFiles.map((file) => {
        const category = getFileTypeCategory(file.name);
        const outputFormats = getFormats(file.name);

        return {
          id: generateFileId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          category,
          outputFormat: outputFormats[0] || "",
          status: "pending",
          progress: 0,
          quality: "high",
          startTime: 0,
          endTime: 0,
        };
      });

      addFiles(fileItems);
    },
    [addFiles, isSystemReady],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop: processFiles,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    disabled: !isSystemReady,
  });

  const pendingFiles = getFilesForConversion();
  const completedFiles = files.filter((f) => f.status === "completed");

  const handleDownloadAll = useCallback(async () => {
    if (completedFiles.length === 0) {
      toast.error("No completed files to download");
      return;
    }

    try {
      const zip = new JSZip();

      for (const file of completedFiles) {
        if (file.result) {
          zip.file(file.result.fileName, file.result.blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted-files-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(
        `Downloaded ${completedFiles.length} file${completedFiles.length > 1 ? "s" : ""} as ZIP`,
      );
    } catch (error) {
      console.error("Error creating zip:", error);
      toast.error("Failed to create ZIP file");
    }
  }, [completedFiles]);

  const handleConvertAll = useCallback(async () => {
    if (isConverting || pendingFiles.length === 0) return;

    setIsConverting(true);

    try {
      for (const file of pendingFiles) {
        try {
          setConversionStatus(file.id, "converting");
          const result = await convertFile({
            inputFile: file.file,
            outputFormat: file.outputFormat,
            quality: file.quality,
            startTime: file.startTime || 0,
            endTime: file.endTime || 0,
            onProgress: ({ progress }) =>
              setConversionProgress(file.id, progress),
          });
          setConversionResult(file.id, result);
        } catch (error: any) {
          console.error(`Conversion error for ${file.name}:`, error);
          setConversionStatus(
            file.id,
            "error",
            error.message || "Conversion Error",
          );
          toast.error(`Error converting ${file.name}`);
        }
      }
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast.error(`Conversion failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsConverting(false);
    }
  }, [
    pendingFiles,
    isConverting,
    setConversionStatus,
    setConversionProgress,
    setConversionResult,
  ]);

  return (
    <div
      {...getRootProps()}
      className="min-h-screen bg-background text-foreground antialiased outline-none"
    >
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <input {...getInputProps()} />

      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="w-full max-w-2xl h-64 border-2 border-dashed border-foreground/20 rounded-lg flex flex-col items-center justify-center gap-3">
              <UploadCloud
                className="w-12 h-12 text-foreground/60"
                strokeWidth={1.5}
              />
              <div className="text-lg font-medium">Drop files to convert</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {healthStatus === "healthy" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">
                    System ready
                  </span>
                </>
              )}
              {healthStatus === "loading" && (
                <>
                  <Loader2
                    className="w-3 h-3 animate-spin text-muted-foreground"
                    strokeWidth={2}
                  />
                  <span className="text-xs text-muted-foreground">
                    Checking system status
                  </span>
                </>
              )}
              {healthStatus === "error" && (
                <>
                  <XCircle className="w-3 h-3 text-red-500" strokeWidth={2} />
                  <span className="text-xs text-red-600 dark:text-red-500">
                    System unavailable {healthError && `(${healthError})`}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">
              Conversion queue
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Add files, select output formats, and process them locally using
              WebAssembly
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={open}
              disabled={!isSystemReady}
              className="border-border/60 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
              Add files
            </Button>

            {completedFiles.length > 0 && (
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                className="border-border/60 hover:bg-muted/50 rounded-md"
              >
                <Download className="w-4 h-4 mr-2" strokeWidth={2} />
                Download ZIP
              </Button>
            )}

            <Button
              onClick={handleConvertAll}
              disabled={
                isConverting || pendingFiles.length === 0 || !isSystemReady
              }
              className="bg-foreground rounded-md text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConverting ? (
                <Loader2
                  className="w-4 h-4 animate-spin mr-2"
                  strokeWidth={2}
                />
              ) : (
                <Cpu className="w-4 h-4 mr-2" strokeWidth={2} />
              )}
              {isConverting ? "Processing" : "Start batch"}
            </Button>
          </div>
        </div>

        <div className="min-h-[400px]">
          {files.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-dashed border-border/60 rounded-lg bg-card p-16 flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center mb-4 border border-border/60">
                {!isSystemReady ? (
                  healthStatus === "loading" ? (
                    <Loader2
                      className="w-6 h-6 text-muted-foreground animate-spin"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <XCircle
                      className="w-6 h-6 text-red-500"
                      strokeWidth={1.5}
                    />
                  )
                ) : (
                  <UploadCloud
                    className="w-6 h-6 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                )}
              </div>
              <h3 className="text-lg font-medium mb-1">
                {!isSystemReady
                  ? healthStatus === "loading"
                    ? "Initializing system"
                    : "System unavailable"
                  : "No files in queue"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {!isSystemReady
                  ? healthStatus === "loading"
                    ? "Please wait while we check the system status..."
                    : `Unable to connect to the conversion service. ${healthError || "Please try again later."}`
                  : "Drag and drop files here, or click the button to browse your files"}
              </p>
              <Button
                onClick={open}
                variant="outline"
                className="border-border/60"
                disabled={!isSystemReady}
              >
                Browse files
              </Button>
            </motion.div>
          ) : (
            <div className="bg-card rounded-lg border border-border/60 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/40 bg-muted/20 text-xs text-muted-foreground">
                <div className="col-span-12 md:col-span-5">File</div>
                <div className="col-span-6 md:col-span-3">Output format</div>
                <div className="col-span-6 md:col-span-3">Status</div>
                <div className="col-span-12 md:col-span-1 text-right"></div>
              </div>

              <div className="divide-y divide-border/40">
                <AnimatePresence mode="popLayout">
                  {files.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      onRemove={() => removeFile(file.id)}
                      onFormatChange={(fmt) => setOutputFormat(file.id, fmt)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <div
                className={`px-6 py-3 transition-colors flex items-center justify-center gap-2 text-sm border-t border-border/40 ${
                  isSystemReady
                    ? "bg-muted/10 hover:bg-muted/30 cursor-pointer text-muted-foreground hover:text-foreground"
                    : "bg-muted/5 cursor-not-allowed text-muted-foreground/50"
                }`}
                onClick={isSystemReady ? open : undefined}
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                <span>Add more files</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FileRow({
  file,
  onRemove,
  onFormatChange,
}: {
  file: FileItem;
  onRemove: () => void;
  onFormatChange: (format: string) => void;
}) {
  const outputFormats = getSupportedOutputFormats(file.name);

  const handleDownload = () => {
    if (file.result) {
      const url = URL.createObjectURL(file.result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.result.fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors"
    >
      <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
        <FileIcon fileName={file.name} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium text-sm truncate" title={file.name}>
            {file.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>

      <div className="col-span-6 md:col-span-3">
        {file.status === "pending" ? (
          <div className="[&_select]:bg-background [&_select]:border-border/60 [&_select]:text-foreground">
            <FormatSelector
              formats={outputFormats}
              selected={file.outputFormat}
              onChange={onFormatChange}
              category={file.category}
              className="w-full max-w-[140px] h-8 text-xs"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded border border-border/60 text-muted-foreground">
              {file.name.split(".").pop()}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="px-2 py-0.5 rounded border border-border/60">
              {file.outputFormat}
            </span>
          </div>
        )}
      </div>

      <div className="col-span-6 md:col-span-3">
        {file.status === "converting" ? (
          <TechnicalProgress value={file.progress} />
        ) : file.status === "completed" ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-medium">Complete</span>
          </div>
        ) : file.status === "error" ? (
          <div
            className="flex items-center gap-2 text-red-600 dark:text-red-500"
            title={file.error}
          >
            <AlertCircle className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-medium">Failed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            <span className="text-xs">Pending</span>
          </div>
        )}
      </div>

      <div className="col-span-12 md:col-span-1 flex justify-end">
        {file.status === "completed" ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-muted/50"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-4 h-4" strokeWidth={2} />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-muted/50 hover:text-red-600"
            onClick={onRemove}
            disabled={file.status === "converting"}
            title="Remove"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function FileIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "");
  const isVideo = ["mp4", "mov", "avi", "webm", "mkv"].includes(ext || "");
  const isAudio = ["mp3", "wav", "aac", "ogg"].includes(ext || "");

  let Icon = FileText;
  let colorClass = "text-muted-foreground bg-muted/50 border-border/60";

  if (isImage) {
    Icon = ImageIcon;
    colorClass =
      "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-900/50";
  } else if (isVideo) {
    Icon = FileVideo;
    colorClass =
      "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900/50";
  } else if (isAudio) {
    Icon = FileAudio;
    colorClass =
      "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900/50";
  }

  return (
    <div className={`p-2 rounded-md border ${colorClass}`}>
      <Icon className="w-4 h-4" strokeWidth={1.5} />
    </div>
  );
}
