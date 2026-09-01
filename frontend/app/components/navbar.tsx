"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Sparkles,
  Info,
  LogIn,
  Menu,
  X,
  Lock,
  Mail,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Detect scroll to adjust navbar background blur and transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      name: "Homepage",
      href: "/",
      icon: Home,
      isActive: pathname === "/" || pathname === "/landingpage",
    },
    {
      name: "Get Started",
      href: "/mainpage",
      icon: Sparkles,
      isActive: pathname === "/mainpage",
      isHighlight: true,
    },
    {
      name: "About",
      href: "/about",
      icon: Info,
      isActive: pathname === "/about",
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#07100d]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm py-4 md:py-5"
        } px-4 sm:px-6 md:px-12`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-white font-semibold tracking-wider text-sm sm:text-base uppercase transition-transform hover:scale-[1.02]"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-400/40 transition-shadow">
              <Zap className="w-4 h-4 text-black font-black" />
            </div>
            <span className="font-bold tracking-[0.18em] bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              GEN AI SOCIAL
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                    link.isActive
                      ? "bg-white text-black shadow-md shadow-white/10 font-semibold"
                      : link.isHighlight
                      ? "text-emerald-300 hover:text-white hover:bg-white/[0.08]"
                      : "text-neutral-300 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth / Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="group relative inline-flex items-center gap-2 px-5 py-2 text-xs uppercase tracking-widest font-semibold text-white rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-emerald-400/50 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              <span>Login</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-xl text-neutral-300 hover:text-white bg-white/[0.05] border border-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-4 pb-6 px-4 bg-[#0c1513]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-colors ${
                    link.isActive
                      ? "bg-white text-black font-semibold"
                      : "text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Glassmorphic Login Modal ── */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0c1513]/90 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white">
            {/* Close Button */}
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-wide">Welcome Back</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Sign in to your Gen AI Social account
              </p>
            </div>

            {/* Social Logins */}
            <div className="space-y-2.5 mb-6">
              <button
                onClick={() => alert("Connecting to Google Auth...")}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => alert("Connecting to GitHub Auth...")}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-white/10 w-full"></div>
              <span className="bg-[#0c1513] px-3 text-[10px] uppercase tracking-widest text-neutral-400 absolute">
                Or with email
              </span>
            </div>

            {/* Email Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Signing in with ${email}...`);
                setLoginModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 focus:border-emerald-400 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 focus:border-emerald-400 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-sm tracking-wider uppercase shadow-lg shadow-emerald-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
