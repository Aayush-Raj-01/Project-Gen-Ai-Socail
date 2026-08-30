"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to add blur/background effect when not at top
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Avoid rendering standard navbar over the cinematic landing page
  // The landing page has its own specialized transparent header.
  if (pathname === "/") {
    return null;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-black/60 backdrop-blur-md border-b border-white/10 shadow-lg py-3" 
          : "bg-transparent py-5"
      } px-6 md:px-12`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="text-white text-lg tracking-[0.2em] uppercase font-semibold hover:opacity-80 transition-opacity">
          Gen AI Social
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/mainpage" 
            className={`text-xs uppercase tracking-widest transition-colors ${
              pathname === "/mainpage" ? "text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Studio
          </Link>
          <Link 
            href="#" 
            className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            Library
          </Link>
        </nav>

        {/* Auth / Action */}
        <div className="flex items-center gap-4">
          <button className="px-5 py-2 text-xs uppercase tracking-widest text-black bg-white rounded-full font-medium hover:scale-105 hover:bg-gray-200 transition-all">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
