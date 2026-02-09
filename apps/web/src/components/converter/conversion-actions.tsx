"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { Play, Download, Trash2, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFileStore } from "@/lib/file-store";
import { loadFFmpeg, convertFile } from "@/lib/ffmpeg";

export function ConversionActions() {
  const {
    files,
    clearFiles,
    setFFmpegLoading,
    setFFmpegLoaded,
    setFFmpegLoadProgress,
    setConversionStatus,
    setConversionProgress,
    setConversionResult,
    getFilesForConversion,
    getCompletedFiles,
  } = useFileStore();

  const [isConverting, setIsConverting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const pendingFiles = getFilesForConversion();
  const completedFiles = getCompletedFiles();
  const hasFiles = files.length > 0;
  const hasPendingFiles = pendingFiles.length > 0;
  const hasCompletedFiles = completedFiles.length > 0;

  const handleConvertAll = useCallback(async () => {
    if (!hasPendingFiles) return;

    setIsConverting(true);
    setFFmpegLoading(true);

    try {
      // Load FFmpeg first
      await loadFFmpeg((loaded, total) => {
        setFFmpegLoadProgress((loaded / total) * 100);
      });
      setFFmpegLoaded(true);
      setFFmpegLoading(false);

      toast.success("Motor FFmpeg carregado com sucesso!");

      // Convert files sequentially to avoid memory issues
      for (const file of pendingFiles) {
        try {
          setConversionStatus(file.id, "converting");

          const result = await convertFile({
            inputFile: file.file,
            outputFormat: file.outputFormat,
            quality: file.quality,
            startTime: file.startTime,
            endTime: file.endTime,
            onProgress: ({ progress }) => {
              setConversionProgress(file.id, progress);
            },
          });

          setConversionResult(file.id, result);
          toast.success(`${file.name} convertido com sucesso!`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido";
          setConversionStatus(file.id, "error", errorMessage);
          toast.error(`Erro ao converter ${file.name}`, {
            description: errorMessage,
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao carregar FFmpeg";
      toast.error("Falha ao inicializar o motor de conversão", {
        description: errorMessage,
      });
      setFFmpegLoading(false);
    } finally {
      setIsConverting(false);
    }
  }, [
    hasPendingFiles,
    pendingFiles,
    setFFmpegLoading,
    setFFmpegLoaded,
    setFFmpegLoadProgress,
    setConversionStatus,
    setConversionProgress,
    setConversionResult,
  ]);

  const handleDownloadAll = useCallback(async () => {
    if (completedFiles.length === 0) return;

    setIsDownloading(true);

    try {
      if (completedFiles.length === 1) {
        // Single file - download directly
        const file = completedFiles[0];
        if (file.result) {
          const url = URL.createObjectURL(file.result.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.result.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        // Multiple files - create ZIP
        const zip = new JSZip();

        for (const file of completedFiles) {
          if (file.result) {
            zip.file(file.result.fileName, file.result.blob);
          }
        }

        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `converted-files-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Arquivos baixados como ZIP!");
      }
    } catch (error) {
      toast.error("Erro ao criar arquivo ZIP");
    } finally {
      setIsDownloading(false);
    }
  }, [completedFiles]);

  if (!hasFiles) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card/50 border backdrop-blur-sm"
    >
      {/* Left side - Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{files.length}</strong> arquivo
          {files.length !== 1 ? "s" : ""}
        </span>
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium"
            >
              {pendingFiles.length} pendente
              {pendingFiles.length !== 1 ? "s" : ""}
            </motion.span>
          )}
          {completedFiles.length > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
            >
              {completedFiles.length} concluído
              {completedFiles.length !== 1 ? "s" : ""}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFiles}
          disabled={isConverting}
          className="gap-2"
          id="clear-all-btn"
        >
          <Trash2 className="w-4 h-4" />
          Limpar Tudo
        </Button>

        <AnimatePresence mode="wait">
          {hasCompletedFiles && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="gap-2"
                id="download-all-btn"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : completedFiles.length > 1 ? (
                  <Package className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {completedFiles.length > 1 ? "Baixar ZIP" : "Baixar"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="sm"
          onClick={handleConvertAll}
          disabled={!hasPendingFiles || isConverting}
          className="gap-2 min-w-[140px]"
          id="convert-all-btn"
        >
          {isConverting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Convertendo...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Converter{" "}
              {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ""}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export default ConversionActions;
