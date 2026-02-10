"use client";

import { motion } from "framer-motion";
import {
  FileVideo,
  FileAudio,
  ImageIcon,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FormatSelectorProps {
  formats: string[];
  selected: string;
  onChange: (format: string) => void;
  category: "video" | "audio" | "image" | "document" | "text" | "unknown";
  className?: string; // Added className prop
}

const formatDescriptions: Record<
  string,
  { name: string; description: string }
> = {
  mp4: { name: "MP4", description: "Compatibilidade universal" },
  webm: { name: "WebM", description: "Otimizado para web" },
  mov: { name: "MOV", description: "Qualidade Apple" },
  avi: { name: "AVI", description: "Formato clássico" },
  gif: { name: "GIF", description: "Animação sem som" },
  mp3: { name: "MP3", description: "Áudio comprimido" },
  wav: { name: "WAV", description: "Áudio sem perda" },
  ogg: { name: "OGG", description: "Livre e compacto" },
  aac: { name: "AAC", description: "Alta qualidade" },
  flac: { name: "FLAC", description: "Sem perda, compacto" },
  webp: { name: "WebP", description: "Leve para web" },
  png: { name: "PNG", description: "Sem perda com transparência" },
  jpg: { name: "JPG", description: "Fotos comprimidas" },
  avif: { name: "AVIF", description: "Próxima geração" },
  pdf: { name: "PDF", description: "Documento portátil" },
  txt: { name: "TXT", description: "Texto simples" },
  docx: { name: "DOCX", description: "Documento Word" },
};

const categoryIcons = {
  video: FileVideo,
  audio: FileAudio,
  image: ImageIcon,
  document: FileText,
  text: FileText,
  unknown: FileVideo,
};

export function FormatSelector({
  formats,
  selected,
  onChange,
  category,
  className,
}: FormatSelectorProps) {
  const Icon = categoryIcons[category];
  const selectedInfo = formatDescriptions[selected] || {
    name: selected.toUpperCase(),
    description: "",
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-between gap-2 min-w-[140px] px-3 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          id="format-selector"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="font-medium">{selectedInfo.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {formats.map((format, index) => {
            const info = formatDescriptions[format] || {
              name: format.toUpperCase(),
              description: "",
            };
            return (
              <DropdownMenuItem
                key={format}
                onClick={() => onChange(format)}
                className="flex items-center gap-3 py-2.5"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold
                    ${selected === format ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                  `}
                >
                  {info.name}
                </motion.div>
                <div className="flex-1">
                  <p className="font-medium">{info.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {info.description}
                  </p>
                </div>
                {selected === format && (
                  <motion.div
                    layoutId="selected-format"
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default FormatSelector;
