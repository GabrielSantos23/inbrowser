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
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

// Technical Progress Bar Component
// Uses bg-secondary for the track and bg-primary for the bar
function TechnicalProgress({ value }: { value: number }) {
  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        <span>Processing</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1 bg-secondary rounded-full overflow-hidden w-full">
        <motion.div
          className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
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

  const processFiles = useCallback(
    (acceptedFiles: File[]) => {
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
    [addFiles],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop: processFiles,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const pendingFiles = getFilesForConversion();

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
      className="min-h-screen bg-background text-foreground relative outline-none selection:bg-primary/20 selection:text-primary"
    >
      {/* Background Technical Elements - Using border-border for grid lines to match theme */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.08]" />
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent" />
      </div>

      <input {...getInputProps()} />

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-8"
          >
            <div className="w-full max-w-2xl h-64 border-2 border-dashed border-primary/50 rounded-2xl flex flex-col items-center justify-center gap-4 bg-primary/5">
              <UploadCloud className="w-16 h-16 text-primary animate-bounce" />
              <div className="text-2xl font-bold text-foreground">
                Drop files to convert
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                System Ready
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
              Conversion Queue
            </h1>
            <p className="text-muted-foreground max-w-md">
              Queue your files, select output formats, and process locally using
              WebAssembly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={open}
              className="border-border hover:bg-muted"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Files
            </Button>

            <Button
              onClick={handleConvertAll}
              disabled={isConverting || pendingFiles.length === 0}
              className="font-semibold shadow-lg"
            >
              {isConverting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Cpu className="w-4 h-4 mr-2" />
              )}
              {isConverting ? "Processing..." : "Start Batch"}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[400px]">
          {files.length === 0 ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-dashed border-border rounded-2xl bg-card/50 p-12 flex flex-col items-center justify-center text-center h-[400px]"
            >
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-border">
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No files in queue
              </h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Drag and drop files here, or click the button below to browse
                your system.
              </p>
              <Button onClick={open} variant="secondary">
                Browse Files
              </Button>
            </motion.div>
          ) : (
            // File List
            <div className="bg-card rounded-2xl border border-border overflow-hidden backdrop-blur-sm shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground font-mono">
                <div className="col-span-12 md:col-span-5">File Details</div>
                <div className="col-span-6 md:col-span-3">Target Format</div>
                <div className="col-span-6 md:col-span-3">Status</div>
                <div className="col-span-12 md:col-span-1 text-right">
                  Action
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
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

              {/* Footer Add Area */}
              <div
                className="px-6 py-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={open}
              >
                <Plus className="w-4 h-4" />
                <span>Add more files to queue</span>
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      className="grid grid-cols-12 gap-4 px-6 py-5 items-center group hover:bg-muted/30 transition-colors"
    >
      {/* File Info */}
      <div className="col-span-12 md:col-span-5 flex items-center gap-4">
        <FileIcon fileName={file.name} />
        <div className="flex flex-col min-w-0">
          <span
            className="font-medium text-sm text-foreground truncate pr-4"
            title={file.name}
          >
            {file.name}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {formatFileSize(file.size)} • {file.type || "Unknown Type"}
          </span>
        </div>
      </div>

      {/* Format Selector */}
      <div className="col-span-6 md:col-span-3">
        {file.status === "pending" ? (
          // Use Shadcn/Tailwind background and text colors
          <div className="[&_select]:bg-background [&_select]:border-input [&_select]:text-foreground [&_select]:ring-offset-background">
            <FormatSelector
              formats={outputFormats}
              selected={file.outputFormat}
              onChange={onFormatChange}
              category={file.category}
              className="w-full max-w-[140px] h-8 text-xs bg-background border-input"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-muted/50 border border-border text-[10px] font-mono text-muted-foreground uppercase">
              {file.name.split(".").pop()}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary uppercase">
              {file.outputFormat}
            </span>
          </div>
        )}
      </div>

      {/* Status / Progress */}
      <div className="col-span-6 md:col-span-3 pr-4">
        {file.status === "converting" ? (
          <TechnicalProgress value={file.progress} />
        ) : file.status === "completed" ? (
          <div className="flex items-center gap-2 text-emerald-500">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider">
              Complete
            </span>
          </div>
        ) : file.status === "error" ? (
          <div
            className="flex items-center gap-2 text-destructive"
            title={file.error}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Failed
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            <span className="text-xs uppercase tracking-wider">Pending</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-12 md:col-span-1 flex justify-end">
        {file.status === "completed" ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
            onClick={onRemove}
            disabled={file.status === "converting"}
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
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
  const isDoc = ["pdf", "docx", "pptx", "csv", "xlsx"].includes(ext || "");

  let Icon = FileText;
  let colorClass = "text-muted-foreground bg-muted border-border";

  if (isImage) {
    Icon = ImageIcon;
    // Keeping semantic colors for file types is good UX, but using opacity classes
    colorClass = "text-purple-500 bg-purple-500/10 border-purple-500/20";
  } else if (isVideo) {
    Icon = FileVideo;
    colorClass = "text-cyan-500 bg-cyan-500/10 border-cyan-500/20";
  } else if (isAudio) {
    Icon = FileAudio;
    colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
  } else if (isDoc) {
    Icon = FileText;
    colorClass = "text-blue-500 bg-blue-500/10 border-blue-500/20";
  }

  return (
    <div className={`p-2.5 rounded-lg border ${colorClass} transition-colors`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}
