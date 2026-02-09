"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  showPercentage = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full space-y-1.5">
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Background shimmer effect */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full blur-md"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {showPercentage && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <motion.span
            key={Math.floor(clampedProgress)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-medium tabular-nums"
          >
            {clampedProgress.toFixed(0)}%
          </motion.span>
          <span className="text-muted-foreground/60">Processando...</span>
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
