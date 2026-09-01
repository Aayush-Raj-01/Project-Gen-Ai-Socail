"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

// 5 Story Chapters mapped to the continuous video narrative (0.00 to 1.00)
interface ChapterData {
  id: number;
  progressStart: number;
  progressEnd: number;
  tag: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  stats?: { label: string; value: string; icon: string }[];
  pills?: string[];
  cta?: { label: string; href: string; primary?: boolean }[];
}

const CHAPTERS: ChapterData[] = [
  {
    id: 1,
    progressStart: 0.0,
    progressEnd: 0.20,
    tag: "01 // THE AWAKENING",
    badge: "HUMAN INTENT × ARTIFICIAL INTELLIGENCE",
    title: "Where Raw Intent Becomes Social Reality",
    subtitle: "The Genesis of Multimodal Intelligence",
    description:
      "A single spark of human inspiration harmonizes with neural intelligence. Ingest any input format and transmute raw concepts into high-gravity social narratives.",
    stats: [
      { label: "Multimodal Models", value: "4 AI Engines", icon: "hub" },
      { label: "Processing Latency", value: "< 1.2s", icon: "bolt" },
      { label: "Format Coverage", value: "100% Universal", icon: "all_inclusive" },
    ],
  },
  {
    id: 2,
    progressStart: 0.20,
    progressEnd: 0.42,
    tag: "02 // NEURAL STREAM",
    badge: "OMNI-SOURCE EXTRACTION PIPELINE",
    title: "Ingest Any Signal. Extract Deep Truth.",
    subtitle: "Real-Time Parallel Ingestion Architecture",
    description:
      "Stream video, speech, scanned documents, and imagery directly into unified neural vectors. Every pixel, phoneme, and paragraph is decomposed in parallel.",
    pills: [
      "Florence-2 Visual AI",
      "Whisper Audio Stream",
      "PyMuPDF + OCR Engine",
      "Elastic GPU Cluster",
      "Zero Context Loss",
    ],
    stats: [
      { label: "Visual OCR", value: "Florence-2", icon: "photo_camera" },
      { label: "Speech AI", value: "Whisper Base", icon: "mic" },
      { label: "Document Parser", value: "PyMuPDF", icon: "description" },
    ],
  },
  {
    id: 3,
    progressStart: 0.42,
    progressEnd: 0.65,
    tag: "03 // QUANTUM WEAVE",
    badge: "LOCAL ON-DEVICE REASONING CORE",
    title: "Zero-Leakage Intelligence & Active Safety",
    subtitle: "Qwen3-4B-Instruct Local LLM Engine",
    description:
      "Private on-device intelligence compresses raw multimodal vectors into clean structured JSON while enforcing active safety guardrails and moderation filters.",
    pills: [
      "Local Qwen3-4B-Instruct",
      "100% Active Guardrails",
      "Lossless JSON Compression",
      "Enterprise Data Isolation",
    ],
    stats: [
      { label: "Safety Shield", value: "100% Guarded", icon: "security" },
      { label: "Token Latency", value: "< 38ms", icon: "speed" },
      { label: "Architecture", value: "Local Private LLM", icon: "memory" },
    ],
  },
  {
    id: 4,
    progressStart: 0.65,
    progressEnd: 0.85,
    tag: "04 // DATA VORTEX",
    badge: "DUAL-ENGINE CLOUD SYNTHESIS",
    title: "Autonomous Omnichannel Generation",
    subtitle: "Gemini 2.5 Flash + Groq Ultra-Fast Fallback",
    description:
      "Algorithmic synthesis twists structured thought into precision-crafted social artifacts, executive advisories, viral threads, and high-impact visual stories.",
    pills: [
      "LinkedIn Executive Memos",
      "Viral X/Twitter Threads",
      "Cinematic Video Frameworks",
      "High-Density Infographics",
      "Bilingual EN / Hindi",
    ],
    stats: [
      { label: "Primary Model", value: "Gemini 2.5 Flash", icon: "auto_awesome" },
      { label: "High-Speed Fallback", value: "Groq LLaMA-3", icon: "electric_bolt" },
      { label: "Target Audience", value: "6 Dynamic Personas", icon: "group" },
    ],
  },
  {
    id: 5,
    progressStart: 0.85,
    progressEnd: 1.0,
    tag: "05 // THE SINGULARITY",
    badge: "GENAI SOCIAL STUDIO COMMAND",
    title: "Command Your Social Gravity.",
    subtitle: "Transform Raw Thought Into Influence",
    description:
      "Step inside the GenAI Social Studio. Compose, transform, and distribute multimodal intelligence across the digital universe with a single stroke.",
    cta: [
      { label: "Enter Social Studio", href: "/mainpage", primary: true },
      { label: "Replay Journey", href: "#replay" },
    ],
    stats: [
      { label: "Infrastructure", value: "Serverless Elastic GPU", icon: "cloud" },
      { label: "Platform Uptime", value: "99.99%", icon: "verified" },
      { label: "Studio Readiness", value: "Ready to Deploy", icon: "rocket_launch" },
    ],
  },
];

export default function CinematicLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Scroll and animation state
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadPercent, setLoadPercent] = useState<number>(15);
  const [videoDuration, setVideoDuration] = useState<number>(19.2);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [scrubVelocity, setScrubVelocity] = useState<number>(0);

  // References for continuous physics lerp
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const lastProgressRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);

  // Initialize Audio Synth (Synthesized Ambient Cosmic Drone)
  const toggleAmbientAudio = useCallback(() => {
    if (!isAudioActive) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(55, ctx.currentTime); // Deep A1 note

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(280, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        synthOscRef.current = osc;
        synthGainRef.current = gain;
        setIsAudioActive(true);
      } catch {
        // AudioContext policy handled
      }
    } else {
      if (synthGainRef.current && audioContextRef.current) {
        synthGainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.5);
        setTimeout(() => {
          synthOscRef.current?.stop();
          audioContextRef.current?.close();
          setIsAudioActive(false);
        }, 500);
      } else {
        setIsAudioActive(false);
      }
    }
  }, [isAudioActive]);

  // Three.js 3D Depth Particle System
  useEffect(() => {
    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 80;

    // Create 1800 Particle Stars
    const particleCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color("#00dfbe"); // Cyan/Emerald
    const color2 = new THREE.Color("#fee24a"); // Gold
    const color3 = new THREE.Color("#ffffff"); // Starlight White

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500;

      const mixVal = Math.random();
      let c = color3;
      if (mixVal < 0.45) c = color1;
      else if (mixVal < 0.75) c = color2;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Particle Shader Material
    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 20;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!canvas) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    let animId: number;
    let clock = new THREE.Clock();

    const renderThree = () => {
      const elapsedTime = clock.getElapsedTime();
      const p = currentProgressRef.current;

      // Camera swoops through space with scroll progress
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.position.z = 80 - p * 120 + Math.sin(elapsedTime * 0.5) * 2;
      camera.rotation.z = p * Math.PI * 0.4 + elapsedTime * 0.02;

      particles.rotation.y = elapsedTime * 0.03 + p * 0.8;
      particles.rotation.x = Math.sin(elapsedTime * 0.02) * 0.1 + p * 0.3;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderThree);
    };
    animId = requestAnimationFrame(renderThree);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Initialize Video Element and Canvas Render Engine
  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/landing-video.mp4";
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.muted = true; // Audio is muted / voice removed as requested
    video.preload = "auto";
    videoRef.current = video;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setVideoDuration(video.duration);
      }
      setLoadPercent(60);
    };

    const handleCanPlayThrough = () => {
      setLoadPercent(100);
      setTimeout(() => {
        setIsLoaded(true);
      }, 400);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplaythrough", handleCanPlayThrough);

    // Fallback load trigger if cache instant
    if (video.readyState >= 3) {
      setLoadPercent(100);
      setIsLoaded(true);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
      video.src = "";
    };
  }, []);

  // Canvas Frame Drawing Function with High-DPI 'Cover' Scaling
  const renderVideoToCanvas = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;
      const scale = Math.max(displayWidth / vw, displayHeight / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (displayWidth - dw) / 2;
      const dy = (displayHeight - dh) / 2;

      // Draw current video frame to canvas
      ctx.drawImage(video, dx, dy, dw, dh);

      // Subtle cinematic vignette and grade
      const grad = ctx.createRadialGradient(
        displayWidth / 2,
        displayHeight / 2,
        displayHeight * 0.3,
        displayWidth / 2,
        displayHeight / 2,
        displayWidth * 0.8
      );
      grad.addColorStop(0, "rgba(0, 0, 0, 0.0)");
      grad.addColorStop(0.7, "rgba(12, 21, 19, 0.35)");
      grad.addColorStop(1, "rgba(8, 14, 12, 0.85)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      ctx.restore();
    },
    []
  );

  // Continuous Physics Loop: RAF Lerp Syncing Scroll → Video CurrentTime → Canvas
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Inertial spring damping: smooth approach to targetProgress
      const current = currentProgressRef.current;
      const target = targetProgressRef.current;
      const diff = target - current;

      // Higher responsive lerp factor for instant feel with zero jitter
      const lerpSpeed = 10;
      const newProgress = Math.abs(diff) < 0.0001 ? target : current + diff * (1 - Math.exp(-lerpSpeed * dt));

      currentProgressRef.current = newProgress;
      setScrollProgress(newProgress);

      // Compute scroll velocity for dynamic motion blur and indicator
      const velocity = (newProgress - lastProgressRef.current) / (dt || 0.016);
      lastProgressRef.current = newProgress;
      setScrubVelocity(velocity);

      // Sync video currentTime to smooth progress
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.duration) {
        const targetTime = Math.max(0, Math.min(newProgress * video.duration, video.duration - 0.05));

        // Only update if difference is meaningful
        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          video.currentTime = targetTime;
        }

        if (canvas) {
          renderVideoToCanvas(video, canvas);
        }
      }

      // Determine active narrative chapter
      const chIndex = CHAPTERS.findIndex(
        (ch) => newProgress >= ch.progressStart && newProgress <= ch.progressEnd
      );
      if (chIndex !== -1) {
        setActiveChapterIndex(chIndex);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderVideoToCanvas]);

  // Window Wheel & Touch Event Listeners (Virtual Continuous Scroll Engine)
  useEffect(() => {
    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Sensitivity tuned for both trackpads and stepped mouse wheels
      const delta = e.deltaY * 0.00045;
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta));
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const delta = (touchStartY - currentY) * 0.0018;
      touchStartY = currentY;
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        targetProgressRef.current = Math.min(1, targetProgressRef.current + 0.08);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.08);
      } else if (e.key === "Home") {
        e.preventDefault();
        targetProgressRef.current = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        targetProgressRef.current = 1;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Jump to specific chapter
  const jumpToChapter = (chapterId: number) => {
    const chapter = CHAPTERS.find((ch) => ch.id === chapterId);
    if (!chapter) return;
    targetProgressRef.current = chapter.progressStart + 0.02;
  };

  const activeChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];
  const currentTimeDisplay = (scrollProgress * videoDuration).toFixed(1);
  const totalTimeDisplay = videoDuration.toFixed(1);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-[#07100d] text-on-surface select-none font-body-md"
    >
      {/* ── Initial Cinematic Loading Screen ── */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07100d]"
          >
            <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
              {/* Glowing Pulse Orb */}
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-primary-fixed-dim/30 animate-ping opacity-30" />
                <div className="absolute inset-2 rounded-full border border-primary-fixed/40 animate-spin" style={{ animationDuration: "3s" }} />
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-fixed to-primary-fixed-dim shadow-[0_0_30px_#00dfbe] flex items-center justify-center">
                  <span className="material-symbols-outlined text-black text-sm icon-filled">
                    temp_preferences_custom
                  </span>
                </div>
              </div>

              <h2 className="text-white font-display-lg text-lg tracking-[0.25em] uppercase font-semibold mb-2">
                GenAI Social Studio
              </h2>
              <p className="text-on-surface-variant/70 text-xs tracking-widest uppercase mb-6">
                Initializing Multimodal 3D Timeline
              </p>

              {/* Progress Bar */}
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-fixed to-primary-fixed-dim"
                  initial={{ width: "10%" }}
                  animate={{ width: `${loadPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-primary-fixed-dim font-mono text-[11px] tracking-wider">
                {loadPercent}% LOADED
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Canvas: Scroll-Controlled Video Frames ── */}
      <canvas
        ref={canvasRef}
        id="cinematic-video-canvas"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      />

      {/* ── Three.js 3D Particle Starfield Overlay ── */}
      <canvas
        ref={threeCanvasRef}
        id="three-particles-canvas"
        className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-80"
      />

      {/* ── Cinematic Scanline & Grid Effect ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-15"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 223, 190, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 223, 190, 0.05) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* ── Top Header Navigation Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-12 py-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high/80 border border-outline-variant/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,223,190,0.2)]">
            <span className="material-symbols-outlined text-primary-fixed-dim text-lg icon-filled">
              temp_preferences_custom
            </span>
          </div>
          <div>
            <div className="text-white font-display-lg text-sm md:text-base font-semibold tracking-wider flex items-center gap-2">
              <span>GENAI SOCIAL</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-fixed-dim/10 text-primary-fixed-dim border border-primary-fixed-dim/30 uppercase tracking-widest font-mono">
                Studio
              </span>
            </div>
            <p className="text-on-surface-variant/50 text-[10px] tracking-widest uppercase hidden md:block">
              Multimodal Transformation Engine
            </p>
          </div>
        </div>

        {/* Center Live Scene Pill */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-high/60 backdrop-blur-xl border border-outline-variant/30 text-xs">
          <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse" />
          <span className="font-mono text-primary-fixed-dim text-[11px] tracking-wider uppercase">
            {activeChapter.tag}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-white/80 font-medium text-[11px] tracking-wide">
            {activeChapter.badge}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Ambient Sound Toggle */}
          <button
            onClick={toggleAmbientAudio}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-300 border ${
              isAudioActive
                ? "bg-primary-fixed-dim/20 border-primary-fixed-dim text-primary-fixed-dim shadow-[0_0_15px_rgba(0,223,190,0.3)]"
                : "bg-surface-container-high/50 border-outline-variant/30 text-on-surface-variant/70 hover:text-white hover:border-white/30"
            }`}
            title="Toggle Ambient Audio Synth"
          >
            <span className="material-symbols-outlined text-sm">
              {isAudioActive ? "volume_up" : "volume_off"}
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider">
              {isAudioActive ? "Sound ON" : "Muted"}
            </span>
          </button>

          {/* Quick Jump into Studio */}
          <Link
            href="/mainpage"
            className="flex items-center gap-2 px-4 md:px-5 py-2 rounded-full bg-primary-fixed text-on-primary font-display-lg text-xs font-semibold tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(10,255,217,0.35)] group"
          >
            <span>Launch Studio</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>
      </header>

      {/* ── Right Vertical Chapter Navigation HUD ── */}
      <nav
        aria-label="Story Chapters"
        className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-end gap-5"
      >
        {CHAPTERS.map((ch, idx) => {
          const isActive = activeChapterIndex === idx;
          return (
            <button
              key={ch.id}
              onClick={() => jumpToChapter(ch.id)}
              className="group flex items-center gap-3 cursor-pointer outline-none"
            >
              {/* Tooltip on hover */}
              <span
                className={`text-[11px] font-mono tracking-wider transition-all duration-300 ${
                  isActive
                    ? "text-primary-fixed-dim opacity-100 translate-x-0"
                    : "text-white/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2"
                }`}
              >
                {ch.tag.split("//")[1]?.trim() || `0${ch.id}`}
              </span>

              {/* Indicator Dot */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  isActive ? "w-6 h-6" : "w-3 h-3"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-chapter-ring"
                    className="absolute inset-0 rounded-full border border-primary-fixed-dim animate-ping opacity-40"
                  />
                )}
                <div
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-2.5 h-2.5 bg-primary-fixed shadow-[0_0_12px_#00dfbe]"
                      : "w-1.5 h-1.5 bg-white/30 group-hover:bg-white/70"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* ── Center Stage: Continuous 3D Storytelling Overlays ── */}
      <main className="relative z-20 w-full h-full flex items-center justify-center pointer-events-none px-6 md:px-16">
        <div className="w-full max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter.id}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -25, scale: 1.03 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center pointer-events-auto"
            >
              {/* Chapter Tag Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-2xl border border-primary-fixed-dim/30 shadow-[0_0_20px_rgba(0,223,190,0.15)] mb-5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-ping" />
                <span className="font-mono text-primary-fixed-dim text-xs tracking-widest uppercase font-semibold">
                  {activeChapter.tag}
                </span>
                <span className="text-white/20">·</span>
                <span className="text-on-surface-variant text-xs uppercase tracking-wider">
                  {activeChapter.badge}
                </span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-white font-display-lg text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] mb-4">
                {activeChapter.title}
              </h1>

              {/* Subtitle / Narrative Description */}
              <p className="text-on-surface-variant text-sm sm:text-base md:text-lg max-w-2xl font-body-md leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] mb-8">
                {activeChapter.description}
              </p>

              {/* Chapter 2 & 4 Feature Pills */}
              {activeChapter.pills && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex flex-wrap justify-center gap-2.5 max-w-2xl mb-8"
                >
                  {activeChapter.pills.map((pill, pIdx) => (
                    <div
                      key={pIdx}
                      className="px-3.5 py-1.5 rounded-full bg-surface-container-low/70 backdrop-blur-xl border border-outline-variant/40 text-xs text-on-surface font-medium hover:border-primary-fixed-dim/60 hover:bg-primary-fixed-dim/10 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                    >
                      {pill}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Live Metric Cards */}
              {activeChapter.stats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 w-full max-w-2xl mb-8"
                >
                  {activeChapter.stats.map((stat, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 md:p-4 rounded-xl bg-surface-container-high/60 backdrop-blur-2xl border border-outline-variant/30 flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] group hover:border-primary-fixed-dim/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary-fixed-dim text-xl mb-1 group-hover:scale-110 transition-transform">
                        {stat.icon}
                      </span>
                      <span className="text-white font-display-lg text-sm sm:text-base font-semibold tracking-tight">
                        {stat.value}
                      </span>
                      <span className="text-on-surface-variant/70 text-[11px] tracking-wider uppercase">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Chapter 5 Final Launch Buttons */}
              {activeChapter.cta && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-center gap-4"
                >
                  {activeChapter.cta.map((btn, bIdx) => (
                    <div key={bIdx}>
                      {btn.primary ? (
                        <Link
                          href={btn.href}
                          className="px-8 py-4 rounded-full bg-gradient-to-r from-primary-fixed to-primary-fixed-dim text-on-primary font-display-lg text-sm sm:text-base font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,223,190,0.5)] flex items-center gap-3 group"
                        >
                          <span>{btn.label}</span>
                          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                            rocket_launch
                          </span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => jumpToChapter(1)}
                          className="px-6 py-4 rounded-full bg-surface-container-high/70 backdrop-blur-xl border border-outline-variant/50 text-white font-display-lg text-xs sm:text-sm uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">
                            restart_alt
                          </span>
                          <span>{btn.label}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Bottom Timeline Scrubber & Story Telemetry ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 p-6 md:px-12 md:pb-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          {/* Scrubber Info Row */}
          <div className="flex items-center justify-between text-xs font-mono">
            {/* Scroll Indicator Prompt */}
            <div className="flex items-center gap-2.5 text-on-surface-variant/80">
              <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-1 h-2 rounded-full bg-primary-fixed-dim"
                />
              </div>
              <span className="text-[11px] tracking-wider uppercase">
                {scrollProgress < 0.95 ? "Scroll Down to Traverse Story" : "Scroll Up to Reverse"}
              </span>
            </div>

            {/* Live Timecode & Frame Position */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high/50 border border-outline-variant/30 text-[10px]">
                <span className="text-on-surface-variant/60">VELOCITY:</span>
                <span className="text-primary-fixed-dim">
                  {Math.abs(scrubVelocity).toFixed(2)}x
                </span>
              </div>

              <div className="px-3 py-1 rounded bg-surface-container-high/70 border border-outline-variant/40 text-[11px] text-white">
                <span className="text-primary-fixed-dim font-bold">{currentTimeDisplay}s</span>
                <span className="text-white/40"> / </span>
                <span className="text-white/70">{totalTimeDisplay}s</span>
              </div>
            </div>
          </div>

          {/* Interactive Progress Timeline Track */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              targetProgressRef.current = Math.max(0, Math.min(1, clickPos));
            }}
            className="group relative w-full h-2 rounded-full bg-white/10 backdrop-blur-md cursor-pointer overflow-hidden p-0.5"
          >
            {/* Filled Progress Bar */}
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-fixed via-primary-fixed-dim to-[#fee24a] shadow-[0_0_15px_#00dfbe]"
              style={{ width: `${scrollProgress * 100}%` }}
            />

            {/* Chapter Milestone Ticks */}
            {CHAPTERS.map((ch) => (
              <div
                key={ch.id}
                style={{ left: `${ch.progressStart * 100}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 group-hover:bg-white/60 pointer-events-none"
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
