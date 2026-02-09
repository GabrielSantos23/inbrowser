import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span>InBrowser</span>
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
