"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu,
  Eye,
  Mic,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Server,
  Lock,
  Terminal,
  Sliders,
  Sparkles,
  Database,
  BarChart3
} from "lucide-react";

export default function AboutPage() {
  const pipelineStages = [
    {
      stage: "01",
      title: "Multi-Modal Ingestion",
      tech: "Florence-2 // Whisper // PyMuPDF",
      latency: "~45ms / chunk",
      desc: "Simultaneous multi-stream parsing across 4K video frames, multi-speaker audio tracks, complex tabular PDFs, and high-res imagery.",
      icon: Layers,
    },
    {
      stage: "02",
      title: "Edge Safety & PII Redaction",
      tech: "Qwen3-4B-Instruct (Edge RAM)",
      latency: "~12ms TTFT",
      desc: "Local memory isolation gate. Strips personally identifiable information, sanitizes sensitive tokens, and filters abusive content prior to network transit.",
      icon: ShieldCheck,
    },
    {
      stage: "03",
      title: "Hybrid Cloud Reasoning",
      tech: "Gemini 2.5 Flash + Groq LLaMA 3",
      latency: "~210ms TTFT",
      desc: "Dual-engine cloud cluster. Deep contextual reasoning via Google Gemini with sub-second failover redundancy to Groq LLaMA 3 70B.",
      icon: Zap,
    },
    {
      stage: "04",
      title: "Omnichannel Artifact Synthesis",
      tech: "Adaptive Stylistic Compiler",
      latency: "~60ms build",
      desc: "Autonomous formatting into 8 distinct artifact schemas: Executive summaries, keynote presentations, video scripts, and social thought leadership.",
      icon: Sparkles,
    },
  ];

  const modelMatrix = [
    {
      name: "Florence-2-base",
      type: "Vision Transformer",
      tier: "Local Edge GPU",
      footprint: "0.9 GB VRAM",
      role: "Dense image captioning, bounding-box spatial coordinates, visual OCR extraction.",
      icon: Eye,
    },
    {
      name: "Faster-Whisper (Int8)",
      type: "Speech Diarization",
      tier: "Local Edge CPU/GPU",
      footprint: "0.6 GB RAM",
      role: "Timestamped multi-speaker transcription, cadence detection, multilingual translation.",
      icon: Mic,
    },
    {
      name: "Qwen3-4B-Instruct",
      type: "Privacy & Compactor Gate",
      tier: "Local Memory Gate",
      footprint: "2.8 GB VRAM",
      role: "Zero-leak PII scrubbing, toxicity moderation, token compression into JSON schemas.",
      icon: Cpu,
    },
    {
      name: "PyMuPDF & Tesseract",
      type: "Document Geometry Core",
      tier: "Local System Worker",
      footprint: "120 MB RAM",
      role: "Structured tabular extraction, vector chart extraction, hierarchical document trees.",
      icon: FileText,
    },
    {
      name: "Google Gemini 2.5 Flash",
      type: "Frontline Reasoning Engine",
      tier: "Cloud LLM Cluster",
      footprint: "Elastic Cloud",
      role: "Deep multi-modal synthesis, executive narrative planning, high-context comprehension.",
      icon: Zap,
    },
    {
      name: "Groq LLaMA 3 70B",
      type: "High-Throughput Fallback",
      tier: "Ultra-Fast Inference LPU",
      footprint: "Zero Latency Tier",
      role: "High-speed token generation fallback ensuring 99.99% continuous pipeline uptime.",
      icon: Server,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-28 pb-32 px-4 sm:px-6 md:px-12 relative overflow-hidden font-sans select-none selection:bg-white/20">
      
      {/* ── Subtle Background Architectural Grid ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 20%, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 20%, black 0%, transparent 80%)"
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10 space-y-28">
        
        {/* ── HEADER / HERO SPECIFICATION ── */}
        <section className="text-center space-y-6 max-w-4xl mx-auto pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 text-[11px] font-mono tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>SYSTEM ARCHITECTURE // SPECIFICATION V1.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.12em] text-white uppercase antialiased"
          >
            BOUYANT AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base md:text-lg text-neutral-400 font-medium tracking-wide uppercase max-w-2xl mx-auto leading-relaxed"
          >
            Autonomous Multi-Modal Ingestion, Edge Moderation & Hybrid Cloud Synthesis
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pt-6 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/mainpage"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/landingpage"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300"
            >
              <span>Landing Overview</span>
            </Link>
          </motion.div>
        </section>

        {/* ── THE 4-STAGE PIPELINE ── */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
            <div>
              <span className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase block mb-1">Execution Flow</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.1em] text-white uppercase">The 4-Stage AI Pipeline</h2>
            </div>
            <p className="text-xs text-neutral-400 font-mono max-w-md md:text-right">
              Raw multi-modal data is parsed locally before reaching secure cloud synthesis clusters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineStages.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.02] border border-white/10 p-1.5 flex flex-col justify-between group hover:border-white/20 transition-all duration-300"
                >
                  <div className="rounded-[12px] bg-[#0c0c0c] border border-white/5 p-6 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[11px] font-mono text-neutral-500 tracking-wider">STAGE {step.stage}</span>
                        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white tracking-wide uppercase mb-3">{step.title}</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-6">{step.desc}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between text-neutral-500">
                        <span>MODEL:</span>
                        <span className="text-neutral-300">{step.tech}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>LATENCY:</span>
                        <span className="text-neutral-300">{step.latency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── MODEL MATRIX & ARCHITECTURAL SPECS ── */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
            <div>
              <span className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase block mb-1">Infrastructure</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.1em] text-white uppercase">Model Topology & Tiers</h2>
            </div>
            <p className="text-xs text-neutral-400 font-mono max-w-md md:text-right">
              Hybrid multi-tiered execution balancing edge privacy with cloud reasoning power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelMatrix.map((model, idx) => {
              const Icon = model.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.02] border border-white/10 p-1.5 flex flex-col justify-between group hover:border-white/20 transition-all duration-300"
                >
                  <div className="rounded-[12px] bg-[#0c0c0c] border border-white/5 p-6 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white tracking-wider uppercase">{model.name}</h4>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">{model.type}</span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 leading-relaxed mb-6">{model.role}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between text-neutral-500">
                        <span>EXECUTION:</span>
                        <span className="text-neutral-300">{model.tier}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>MEMORY:</span>
                        <span className="text-neutral-300">{model.footprint}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SECURITY & AIR-GAPPED PRIVACY PERIMETER ── */}
        <section className="rounded-3xl bg-white/[0.02] border border-white/10 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-widest">
              <Lock className="w-4 h-4 text-white" />
              <span>Zero Data Leakage Architecture</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[0.1em] text-white uppercase">
              Air-Gapped Local Perimeter
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Standard AI SaaS applications transmit raw user files directly to third-party APIs. BOUYANT AI eliminates this exposure. Raw video frames, high-resolution document scans, and multi-track audio are ingested and sanitized inside your local hardware boundary using edge-resident open-weight models.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 font-mono text-xs text-neutral-300">
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="text-white font-bold block mb-1">01 / LOCAL INGEST</span>
                <span className="text-[11px] text-neutral-500">RAM-only buffer isolation</span>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="text-white font-bold block mb-1">02 / PII STRIPPED</span>
                <span className="text-[11px] text-neutral-500">Local Qwen compliance filter</span>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="text-white font-bold block mb-1">03 / ZERO LOG RETENTION</span>
                <span className="text-[11px] text-neutral-500">Transient telemetry statelessness</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="text-center space-y-8 pt-8 border-t border-white/10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[0.12em] text-white uppercase">
            Deploy Your First Pipeline
          </h2>

          <div className="flex justify-center gap-4">
            <Link
              href="/mainpage"
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>Enter Bouyant Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
            BOUYANT AI // SCALE-TO-ZERO ML ENGINE // MONOCHROMATIC ARCHITECTURE
          </div>
        </section>

      </div>
    </main>
  );
}

