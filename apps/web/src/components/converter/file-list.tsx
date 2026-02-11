"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileVideo,
  FileAudio,
  ImageIcon,
  Trash2,
  Download,
  RotateCcw,
  ChevronRight,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useFileStore,
  formatFileSize,
  type FileItem,
  type ConversionStatus,
} from "@/lib/file-store";
import { getSupportedOutputFormats } from "@/lib/ffmpeg";
import { FormatSelector } from "./format-selector";
import { QualitySelector } from "./quality-selector";
import { ProgressBar } from "./progress-bar";

const categoryConfig = {
  video: {
    icon: FileVideo,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  audio: {
    icon: FileAudio,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  image: {
    icon: ImageIcon,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  unknown: {
    icon: FileVideo,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
  },
};

const statusConfig: Record<
  ConversionStatus,
  { icon: typeof CheckCircle2; color: string; text: string }
> = {
  pending: {
    icon: Settings2,
    color: "text-muted-foreground",
    text: "Aguardando",
  },
  converting: { icon: Loader2, color: "text-blue-500", text: "Convertendo" },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    text: "Concluído",
  },
  error: { icon: AlertTriangle, color: "text-red-500", text: "Erro" },
};

interface FileItemCardProps {
  item: FileItem;
  index: number;
}

export function FileItemCard({ item, index }: FileItemCardProps) {
  const { removeFile, setOutputFormat, setQuality, setConversionStatus } =
    useFileStore();
  const config = categoryConfig[item.category];
  const StatusIcon = statusConfig[item.status].icon;
  const CategoryIcon = config.icon;

  const outputFormats = getSupportedOutputFormats(item.name);

  const handleDownload = () => {
    if (item.result) {
      const url = URL.createObjectURL(item.result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleRetry = () => {
    setConversionStatus(item.id, "pending");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: index * 0.05,
      }}
    >
      <Card
        className={`
          relative overflow-hidden p-4 
          border ${item.status === "error" ? "border-red-500/50" : config.borderColor}
          bg-card/50 backdrop-blur-sm
          hover:bg-card transition-colors duration-200
        `}
      >
        {item.status === "converting" && (
          <motion.div
            className="absolute inset-0 bg-primary/5 pointer-events-none"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: item.progress / 100 }}
            style={{ transformOrigin: "left" }}
          />
        )}

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <motion.div
              className={`p-3 rounded-xl ${config.bgColor} shrink-0`}
              whileHover={{ scale: 1.05 }}
            >
              <CategoryIcon className={`w-6 h-6 ${config.color}`} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <h4
                className="font-medium text-foreground truncate"
                title={item.name}
              >
                {item.name}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{formatFileSize(item.size)}</span>
                {item.result && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-emerald-500 font-medium">
                      {formatFileSize(item.result.size)}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      ({((1 - item.result.size / item.size) * 100).toFixed(0)}%
                      menor)
                    </span>
                  </>
                )}
              </div>
            </div>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].color} bg-background border`}
            >
              <StatusIcon
                className={`w-3.5 h-3.5 ${item.status === "converting" ? "animate-spin" : ""}`}
              />
              <span>{statusConfig[item.status].text}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {item.status === "completed" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleDownload}
                    className="gap-1.5"
                    id={`download-${item.id}`}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </motion.div>
              )}
              {item.status === "error" && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleRetry}
                  className="text-amber-500 hover:text-amber-400"
                  id={`retry-${item.id}`}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeFile(item.id)}
                className="text-muted-foreground hover:text-red-500"
                disabled={item.status === "converting"}
                id={`remove-${item.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {item.status === "pending" && outputFormats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap items-center gap-4 pl-16"
            >
              <FormatSelector
                formats={outputFormats}
                selected={item.outputFormat}
                onChange={(format) => setOutputFormat(item.id, format)}
                category={item.category}
              />
              <QualitySelector
                selected={item.quality}
                onChange={(quality) => setQuality(item.id, quality)}
              />
            </motion.div>
          )}

          {item.status === "converting" && (
            <div className="pl-16">
              <ProgressBar progress={item.progress} />
            </div>
          )}

          {item.status === "error" && item.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 pl-16 text-sm text-red-500"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{item.error}</span>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function FileList() {
  const { files } = useFileStore();

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {files.map((file, index) => (
          <FileItemCard key={file.id} item={file} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default FileList;
