"use client";

import Link from "next/link";
import {
  Sparkles,
  Cpu,
  Eye,
  Mic,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Server,
  Code,
} from "lucide-react";

export default function AboutPage() {
  const pipelineSteps = [
    {
      title: "Multi-Modal Ingestion",
      icon: Layers,
      description:
        "Seamlessly accept text, images, video, audio, and PDF documents. Handled by Florence-2, Faster-Whisper, EasyOCR, and PyMuPDF.",
      badge: "Stage 1",
    },
    {
      title: "Local Moderation & Compression",
      icon: ShieldCheck,
      description:
        "Local Qwen3-4B-Instruct parses raw data, compresses it into structured JSON, and filters out violent or abusive content.",
      badge: "Stage 2",
    },
    {
      title: "Cloud LLM Generation",
      icon: Zap,
      description:
        "High-reasoning generation powered primarily by Google Gemini 2.5 Flash with automatic fallback to Groq LLaMA 3 70B.",
      badge: "Stage 3",
    },
    {
      title: "Artifact Beautification",
      icon: Sparkles,
      description:
        "Transforms raw intelligence into polished, production-ready copy, social cards, threads, and executive summaries.",
      badge: "Stage 4",
    },
  ];

  const techStack = [
    { name: "Florence-2-base", role: "Visual & Spatial Extraction", icon: Eye },
    { name: "Faster-Whisper", role: "Audio & Video Transcription", icon: Mic },
    { name: "Qwen3-4B-Instruct", role: "Local Compression & Safety Gate", icon: Cpu },
    { name: "PyMuPDF & Tesseract", role: "Document Text Extraction", icon: FileText },
    { name: "Google Gemini & Groq", role: "Cloud Content Generation", icon: Zap },
    { name: "FastAPI + Elastic GPU", role: "Scale-to-Zero ML Backend", icon: Server },
  ];

  return (
    <main className="min-h-screen bg-[#07100d] text-white pt-28 pb-20 px-4 sm:px-6 md:px-12 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-20">
        {/* Header Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Content Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Transform Any Media Into Social Masterpieces
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
            Project Gen AI Social is an end-to-end multi-modal transformation engine. We combine local edge-optimized vision & speech models with state-of-the-art cloud LLMs to understand complex media and generate impactful social artifacts.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/mainpage"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-400/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Get Started with Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-medium text-sm tracking-wider uppercase transition-colors"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </section>

        {/* 4-Stage Pipeline Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">The 4-Stage AI Pipeline</h2>
            <p className="text-sm text-neutral-400">
              How our hybrid local + cloud engine processes multi-modal inputs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all duration-300 group hover:border-emerald-500/40 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/80 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Architecture & Tech Grid */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Technology & Models</h2>
            <p className="text-sm text-neutral-400">
              Battle-tested open-weight models and cloud LLMs working in concert.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 flex items-start gap-4 transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-white/[0.05] text-neutral-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">{tech.name}</h4>
                    <p className="text-xs text-neutral-400 mt-1">{tech.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
