"use client";

import { motion } from "framer-motion";
import { Sparkles, Gauge, Zap, Crown, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileItem } from "@/lib/file-store";

interface QualitySelectorProps {
  selected: FileItem["quality"];
  onChange: (quality: FileItem["quality"]) => void;
}

const qualityOptions: {
  value: FileItem["quality"];
  label: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
}[] = [
  {
    value: "low",
    label: "Rápido",
    description: "Menor qualidade, arquivo pequeno",
    icon: Zap,
    color: "text-amber-500",
  },
  {
    value: "medium",
    label: "Balanceado",
    description: "Equilíbrio entre qualidade e tamanho",
    icon: Gauge,
    color: "text-blue-500",
  },
  {
    value: "high",
    label: "Alta Qualidade",
    description: "Ótima qualidade, arquivo maior",
    icon: Sparkles,
    color: "text-emerald-500",
  },
  {
    value: "ultra",
    label: "Máxima",
    description: "Qualidade máxima, mais lento",
    icon: Crown,
    color: "text-purple-500",
  },
];

export function QualitySelector({ selected, onChange }: QualitySelectorProps) {
  const selectedOption =
    qualityOptions.find((o) => o.value === selected) || qualityOptions[2];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Qualidade:</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-between gap-2 min-w-[150px] px-3 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          id="quality-selector"
        >
          <div className="flex items-center gap-2">
            <SelectedIcon className={`w-4 h-4 ${selectedOption.color}`} />
            <span className="font-medium">{selectedOption.label}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {qualityOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className="flex items-center gap-3 py-2.5"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.05, type: "spring" }}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${selected === option.value ? "bg-primary/20" : "bg-muted"}
                  `}
                >
                  <Icon className={`w-5 h-5 ${option.color}`} />
                </motion.div>
                <div className="flex-1">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {selected === option.value && (
                  <motion.div
                    layoutId="selected-quality"
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

export default QualitySelector;
