import React, { useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  ArrowRight,
  Zap,
  FileVideo,
  Shield,
  Layers,
  Cpu,
  Menu,
  X,
} from "lucide-react";
// Assuming DropZone is in the same directory
import { DropZone } from "./drop-zone";

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Background Grid & Grain - "Engineered" look */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Uses border color for grid lines to match theme automatically */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.08]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.05),transparent)]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-foreground text-background rounded flex items-center justify-center font-bold text-lg">
              <FileVideo className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              InBrowser
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {["Product", "Security", "Formats", "Pricing"].map((item) => (
              <a
                key={item}
                href="#"
                className="hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </button>
            <button className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border p-6 flex flex-col gap-4">
            {["Product", "Security", "Formats", "Pricing"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-muted-foreground hover:text-foreground block py-2"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              v3.0 Now Powered by Cloud API
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground mb-6"
            >
              File conversion, <br />
              <span className="text-muted-foreground">simplified.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Convert audio, video, and documents with our powerful cloud
              infrastructure. Fast, reliable, and secure.
            </motion.p>
          </div>

          {/* App Shell / DropZone Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative mx-auto max-w-4xl"
          >
            {/* Glow effect behind the app */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-indigo-500/30 to-purple-500/30 rounded-xl opacity-20 blur-2xl" />

            <div className="relative bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
              {/* Fake Browser Header */}
              <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                <div className="ml-4 px-3 py-1 bg-background rounded text-[10px] text-muted-foreground font-mono hidden sm:block border border-border/50">
                  api/convert
                </div>
              </div>

              {/* The Actual DropZone Area */}
              <div className="p-2 md:p-8 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]">
                <DropZone className="min-h-[300px] border border-dashed border-border bg-background/50 rounded-lg hover:bg-muted/30 hover:border-primary/50 transition-all duration-300" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <div className="border-y border-border bg-muted/20">
        <div className="container mx-auto px-6 py-10">
          <p className="text-center text-sm text-muted-foreground mb-6 font-medium">
            TRUSTED BY TEAMS AT
          </p>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-50">
            {/* Simple SVGs acting as "Pro" logos */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-6 w-24 bg-muted-foreground/30 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bento Grid Feature Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Why use our API?
            </h2>
            <div className="h-1 w-20 bg-primary rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px]">
            {/* Card 1: Large Span - Privacy */}
            <BentoCard
              className="md:col-span-2"
              title="Secure Processing"
              description="Your files are processed securely in ephemeral containers and deleted immediately after conversion."
              icon={<Shield className="w-6 h-6 text-indigo-500" />}
            >
              <div className="absolute right-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />
              <div className="absolute right-8 bottom-8 p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-lg text-xs font-mono text-indigo-500 dark:text-indigo-400">
                <div className="flex gap-2 items-center mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Status: Operational</span>
                </div>
                <div>Encryption: TLS 1.3</div>
              </div>
            </BentoCard>

            {/* Card 2: Speed */}
            <BentoCard
              className="md:col-span-1"
              title="Lightning Fast"
              description="Powered by high-performance servers to handle heavy media files instantly."
              icon={<Zap className="w-6 h-6 text-amber-500" />}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <Zap className="w-48 h-48 text-amber-500" />
              </div>
            </BentoCard>

            {/* Card 3: Formats */}
            <BentoCard
              className="md:col-span-1"
              title="Universal Support"
              description="Support for 100+ formats including video, audio, image, and documents."
              icon={<Layers className="w-6 h-6 text-pink-500" />}
            >
              <div className="flex flex-wrap gap-2 mt-4 opacity-70">
                {["MP4", "MOV", "AVI", "PDF", "JPG", "PNG", "WEBP"].map(
                  (ext) => (
                    <span
                      key={ext}
                      className="text-[10px] border border-border px-2 py-1 rounded text-muted-foreground"
                    >
                      {ext}
                    </span>
                  ),
                )}
              </div>
            </BentoCard>

            {/* Card 4: Tech */}
            <BentoCard
              className="md:col-span-2"
              title="Advanced API"
              description="Integrate our powerful conversion engine into your own applications with a simple REST API."
              icon={<Cpu className="w-6 h-6 text-cyan-500" />}
            >
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cyan-500/10 to-transparent" />
              {/* Decorative Code Block */}
              <div className="absolute bottom-6 left-6 right-6 font-mono text-xs text-muted-foreground bg-muted p-4 rounded border border-border">
                {`POST /api/convert`} <br />
                {`Content-Type: multipart/form-data`} <br />
                {`> { file: video.mp4, format: "gif" }`}
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* Modern CTA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
            Ready to convert?
          </h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button className="group relative px-8 py-4 bg-foreground text-background rounded-full font-bold text-lg hover:opacity-90 transition-all overflow-hidden shadow-lg">
              <span className="relative z-10 flex items-center gap-2">
                Start Converting Now{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="px-8 py-4 bg-transparent border border-border text-foreground rounded-full font-medium text-lg hover:bg-muted transition-all">
              View API Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
              <FileVideo className="w-3 h-3" />
            </div>
            <span className="font-semibold text-sm text-muted-foreground">
              InBrowser © 2026
            </span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Spotlight Card Component for the Bento Grid
function BentoCard({
  children,
  className,
  title,
  description,
  icon,
}: {
  children?: React.ReactNode;
  className?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative border border-border bg-card overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--primary), 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full p-8 flex flex-col">
        <div className="mb-4 p-3 bg-muted w-fit rounded-lg border border-border">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-card-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm">
          {description}
        </p>
        <div className="mt-auto pt-8">{children}</div>
      </div>
    </div>
  );
}
