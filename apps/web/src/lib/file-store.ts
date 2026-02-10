import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ConversionResult } from "./ffmpeg";

export type ConversionStatus = "pending" | "converting" | "completed" | "error";

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: "video" | "audio" | "image" | "document" | "text" | "unknown";
  outputFormat: string;
  status: ConversionStatus;
  progress: number;
  error?: string;
  result?: ConversionResult;
  quality: "low" | "medium" | "high" | "ultra";
  startTime?: number;
  endTime?: number;
  duration?: number;
  thumbnail?: string;
}

interface FileStore {
  files: FileItem[];

  // Actions
  addFiles: (files: FileItem[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateFile: (id: string, updates: Partial<FileItem>) => void;
  setOutputFormat: (id: string, format: string) => void;
  setQuality: (id: string, quality: FileItem["quality"]) => void;
  setTrimPoints: (id: string, startTime?: number, endTime?: number) => void;
  setConversionStatus: (
    id: string,
    status: ConversionStatus,
    error?: string,
  ) => void;
  setConversionProgress: (id: string, progress: number) => void;
  setConversionResult: (id: string, result: ConversionResult) => void;
  getFilesForConversion: () => FileItem[];
  getCompletedFiles: () => FileItem[];
}

export const useFileStore = create<FileStore>()(
  immer((set, get) => ({
    files: [],

    addFiles: (files: FileItem[]) =>
      set((state) => {
        state.files.push(...files);
      }),

    removeFile: (id: string) =>
      set((state) => {
        state.files = state.files.filter((f: FileItem) => f.id !== id);
      }),

    clearFiles: () =>
      set((state) => {
        state.files = [];
      }),

    updateFile: (id: string, updates: Partial<FileItem>) =>
      set((state) => {
        const file = state.files.find((f: FileItem) => f.id === id);
        if (file) {
          Object.assign(file, updates);
        }
      }),

    setOutputFormat: (id: string, format: string) =>
      set((state) => {
        const file = state.files.find((f: FileItem) => f.id === id);
        if (file) {
          file.outputFormat = format;
        }
      }),

    setQuality: (id: string, quality: FileItem["quality"]) =>
      set((state) => {
        const file = state.files.find((f: FileItem) => f.id === id);
        if (file) {
          file.quality = quality;
        }
      }),

    setTrimPoints: (id: string, startTime?: number, endTime?: number) =>
      set((state) => {
        const file = state.files.find((f: FileItem) => f.id === id);
        if (file) {
          file.startTime = startTime;
          file.endTime = endTime;
        }
      }),

    setConversionStatus: (
      id: string,
      status: ConversionStatus,
      error?: string,
    ) =>
      set((state) => {
        const file = state.files.find((f: FileItem) => f.id === id);
        if (file) {
          file.status = status;
          if (error) file.error = error;
        }
      }),

    setConversionProgress: (id: string, progress: number) =>
      set((state) => {
        const file = state.files.find((f: FileItem) => f.id === id);
        if (file) {
          file.progress = progress;
        }
      }),

    setConversionResult: (id: string, result: ConversionResult) =>
      set((state) => {
        const file = state.files.find((f: FileItem) => f.id === id);
        if (file) {
          file.result = result;
          file.status = "completed";
          file.progress = 100;
        }
      }),

    getFilesForConversion: () => {
      return get().files.filter(
        (f: FileItem) =>
          (f.status === "pending" || f.status === "error") && f.outputFormat,
      );
    },

    getCompletedFiles: () => {
      return get().files.filter(
        (f: FileItem) => f.status === "completed" && f.result,
      );
    },
  })),
);

export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
