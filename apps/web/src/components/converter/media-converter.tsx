"use client";

import { useFileStore } from "@/lib/file-store";
import { LandingPage } from "@/components/converter/landing-page";
import { ConversionQueue } from "@/components/converter/conversion-queue";

export function MediaConverter() {
  const { files } = useFileStore();
  const hasFiles = files.length > 0;

  return <>{hasFiles ? <ConversionQueue /> : <LandingPage />}</>;
}

export default MediaConverter;
