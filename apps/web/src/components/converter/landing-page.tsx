import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  FileVideo,
  Shield,
  Layers,
  Cpu,
  Menu,
  X,
  Lock,
  FileType,
} from "lucide-react";
import { DropZone } from "./drop-zone";

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased scroll-smooth">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <FileVideo className="w-5 h-5" strokeWidth={2} />
              <span className="font-medium text-base">InBrowser</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollTo("product")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Product
              </button>
              <button
                onClick={() => scrollTo("security")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </button>
              <button
                onClick={() => scrollTo("formats")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Formats
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => scrollTo("dropzone")}
                className="bg-foreground text-background px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Get started
              </button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <div className="px-6 py-4 space-y-3 flex flex-col items-start">
              <button
                onClick={() => scrollTo("product")}
                className="text-sm text-muted-foreground"
              >
                Product
              </button>
              <button
                onClick={() => scrollTo("security")}
                className="text-sm text-muted-foreground"
              >
                Security
              </button>
              <button
                onClick={() => scrollTo("formats")}
                className="text-sm text-muted-foreground"
              >
                Formats
              </button>
              <button
                onClick={() => scrollTo("dropzone")}
                className="text-sm font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative pt-32 pb-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex justify-center items-center gap-2 px-2.5 py-1 rounded-full border border-border/60 text-xs text-muted-foreground mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Now with cloud API
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-5xl md:text-6xl lg:text-7xl w-full justify-center items-center text-center font-medium tracking-tight mb-6 leading-[1.1]"
            >
              Convert files without
              <br />
              the hassle
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-xl text-center leading-relaxed mb-8"
            >
              Fast, secure file conversion for audio, video, and documents.
              Everything runs in your browser or on our cloud infrastructure.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => scrollTo("dropzone")}
                className="group inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start converting
                <ArrowRight
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                  strokeWidth={2}
                />
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                View documentation →
              </button>
            </motion.div>
          </div>

          <motion.div
            id="dropzone"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-16 lg:mt-20 scroll-mt-24"
          >
            <div className="relative rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="h-10 border-b border-border/40 flex items-center px-4 gap-1.5 bg-muted/20">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>

              <div className="p-6 md:p-10">
                <DropZone className="min-h-[320px] border-2 border-dashed border-border/60 rounded-lg hover:border-foreground/20 transition-colors" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="product" className="py-24 px-6 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-3">
              Built for reliability
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Enterprise-grade infrastructure with a simple interface
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-5 h-5" strokeWidth={1.5} />}
              title="Secure by default"
              description="Files are processed in isolated containers and deleted immediately after conversion"
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" strokeWidth={1.5} />}
              title="High performance"
              description="Optimized infrastructure handles large files without breaking a sweat"
            />
            <FeatureCard
              icon={<Layers className="w-5 h-5" strokeWidth={1.5} />}
              title="100+ formats"
              description="Support for video, audio, images, documents, and more"
            />
            <FeatureCard
              icon={<Cpu className="w-5 h-5" strokeWidth={1.5} />}
              title="REST API"
              description="Integrate file conversion into your application in minutes"
            />
            <FeatureCard
              icon={<FileVideo className="w-5 h-5" strokeWidth={1.5} />}
              title="Batch processing"
              description="Convert multiple files simultaneously with queue management"
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" strokeWidth={1.5} />}
              title="Zero data retention"
              description="We don't store your files. Ever. Complete privacy guaranteed."
            />
          </div>
        </div>
      </section>

      <section id="security" className="py-24 px-6 bg-muted/30 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="w-12 h-12 bg-foreground text-background rounded-lg flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                Your privacy is our priority
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Unlike other converters, InBrowser processes your data locally
                whenever possible. When using our cloud conversion, files are
                streamed directly through memory.
                <strong> We never save, store, or see your files.</strong> Once
                the conversion is finished, the data is wiped from the server
                instance instantly.
              </p>
            </div>
            <div className="flex-1 border border-border/60 bg-card p-8 rounded-2xl shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                  <p className="text-sm">
                    No disk-writing: Files live only in RAM.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                  <p className="text-sm">
                    End-to-end encryption during transit.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                  <p className="text-sm">
                    GDPR and CCPA compliant infrastructure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="formats" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
            Supports All Major Formats
          </h2>
          <p className="text-muted-foreground mb-12">
            Convert between 100+ different file extensions
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              "MP4",
              "MOV",
              "AVI",
              "MP3",
              "WAV",
              "PDF",
              "PNG",
              "JPG",
              "GIF",
              "WEBP",
              "DOCX",
              "SVG",
            ].map((fmt) => (
              <div
                key={fmt}
                className="flex flex-col items-center p-4 border border-border/40 rounded-lg bg-card/50"
              >
                <FileType className="w-6 h-6 mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">{fmt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileVideo className="w-4 h-4" strokeWidth={2} />
              <span>InBrowser © 2026</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                API Docs
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group relative">
      <div className="h-full p-6 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
        <div className="mb-3 text-muted-foreground">{icon}</div>
        <h3 className="text-base font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
