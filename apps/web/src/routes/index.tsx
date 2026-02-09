import { createFileRoute } from "@tanstack/react-router";
import { MediaConverter } from "@/components/converter/media-converter";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  head: () => ({
    meta: [
      {
        title: "InBrowser Converter - Conversão de Mídia 100% Local",
      },
      {
        name: "description",
        content:
          "Converta vídeos, áudios e imagens diretamente no navegador. Nenhum dado é enviado para servidores externos. Privacidade total com FFmpeg.wasm.",
      },
      {
        name: "keywords",
        content:
          "converter video, converter audio, converter imagem, ffmpeg, webassembly, privacidade, local, mp4, mp3, gif, webp",
      },
    ],
  }),
});

function HomeComponent() {
  return <MediaConverter />;
}
