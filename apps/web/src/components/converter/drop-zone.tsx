"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileVideo,
  FileAudio,
  ImageIcon,
  AlertCircle,
  Cloud,
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import { useFileStore, generateFileId, type FileItem } from "@/lib/file-store";
import {
  getSupportedOutputFormats,
  getFileTypeCategory,
  SUPPORTED_FORMATS,
} from "@/lib/ffmpeg";
import { Button } from "@/components/ui/button";

const ACCEPT_CONFIG = {
  "video/*": SUPPORTED_FORMATS.video.input.map((ext) => `.${ext}`),
  "audio/*": SUPPORTED_FORMATS.audio.input.map((ext) => `.${ext}`),
  "image/*": SUPPORTED_FORMATS.image.input.map((ext) => `.${ext}`),
  "application/pdf": [".pdf"],
  "text/plain": [".txt", ".md"],
};

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

interface DropZoneProps {
  className?: string;
}

export function DropZone({ className }: DropZoneProps) {
  const { addFiles } = useFileStore();

  const processFiles = useCallback(
    (acceptedFiles: File[]) => {
      const fileItems: FileItem[] = acceptedFiles.map((file) => {
        const category = getFileTypeCategory(file.name);
        const outputFormats = getSupportedOutputFormats(file.name);

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
        };
      });

      addFiles(fileItems);
      toast.success(
        `${fileItems.length} file${fileItems.length > 1 ? "s" : ""} added!`,
      );
    },
    [addFiles],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const errors = rejection.errors.map((e) => e.message).join(", ");
          toast.error(`File rejected: ${rejection.file.name}`, {
            description: errors,
          });
        });
      }

      if (acceptedFiles.length > 0) {
        processFiles(acceptedFiles);
      }
    },
    [processFiles],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    accept: ACCEPT_CONFIG,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    noClick: true, // we will handle click manually with button
    noKeyboard: true,
  });

  const rootProps = getRootProps();

  return (
    <motion.div
      className={`
        relative overflow-hidden
        flex flex-col items-center justify-center
        text-center
        transition-all duration-300 ease-out
        ${className || ""}
        ${
          isDragActive
            ? isDragAccept
              ? "border-primary bg-primary/10"
              : isDragReject
                ? "border-destructive bg-destructive/10"
                : "border-primary bg-primary/5"
            : ""
        }
      `}
      whileHover={{ scale: 1.005 }}
      {...rootProps}
    >
      <input {...getInputProps()} id="file-drop-input" />

      {/* Cloud Icon */}
      <div className="mb-6 animate-fade-in-up">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary shadow-sm">
          <Cloud className="w-8 h-8" fill="currentColor" fillOpacity={0.2} />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-2">
        {isDragActive ? "Drop files here" : "Drag and drop files here"}
      </h3>

      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Max file size 2GB • Sign up for more
      </p>

      <div className="flex items-center gap-3">
        <Button
          onClick={open}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
        >
          Choose Files
        </Button>
        <button className="w-12 h-12 bg-card border border-border hover:bg-accent rounded-xl flex items-center justify-center transition-colors">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020%29.svg"
            alt="Drive"
            className="w-6 h-6"
          />
        </button>
        <button className="w-12 h-12 bg-card border border-border hover:bg-accent rounded-xl flex items-center justify-center transition-colors">
          <Folder className="w-6 h-6 text-primary" />
        </button>
      </div>

      {isDragReject && (
        <div className="absolute inset-x-0 bottom-4 text-center">
          <span className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
            File type not supported
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default DropZone;
