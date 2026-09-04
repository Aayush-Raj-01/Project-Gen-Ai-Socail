"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { 
  Cpu, 
  Network, 
  Zap, 
  Shield, 
  Eye, 
  Mic, 
  FileText, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Terminal, 
  BarChart3,
  Share2,
  Sliders,
  Database,
  Presentation,
  Video,
  AlertTriangle
} from "lucide-react";

export default function FrameByFrameLandingPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // High-performance scroll tracking (does not trigger re-renders)
  const { scrollYProgress } = useScroll();
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const handleLoaded = () => {
      setIsLoaded(true);
      video.pause();
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("canplaythrough", handleLoaded);

    if (video.readyState >= 2) {
      handleLoaded();
    }

    // Seamless Tunnel Preload: Fetch complete video into an in-memory Blob
    // This completely eliminates ngrok/tunnel Range-request freezes in the middle of scrubbing
    let isCancelled = false;
    let createdBlobUrl: string | null = null;

    fetch("/landing-video.mp4?v=3", {
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Bypass-Tunnel-Reminder": "true",
        "X-Pinggy-No-Screen": "1",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Preload failed");
        return res.blob();
      })
      .then((blob) => {
        if (isCancelled || !video) return;
        createdBlobUrl = URL.createObjectURL(blob);
        const currentPos = video.currentTime;
        video.src = createdBlobUrl;
        video.currentTime = currentPos;
      })
      .catch(() => {
        // Silent fallback: continues using direct stream
      });

    // Wake up hardware video decoders on mobile / iOS
    const primeDecoder = () => {
      if (video && video.paused) {
        video.play().then(() => {
          video.pause();
        }).catch(() => {});
      }
    };
    window.addEventListener("touchstart", primeDecoder, { once: true, passive: true });
    window.addEventListener("scroll", primeDecoder, { once: true, passive: true });

    let animationFrameId: number;
    let targetTime = 0;
    let smoothTime = 0;
    let pendingSeek: number | null = null;
    let lastSeekTimestamp = 0;

    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0 && video.duration) {
        const scrollFraction = Math.max(0, Math.min(1, window.scrollY / scrollHeight));
        targetTime = scrollFraction * Math.max(0, video.duration - 0.05);
      }
    };

    const doSeek = (t: number) => {
      if (!video) return;
      const now = performance.now();
      
      // Watchdog: If video.seeking is stuck for >90ms (common on mobile), force next seek
      if (video.seeking && (now - lastSeekTimestamp < 90)) {
        pendingSeek = t;
        return;
      }
      lastSeekTimestamp = now;

      try {
        if ("fastSeek" in video && typeof (video as any).fastSeek === "function") {
          (video as any).fastSeek(t);
        } else {
          video.currentTime = t;
        }
      } catch {
        video.currentTime = t;
      }
    };

    const handleSeeked = () => {
      if (pendingSeek !== null) {
        const next = pendingSeek;
        pendingSeek = null;
        doSeek(next);
      }
    };

    const updateFrame = () => {
      if (video && video.duration) {
        const diff = targetTime - smoothTime;
        if (Math.abs(diff) > 0.005) {
          smoothTime += diff * 0.2;
          doSeek(smoothTime);
        }
      }
      animationFrameId = requestAnimationFrame(updateFrame);
    };

    video.addEventListener("seeked", handleSeeked);
    window.addEventListener("scroll", onScroll, { passive: true });
    animationFrameId = requestAnimationFrame(updateFrame);

    return () => {
      isCancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", primeDecoder);
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("canplaythrough", handleLoaded);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, []);

  return (
    <div className="relative bg-black min-h-[600vh] w-full selection:bg-none font-sans">
      
      {/* ── Global Telemetry HUD (Fixed Overlay) ── */}
      <div className="fixed inset-4 border border-white/10 z-[100] pointer-events-none flex flex-col justify-between p-4 mix-blend-difference hidden md:flex">
        <div className="flex justify-between text-[10px] text-white/40 tracking-[0.2em] uppercase font-mono">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>BOUYANT AI // KERNEL ONLINE</span>
          </div>
          <span>EDGE LATENCY: 12ms</span>
        </div>
        <div className="flex justify-between text-[10px] text-white/40 tracking-[0.2em] uppercase font-mono items-end">
          <span>PIPELINE: MULTI-MODAL REASONING</span>
          <div className="flex items-center gap-4">
            <span>PROGRESS</span>
            <div className="w-32 h-[1px] bg-white/10 relative">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-white" 
                style={{ width: progressBarWidth }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed Fullscreen Video Layer (Dense Keyframe Ultra-Fast Playback) ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-black z-0 pointer-events-none">
        <video
          ref={videoRef}
          src="/landing-video.mp4?v=3"
          muted
          playsInline
          preload="auto"
          className={`w-full h-full object-cover transform-gpu will-change-[transform,opacity] transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="absolute inset-0 bg-black/65 z-10" />
      </div>

      {/* ── Continuous Foreground Content Flow (No Empty Screen Gaps) ── */}
      <div className="relative z-10 w-full flex flex-col items-center">
        
        {/* ── SECTION 1: HERO & REAL-TIME SYSTEM STATUS ── */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center text-center px-6 py-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/15 text-[11px] font-mono tracking-widest text-neutral-300 uppercase mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Multi-Modal Autonomous Studio</span>
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-[0.15em] text-white mb-6 uppercase drop-shadow-2xl">
              BOUYANT AI
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-300 font-medium tracking-wide uppercase max-w-2xl leading-relaxed mb-10">
              Autonomous Multi-Modal Ingestion, Edge Moderation & Hybrid Cloud Generation
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded text-xs font-mono text-neutral-400">Florence-2 Vision</span>
              <span className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded text-xs font-mono text-neutral-400">Faster-Whisper Audio</span>
              <span className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded text-xs font-mono text-neutral-400">Qwen Edge Safety Gate</span>
              <span className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded text-xs font-mono text-neutral-400">Gemini 2.5 + Groq LLaMA 3</span>
            </div>

            <div className="mt-16 flex items-center gap-2 text-[11px] font-mono text-neutral-500 uppercase tracking-widest animate-bounce">
              <span>Scroll to explore pipeline</span>
              <span>↓</span>
            </div>
          </motion.div>
        </section>

        {/* ── SECTION 2: 4-STAGE AUTONOMOUS PIPELINE ── */}
        <section className="min-h-screen w-full max-w-6xl flex flex-col items-center justify-center px-6 py-24 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-16">
              <span className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">Architecture Blueprint</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-[0.1em] text-white mt-2 mb-4 uppercase">
                The 4-Stage Pipeline
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl mx-auto">
                How BOUYANT AI parses unstructured multi-modal chaos and converts it into boardroom-ready intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-neutral-500">STAGE 01</span>
                    <Layers className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">Ingestion</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Processes raw 4K video, audio streams, PDF decks, and high-res images simultaneously through Florence-2 and Whisper.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono text-neutral-500 uppercase">
                  Florence-2 // Whisper // OCR
                </div>
              </div>

              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-neutral-500">STAGE 02</span>
                    <ShieldCheck className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">Edge Moderation</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Local Qwen model strips PII, enforces toxicity gates, and compresses gigabytes of raw media into dense structured JSON.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono text-neutral-500 uppercase">
                  Zero Data Leaks // 100% Local
                </div>
              </div>

              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-neutral-500">STAGE 03</span>
                    <Zap className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">Hybrid Reasoning</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Dual-engine intelligence: Google Gemini 2.5 Flash for deep contextual reasoning with instant failover to Groq LLaMA 3 70B.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono text-neutral-500 uppercase">
                  Gemini 2.5 // Groq LLaMA 3
                </div>
              </div>

              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-neutral-500">STAGE 04</span>
                    <Sparkles className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">Artifact Synthesis</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Auto-formats intelligence into keynote decks, video production scripts, LinkedIn thought leadership, or security advisories.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono text-neutral-500 uppercase">
                  8 Custom Output Formats
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── SECTION 3: DEEP MULTI-MODAL EXTRACTION CORE ── */}
        <section className="min-h-screen w-full max-w-6xl flex flex-col items-center justify-center px-6 py-24 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-16">
              <span className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">Input Specialization</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-[0.1em] text-white mt-2 mb-4 uppercase">
                Multi-Sensory Extraction
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl mx-auto">
                Engineered to extract meaning from any file type without human intervention.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="col-span-1 md:col-span-2 bg-[#080808]/90 border border-white/10 p-8 rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6">
                  <Eye className="w-8 h-8 text-white/80" />
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Florence-2 Spatial Vision & OCR</h3>
                    <span className="text-xs text-neutral-500 font-mono">Vision Transformer Core</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Performs real-time spatial object detection, bounding-box text extraction, visual scene hierarchy mapping, and caption synthesis across every video frame and image upload.
                </p>
                <div className="flex gap-2 mt-6">
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-mono text-neutral-400">Dense Captions</span>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-mono text-neutral-400">OCR Boundary</span>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-mono text-neutral-400">Region Proposals</span>
                </div>
              </div>

              <div className="col-span-1 bg-[#080808]/90 border border-white/10 p-8 rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6">
                  <Mic className="w-8 h-8 text-white/80" />
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Faster-Whisper</h3>
                    <span className="text-xs text-neutral-500 font-mono">Speech & Sentiment</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Edge-optimized audio transcription with speaker diarization, multilingual parsing, and tone-cadence analysis.
                </p>
                <div className="flex gap-2 mt-6">
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-mono text-neutral-400">Sub-100ms Diarization</span>
                </div>
              </div>

              <div className="col-span-1 bg-[#080808]/90 border border-white/10 p-8 rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6">
                  <FileText className="w-8 h-8 text-white/80" />
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Document Core</h3>
                    <span className="text-xs text-neutral-500 font-mono">PyMuPDF + Tesseract</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Extracts tables, mathematical formulas, and hierarchical headers from PDF whitepapers, corporate slide decks, and scans.
                </p>
              </div>

              <div className="col-span-1 md:col-span-2 bg-[#080808]/90 border border-white/10 p-8 rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6">
                  <Lock className="w-8 h-8 text-white/80" />
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Air-Gapped Privacy Perimeter</h3>
                    <span className="text-xs text-neutral-500 font-mono">Zero Cloud Leakage</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Unlike traditional cloud wrappers, raw user uploads are processed strictly in local RAM. Only sanitized, compressed metadata tokens reach the cloud LLM cluster.
                </p>
                <div className="flex gap-2 mt-6">
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-mono text-neutral-400">PII Stripping</span>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-mono text-neutral-400">Local Safety Check</span>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-mono text-neutral-400">Enterprise Ready</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── SECTION 4: OMNICHANNEL OUTPUT & AUDIENCE MATRIX ── */}
        <section className="min-h-screen w-full max-w-6xl flex flex-col items-center justify-center px-6 py-24 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-16">
              <span className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">Adaptive Generation</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-[0.1em] text-white mt-2 mb-4 uppercase">
                Omnichannel Output Engine
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl mx-auto">
                One input stream. Infinite customized artifacts tailored to any audience and tone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Output Formats */}
              <div className="bg-[#080808]/90 border border-white/10 p-8 rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                  <Presentation className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">7 Production Formats</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Executive Summary", desc: "High-level strategic briefing" },
                    { label: "Keynote & PPT Deck", desc: "Structured slide outlines" },
                    { label: "Video Script", desc: "Scene-by-scene audio/video cues" },
                    { label: "LinkedIn Article", desc: "Authoritative thought leadership" },
                    { label: "Twitter/X Thread", desc: "Engaging viral breakdown" },
                    { label: "Security Advisory", desc: "Incident response & impact" },
                    { label: "Infographic Outline", desc: "Data points & visual blocks" },
                    { label: "Technical Report", desc: "Deep architectural breakdown" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-white/[0.03] border border-white/5 rounded">
                      <span className="text-xs font-bold text-white block uppercase tracking-wide">{item.label}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience & Tone Matrix */}
              <div className="bg-[#080808]/90 border border-white/10 p-8 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Sliders className="w-6 h-6 text-white" />
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Audience & Tone Tuning</h3>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-3">Target Audiences</span>
                    <div className="flex flex-wrap gap-2">
                      {["C-Suite Executives", "Technical Teams", "Employees", "Creators", "Students", "General Public"].map((aud, i) => (
                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-300">
                          {aud}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-3">Calibrated Tones</span>
                    <div className="flex flex-wrap gap-2">
                      {["Formal", "Marketing", "Educational", "Urgent", "Analytical", "Conversational"].map((tone, i) => (
                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-300">
                          {tone}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-xs text-neutral-400 leading-relaxed font-mono">
                  Autonomous context matching re-weights vocabulary, density, and formatting based on your exact selector preferences.
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── SECTION 5: PERFORMANCE BENCHMARKS & TELEMETRY ── */}
        <section className="min-h-screen w-full max-w-6xl flex flex-col items-center justify-center px-6 py-24 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-16">
              <span className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">System Benchmark</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-[0.1em] text-white mt-2 mb-4 uppercase">
                Engine Telemetry
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl mx-auto">
                Industrial speed and local privacy verified in real-world pipelines.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-12 text-center">
              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl">
                <span className="text-4xl md:text-6xl font-black text-white tracking-tighter block mb-2">250<span className="text-xl">ms</span></span>
                <span className="text-xs text-neutral-400 uppercase font-mono tracking-wider">Time To First Token</span>
              </div>
              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl">
                <span className="text-4xl md:text-6xl font-black text-white tracking-tighter block mb-2">100%</span>
                <span className="text-xs text-neutral-400 uppercase font-mono tracking-wider">Local Air-Gap Safe</span>
              </div>
              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl">
                <span className="text-4xl md:text-6xl font-black text-white tracking-tighter block mb-2">6</span>
                <span className="text-xs text-neutral-400 uppercase font-mono tracking-wider">Active Modalities</span>
              </div>
              <div className="bg-[#080808]/90 border border-white/10 p-6 rounded-xl">
                <span className="text-4xl md:text-6xl font-black text-white tracking-tighter block mb-2">70B</span>
                <span className="text-xs text-neutral-400 uppercase font-mono tracking-wider">LLaMA 3 Parameter Scale</span>
              </div>
            </div>

            <div className="w-full bg-[#080808]/90 border border-white/10 p-6 rounded-xl font-mono text-xs text-neutral-400">
              <div className="flex justify-between items-center pb-3 border-b border-white/10 text-neutral-500 uppercase text-[11px]">
                <span>Component Model</span>
                <span>Execution Tier</span>
                <span>Latency</span>
                <span>Failover</span>
              </div>
              <div className="divide-y divide-white/5">
                <div className="flex justify-between py-3">
                  <span className="text-white font-bold">Florence-2-base</span>
                  <span>Local Edge GPU</span>
                  <span>~45ms / frame</span>
                  <span>Active</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-white font-bold">Faster-Whisper (Int8)</span>
                  <span>Local Edge CPU/GPU</span>
                  <span>~80ms / chunk</span>
                  <span>Active</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-white font-bold">Qwen3-4B-Instruct</span>
                  <span>Local Memory Gate</span>
                  <span>~12ms TTFT</span>
                  <span>Zero Leak</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-white font-bold">Google Gemini 2.5 Flash</span>
                  <span>Cloud Cluster</span>
                  <span>~210ms</span>
                  <span>Groq LLaMA 3</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── SECTION 6: STUDIO LAUNCHER & ENTRYWAY ── */}
        <section className="min-h-screen w-full max-w-4xl flex flex-col items-center justify-center px-6 py-24 pointer-events-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Terminal className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.15em] text-white mb-6 uppercase drop-shadow-2xl">
              Enter the Studio
            </h2>

            <p className="text-sm sm:text-base text-neutral-300 font-medium tracking-wide uppercase max-w-xl leading-relaxed mb-10">
              Initialize the pipeline and begin ingesting your multi-modal media assets.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/mainpage" 
                className="px-10 py-5 bg-white text-black font-black text-sm tracking-[0.2em] uppercase rounded-full hover:bg-neutral-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.25)] flex items-center gap-3"
              >
                <span>Launch Studio Environment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link 
                href="/about" 
                className="px-8 py-5 bg-transparent border border-white/20 text-white font-bold text-sm tracking-[0.2em] uppercase rounded-full hover:bg-white/5 hover:border-white/40 transition-all duration-300"
              >
                About Architecture
              </Link>
            </div>

            <div className="mt-16 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              BOUYANT AI // SCALE-TO-ZERO ML PIPELINE // LOCAL FIRST
            </div>
          </motion.div>
        </section>

      </div>

      {/* ── Minimalist Loading Pulse ── */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}
    </div>
  );
}
