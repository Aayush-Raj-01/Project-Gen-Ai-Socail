"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar, type SearchResultItem } from "../components/SearchBar";
import { NavyButton } from "../components/NavyButton";
import "./mainpage.css";

/* ────────────────────────────────────────────
   Data for the bubble-type popup selectors
   ──────────────────────────────────────────── */
const SELECTOR_DATA = {
  targetAudience: {
    label: "Target Audience",
    icon: "👥",
    theme: "audience",
    options: [
      "Student",
      "Executive",
      "Employees",
      "General",
      "Creator",
      "Technical Team",
    ],
  },
  tone: {
    label: "Tone",
    icon: "🎭",
    theme: "tone",
    options: [
      "Professional",
      "Formal",
      "Casual",
      "Marketing",
      "Educational",
      "Urgent",
    ],
  },
  language: {
    label: "Language",
    icon: "🌐",
    theme: "language",
    options: ["English", "Hindi", "French"],
  },
  levelOfDetail: {
    label: "Level of Detail",
    icon: "📊",
    theme: "detail",
    options: ["Short", "Medium", "Detailed"],
  },
  communicationObjective: {
    label: "Objective",
    icon: "🎯",
    theme: "objective",
    options: [
      "Awareness",
      "Training",
      "Marketing",
      "Incident Response",
      "Reporting",
      "Decision Making",
    ],
  },
  contentStyle: {
    label: "Content Style",
    icon: "✍️",
    theme: "style",
    options: [
      "Bullet Points",
      "Storytelling",
      "Tables",
      "Business-oriented",
      "Data-Driven",
    ],
  },
} as const;

type SelectorKey = keyof typeof SELECTOR_DATA;

interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  z: number;
}

class Particle3D {
  x: number = 0;
  y: number = 0;
  z: number = 0;
  vx: number = 0;
  vy: number = 0;
  vz: number = 0;
  baseColor: string = "";

  constructor(width: number, height: number) {
    this.reset(width, height);
  }

  reset(width: number, height: number): void {
    this.x = (Math.random() - 0.5) * width * 1.2;
    this.y = (Math.random() - 0.5) * height * 1.2;
    this.z = (Math.random() - 0.5) * 600;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.vz = (Math.random() - 0.5) * 0.4;
    this.baseColor = Math.random() > 0.4 ? "0, 242, 254" : "176, 87, 254";
  }

  update(width: number, height: number): void {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    const boundX = (width * 1.2) / 2;
    const boundY = (height * 1.2) / 2;
    const boundZ = 300;

    if (Math.abs(this.x) > boundX) this.vx *= -1;
    if (Math.abs(this.y) > boundY) this.vy *= -1;
    if (Math.abs(this.z) > boundZ) this.vz *= -1;
  }

  project(rotX: number, rotY: number, width: number, height: number, fov: number): ProjectedPoint {
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = this.x * cosY - this.z * sinY;
    const z1 = this.z * cosY + this.x * sinY;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y1 = this.y * cosX - z1 * sinX;
    const z2 = z1 * cosX + this.y * sinX;

    const scale = fov / (fov + z2 + 400);

    return {
      x: x1 * scale + width / 2,
      y: y1 * scale + height / 2,
      scale,
      z: z2,
    };
  }
}

export const PlexusHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const PARTICLE_COUNT = 85;
    const MAX_DISTANCE = 170;
    const FOV = 350;

    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;
    let animationFrameId: number;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) * 0.0005;
      mouseY = (e.clientY - height / 2) * 0.0005;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    const particles: Particle3D[] = Array.from(
      { length: PARTICLE_COUNT },
      () => new Particle3D(width, height)
    );

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      targetRotationY += (mouseX - targetRotationY) * 0.05;
      targetRotationX += (mouseY - targetRotationX) * 0.05;
      rotationY += 0.001 + targetRotationY * 0.1;
      rotationX += targetRotationX * 0.1;

      particles.forEach((p) => p.update(width, height));

      const projected = particles.map((p) => ({
        data: p,
        proj: p.project(rotationX, rotationY, width, height, FOV),
      }));

      // Draw Connection Lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i].proj;
          const p2 = projected[j].proj;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DISTANCE) {
            const alpha = (1 - dist / MAX_DISTANCE) * 0.35 * Math.min(p1.scale, p2.scale);
            ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
            ctx.lineWidth = 0.8 * Math.min(p1.scale, p2.scale);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Glowing Nodes
      projected.forEach(({ data, proj }) => {
        if (proj.scale > 0) {
          const radius = Math.max(1, 2.2 * proj.scale);
          ctx.fillStyle = `rgba(${data.baseColor}, ${0.8 * proj.scale})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `rgba(${data.baseColor}, 0.8)`;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="plexus-canvas"
      className="mp-plexus-canvas"
    />
  );
};

export default function MainPage() {
  // ── State ──
  const [prompt, setPrompt] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const item = params.get("item");
      const cat = params.get("cat");
      if (q) {
        return `Create high-impact social content for: ${q}`;
      } else if (item) {
        if (cat === "Templates") {
          return `Create a ${item} focusing on: `;
        } else {
          return `Work with ${item}: `;
        }
      }
    }
    return "";
  });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<
    { name: string; type: string; file: File }[]
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [openSelector, setOpenSelector] = useState<SelectorKey | null>(null);
  const [selections, setSelections] = useState<
    Partial<Record<SelectorKey, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──
  const handleFileAttach = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
      const files = e.target.files;
      if (files) {
        const newFiles = Array.from(files).map((f) => ({
          name: f.name,
          type,
          file: f,
        }));
        setAttachedFiles((prev) => [...prev, ...newFiles]);
      }
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleSelector = useCallback(
    (key: SelectorKey) => {
      setOpenSelector((prev) => (prev === key ? null : key));
    },
    []
  );

  const selectOption = useCallback((key: SelectorKey, option: string) => {
    setSelections((prev) => ({
      ...prev,
      [key]: prev[key] === option ? undefined : option,
    }));
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
  }, []);

  const handleSearchResultSelect = useCallback((item: SearchResultItem) => {
    if (item.category === "Templates") {
      setPrompt((prev) =>
        prev
          ? `${prev}\n\n[Template: ${item.title}]`
          : `Create a ${item.title} focusing on: `
      );
    } else if (item.id === "sel-tone-prof") {
      setSelections((prev) => ({ ...prev, tone: "Professional" }));
    } else if (item.id === "sel-tone-casual") {
      setSelections((prev) => ({ ...prev, tone: "Casual" }));
    } else if (item.id === "sel-audience-student") {
      setSelections((prev) => ({ ...prev, targetAudience: "Student" }));
    } else if (item.id === "sel-audience-exec") {
      setSelections((prev) => ({ ...prev, targetAudience: "Executive" }));
    } else if (item.id === "sel-audience-tech") {
      setSelections((prev) => ({ ...prev, targetAudience: "Technical Team" }));
    } else if (item.id === "tool-img") {
      imageInputRef.current?.click();
    } else if (item.id === "tool-ocr") {
      pdfInputRef.current?.click();
    } else if (item.id === "tool-voice") {
      setIsRecording(true);
    }
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
    console.log("Search query submitted:", query);
  }, []);

  const handleCopy = useCallback((text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const imageFile = attachedFiles.find((f) => f.type === "image");
    const videoFile = attachedFiles.find((f) => f.type === "video");
    const audioFile = attachedFiles.find((f) => f.type === "audio");
    const pdfFile = attachedFiles.find((f) => f.type === "pdf");
    const hasPrompt = prompt.trim().length > 0;

    const fileToSend = imageFile || videoFile || audioFile || pdfFile;

    if (!fileToSend && !hasPrompt) {
      setError("Please enter a prompt or attach a file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setModerationWarning(null);

    // Assemble prompt text with user-selected preferences and reference link
    const activeSelections = Object.entries(selections)
      .filter(([, val]) => Boolean(val))
      .map(([key, val]) => `${SELECTOR_DATA[key as SelectorKey]?.label || key}: ${val}`);

    let fullPrompt = prompt.trim();
    if (linkValue.trim()) {
      fullPrompt = fullPrompt ? `${fullPrompt}\n\nReference Link: ${linkValue.trim()}` : `Reference Link: ${linkValue.trim()}`;
    }
    if (activeSelections.length > 0) {
      fullPrompt = fullPrompt
        ? `${fullPrompt}\n\n[Preferences: ${activeSelections.join(", ")}]`
        : `[Preferences: ${activeSelections.join(", ")}]`;
    }

    try {
      let res: Response;

      if (fileToSend) {
        const formData = new FormData();
        formData.append("file", fileToSend.file);
        if (fullPrompt) formData.append("prompt", fullPrompt);

        let endpoint = "http://localhost:8000/analyze-image";
        if (fileToSend.type === "video") endpoint = "http://localhost:8000/analyze-video";
        if (fileToSend.type === "audio") endpoint = "http://localhost:8000/analyze-audio";
        if (fileToSend.type === "pdf") endpoint = "http://localhost:8000/analyze-pdf";

        res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("http://localhost:8000/process-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 403 && errData?.detail?.type === "content_violation") {
          setModerationWarning(errData.detail.reason);
          return;
        }
        throw new Error(errData?.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [attachedFiles, prompt, selections, linkValue]);

  const quickChips = [
    { label: "Viral Launch", icon: "🚀", theme: "launch", text: "Create a high-impact product launch announcement for: " },
    { label: "LinkedIn Strategy", icon: "💼", theme: "linkedin", text: "Write a thought-provoking LinkedIn post with actionable insights on: " },
    { label: "Carousel Script", icon: "📸", theme: "carousel", text: "Design a 5-slide Instagram carousel breakdown with hooks and visuals for: " },
    { label: "Executive Brief", icon: "📊", theme: "brief", text: "Produce a bulleted executive summary and recommendations on: " },
  ];

  return (
    <div className="mainpage-root">
      {/* ── Moderation Warning Popup ── */}
      {moderationWarning && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 999,
            }}
            onClick={() => setModerationWarning(null)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(440px, 90vw)",
              background: "#090D0E",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 20,
              padding: "32px 28px",
              zIndex: 1000,
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.8)",
              animation: "fadeIn 0.25s ease-out",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 48 }}>🛡️</span>
            </div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 12,
            }}>
              Content Notice
            </h3>
            <p style={{
              fontSize: 14,
              color: "#94A3B8",
              textAlign: "center",
              lineHeight: 1.6,
              marginBottom: 24,
            }}>
              Your request was flagged by our content safety system:
            </p>
            <div style={{
              background: "rgba(15, 34, 32, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 24,
            }}>
              <p style={{
                fontSize: 13,
                color: "#FFFFFF",
                lineHeight: 1.6,
                margin: 0,
              }}>
                {moderationWarning}
              </p>
            </div>
            <button
              onClick={() => setModerationWarning(null)}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 0",
                background: "#2DD4BF",
                border: "none",
                borderRadius: 12,
                color: "#090D0E",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Understood
            </button>
          </div>
        </>
      )}

      {/* ── Fixed 3D Plexus Background Canvas ── */}
      <PlexusHero />

      {/* ── Animated Mesh / Aurora Gradient Background ── */}
      <div className="mp-aurora-container" aria-hidden="true">
        <div className="mp-aurora-blob blob-1" />
        <div className="mp-aurora-blob blob-2" />
        <div className="mp-aurora-blob blob-3" />
        <div className="mp-aurora-blob blob-4" />
        <div className="mp-aurora-overlay" />
      </div>

      {/* ── Header ── */}
      <header className="mp-header">
        <Link href="/" className="mp-logo-wrap">
          <motion.div
            className="mp-logo-icon"
            whileHover={{
              scale: 1.35,
              rotate: [0, -20, 20, -10, 10, 0],
              y: -2,
              transition: { duration: 0.5, ease: "easeOut" },
            }}
            whileTap={{ scale: 0.85, rotate: 0 }}
          >
            ⚡
          </motion.div>
          <span className="mp-logo">GenAI Social</span>
          <span className="mp-logo-badge">Studio</span>
        </Link>

        {/* ── Search Bar ── */}
        <SearchBar
          placeholder="Search templates, models, selectors..."
          onSelectResult={handleSearchResultSelect}
          onSearchSubmit={handleSearchSubmit}
          className="mp-header-search"
        />

        <div className="mp-header-actions">
          <Link href="/landingpage">
            <NavyButton variant="gradient" size="sm">
              ← Landing
            </NavyButton>
          </Link>
          <button className="mp-header-btn">Templates</button>
          <button className="mp-header-btn">Settings</button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mp-content">
        {/* Soft Radial Glow for depth behind Hero Section */}
        <div className="mp-hero-radial-glow" />

        <h1 className="mp-title">
          Craft your content with a touch of{" "}
          <span className="mp-title-highlight">intelligence</span>
        </h1>

        {/* ── Prompt Card ── */}
        <div className="mp-prompt-card">
          {/* Textarea */}
          <div className="mp-textarea-wrap">
            <textarea
              className="mp-textarea"
              placeholder="Describe what you want to create or attach an image / video / audio / document..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* Attached Files with Dark-Shaded Badges & Motion */}
          {attachedFiles.length > 0 && (
            <div className="mp-attachments">
              <AnimatePresence>
                {attachedFiles.map((file, i) => (
                  <motion.span
                    key={i}
                    className={`mp-attachment-chip chip-${file.type}`}
                    initial={{ opacity: 0, scale: 0.8, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.06, y: -2 }}
                  >
                    <motion.span
                      className={`mp-icon-badge mp-attach-icon-badge badge-${file.type}`}
                      whileHover={{
                        scale: 1.4,
                        rotate: [0, -16, 16, 0],
                        transition: { duration: 0.35, ease: "easeOut" },
                      }}
                    >
                      {file.type === "image"
                        ? "🖼️"
                        : file.type === "pdf"
                        ? "📄"
                        : file.type === "video"
                        ? "🎬"
                        : "🎙️"}
                    </motion.span>
                    <span className="mp-attach-filename">{file.name}</span>
                    <motion.button
                      className="mp-attachment-remove"
                      onClick={() => removeFile(i)}
                      title="Remove attachment"
                      whileHover={{ scale: 1.3, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ×
                    </motion.button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Link Input */}
          <AnimatePresence>
            {showLinkInput && (
              <motion.div
                className="mp-link-section"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mp-link-input-wrap">
                  <motion.span
                    className="mp-icon-badge mp-link-icon-badge"
                    whileHover={{
                      scale: 1.4,
                      rotate: [0, -20, 20, -10, 0],
                      transition: { duration: 0.4, ease: "easeOut" },
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    🔗
                  </motion.span>
                  <input
                    className="mp-link-input"
                    type="url"
                    placeholder="Paste a reference URL here..."
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    autoFocus
                  />
                  <motion.button
                    className="mp-link-close"
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkValue("");
                    }}
                    title="Close link input"
                    whileHover={{ scale: 1.25, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ×
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            className="mp-hidden-input"
            type="file"
            accept="image/*"
            onChange={(e) => handleFileAttach(e, "image")}
          />
          <input
            ref={pdfInputRef}
            className="mp-hidden-input"
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileAttach(e, "pdf")}
          />
          <input
            ref={videoInputRef}
            className="mp-hidden-input"
            type="file"
            accept="video/*"
            onChange={(e) => handleFileAttach(e, "video")}
          />

          {/* Toolbar with Enhanced Motion-Animated Dark-Shaded Icon Badges */}
          <div className="mp-toolbar">
            <div className="mp-toolbar-left">
              <motion.button
                className="mp-tool-btn tool-image"
                onClick={() => imageInputRef.current?.click()}
                title="Upload image for Florence-2 Vision & OCR"
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <motion.span
                  className="mp-icon-badge mp-tool-icon-badge"
                  whileHover={{
                    scale: 1.45,
                    rotate: [0, -18, 16, -10, 6, 0],
                    y: -2,
                    transition: { duration: 0.45, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.85 }}
                >
                  🖼️
                </motion.span>
                <span>Image</span>
              </motion.button>

              <motion.button
                className="mp-tool-btn tool-pdf"
                onClick={() => pdfInputRef.current?.click()}
                title="Attach PDF document"
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <motion.span
                  className="mp-icon-badge mp-tool-icon-badge"
                  whileHover={{
                    scale: 1.45,
                    y: [0, -4, 2, -2, 0],
                    rotate: [0, -14, 14, 0],
                    transition: { duration: 0.45, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.85 }}
                >
                  📄
                </motion.span>
                <span>PDF</span>
              </motion.button>

              <motion.button
                className="mp-tool-btn tool-video"
                onClick={() => videoInputRef.current?.click()}
                title="Attach video file"
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <motion.span
                  className="mp-icon-badge mp-tool-icon-badge"
                  whileHover={{
                    scale: 1.45,
                    rotate: [0, 18, -16, 8, 0],
                    y: -2,
                    transition: { duration: 0.45, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.85 }}
                >
                  🎬
                </motion.span>
                <span>Video</span>
              </motion.button>

              <div
                style={{
                  width: "1px",
                  height: "22px",
                  background: "rgba(255,255,255,0.08)",
                  margin: "0 4px",
                }}
              />

              <motion.button
                className={`mp-tool-btn tool-link ${showLinkInput ? "active" : ""}`}
                onClick={() => setShowLinkInput(!showLinkInput)}
                title="Add reference link"
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <motion.span
                  className="mp-icon-badge mp-tool-icon-badge"
                  whileHover={{
                    scale: 1.45,
                    rotate: [0, -20, 20, -10, 0],
                    y: -2,
                    transition: { duration: 0.45, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.85 }}
                >
                  🔗
                </motion.span>
                <span>Link</span>
              </motion.button>

              <motion.button
                className={`mp-audio-btn ${isRecording ? "recording" : ""}`}
                onClick={toggleRecording}
                title="Voice input"
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                {isRecording ? (
                  <>
                    <motion.span
                      className="mp-recording-dot"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <motion.span
                      className="mp-icon-badge mp-tool-icon-badge"
                      whileHover={{
                        scale: 1.45,
                        y: [0, -3, 1, -2, 0],
                        rotate: [0, -16, 16, 0],
                        transition: { duration: 0.45, ease: "easeOut" },
                      }}
                      whileTap={{ scale: 0.85 }}
                    >
                      🎙️
                    </motion.span>
                    <span>Audio</span>
                  </>
                )}
              </motion.button>
            </div>

            <motion.button
              className="mp-submit-btn"
              disabled={isLoading || (attachedFiles.length === 0 && prompt.trim().length === 0)}
              title="Generate with GenAI"
              onClick={handleSubmit}
              whileHover={{
                scale: 1.18,
                y: -3,
                rotate: [0, -8, 8, 0],
                transition: { type: "spring", stiffness: 450, damping: 14 },
              }}
              whileTap={{ scale: 0.88, y: 0 }}
            >
              {isLoading ? "⏳" : "➜"}
            </motion.button>
          </div>
        </div>

        {/* ── Quick Prompt Inspiration Chips with Motion ── */}
        <div className="mp-quick-prompts">
          <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: "#90a4a2", marginRight: "6px" }}>
            Suggested:
          </span>
          {quickChips.map((chip, idx) => (
            <motion.button
              key={idx}
              className="mp-quick-chip"
              onClick={() => setPrompt(chip.text)}
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
            >
              <motion.span
                className={`mp-icon-badge mp-quick-icon-badge badge-${chip.theme}`}
                whileHover={
                  chip.theme === "launch"
                    ? {
                        scale: 1.5,
                        x: [0, 3, 5, 2, 0],
                        y: [0, -5, -8, -3, 0],
                        rotate: [0, -16, -24, -12, 0],
                        transition: { duration: 0.45, ease: "easeOut" },
                      }
                    : chip.theme === "linkedin"
                    ? {
                        scale: 1.45,
                        rotate: [0, -18, 18, -10, 6, 0],
                        y: -3,
                        transition: { duration: 0.45, ease: "easeOut" },
                      }
                    : chip.theme === "carousel"
                    ? {
                        scale: 1.45,
                        rotate: [0, 18, -16, 10, 0],
                        y: -3,
                        transition: { duration: 0.45, ease: "easeOut" },
                      }
                    : {
                        scale: 1.45,
                        y: [0, -5, 2, -3, 0],
                        rotate: [0, -12, 12, 0],
                        transition: { duration: 0.45, ease: "easeOut" },
                      }
                }
              >
                {chip.icon}
              </motion.span>
              <span>{chip.label}</span>
            </motion.button>
          ))}
        </div>

        {/* ── Bubble-Type Selector Bar with Dedicated Dark Badges & Motion ── */}
        <div className="mp-selectors-bar">
          {(Object.keys(SELECTOR_DATA) as SelectorKey[]).map((key) => {
            const data = SELECTOR_DATA[key];
            const isOpen = openSelector === key;
            const selectedValue = selections[key];

            return (
              <div key={key} style={{ position: "relative" }}>
                <motion.button
                  className={`mp-selector-trigger ${isOpen ? "active" : ""} ${
                    selectedValue ? "has-value" : ""
                  }`}
                  onClick={() => toggleSelector(key)}
                  whileHover={{ y: -3, scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <motion.span
                    className={`mp-icon-badge mp-selector-icon-badge badge-${data.theme}`}
                    whileHover={{
                      scale: 1.45,
                      rotate: [0, -18, 18, -10, 6, 0],
                      y: -2,
                      transition: { duration: 0.45, ease: "easeOut" },
                    }}
                    whileTap={{ scale: 0.85 }}
                  >
                    {data.icon}
                  </motion.span>
                  <span>{data.label}</span>
                  {selectedValue && (
                    <span className="mp-selector-value">{selectedValue}</span>
                  )}
                  <motion.span
                    className="mp-selector-chevron"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▼
                  </motion.span>
                </motion.button>

                {/* Popup Dropdown with AnimatePresence */}
                <AnimatePresence>
                  {isOpen && (
                    <>
                      <div
                        className="mp-popup-overlay"
                        onClick={() => setOpenSelector(null)}
                      />
                      <motion.div
                        className="mp-popup"
                        initial={{ opacity: 0, scale: 0.92, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.92, y: 8, x: "-50%" }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      >
                        <div className="mp-popup-title">{data.label}</div>
                        {data.options.map((option) => (
                          <motion.button
                            key={option}
                            className={`mp-popup-option ${
                              selectedValue === option ? "selected" : ""
                            }`}
                            onClick={() => {
                              selectOption(key, option);
                              setOpenSelector(null);
                            }}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <span className="mp-popup-option-dot" />
                            {option}
                          </motion.button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ── Error Message ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              style={{
                marginTop: 24,
                padding: "16px 22px",
                borderRadius: 14,
                background: "rgba(15, 34, 32, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                fontSize: 13.5,
                width: "100%",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading Indicator ── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              style={{
                marginTop: 32,
                textAlign: "center",
                color: "#2DD4BF",
                fontSize: 15,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "18px" }}>⏳</span>
              <span>Synthesizing multimodal pipeline...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Response Display with Motion ── */}
        <AnimatePresence>
          {response && (
            <motion.div
              className="mp-result-container"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="mp-result-header">
                <div className="mp-result-title-wrap">
                  <motion.span
                    className="mp-icon-badge badge-final"
                    style={{ width: "28px", height: "28px", fontSize: "15px" }}
                    whileHover={{
                      scale: 1.4,
                      rotate: [0, -20, 20, -10, 0],
                      y: -2,
                      transition: { duration: 0.45, ease: "easeOut" },
                    }}
                    whileTap={{ scale: 0.88 }}
                  >
                    ⚡
                  </motion.span>
                  <span className="mp-result-title">Pipeline Output</span>
                  <span className="mp-result-badge">AI Generated</span>
                </div>
                {Boolean(response.final_output) && (
                  <motion.button
                    className="mp-copy-btn"
                    onClick={() => handleCopy(String(response.final_output))}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {copied ? "✓ Copied!" : "📋 Copy Output"}
                  </motion.button>
                )}
              </div>

              {/* Final Output */}
              {Boolean(response.final_output) && (
                <div className="mp-result-section">
                  <div className="mp-section-tag">
                    <motion.span
                      className="mp-icon-badge mp-tag-icon-badge badge-final"
                      whileHover={{
                        scale: 1.45,
                        rotate: [0, -18, 18, -6, 0],
                        y: -2,
                        transition: { duration: 0.4, ease: "easeOut" },
                      }}
                      whileTap={{ scale: 0.88 }}
                    >
                      🎯
                    </motion.span>
                    <span>Final Polished Content</span>
                  </div>
                  <div className="mp-final-box">
                    {String(response.final_output)}
                  </div>
                </div>
              )}

              {/* Image Analysis */}
              {Boolean(response.image_analysis) && (
                <div className="mp-result-section">
                  <div className="mp-section-tag">
                    <motion.span
                      className="mp-icon-badge mp-tag-icon-badge badge-vision"
                      whileHover={{
                        scale: 1.45,
                        rotate: [0, -16, 16, 0],
                        y: -2,
                        transition: { duration: 0.4, ease: "easeOut" },
                      }}
                      whileTap={{ scale: 0.88 }}
                    >
                      🖼️
                    </motion.span>
                    <span>Vision & OCR Breakdown</span>
                  </div>
                  <div className="mp-vision-box">
                    {String((response.image_analysis as Record<string, unknown>).image_description || "")}
                  </div>
                  {Boolean((response.image_analysis as Record<string, unknown>).ocr_text) && (
                    <div className="mp-ocr-box">
                      <strong>Extracted Text (OCR):</strong> {String((response.image_analysis as Record<string, unknown>).ocr_text)}
                    </div>
                  )}
                </div>
              )}

              {/* Video Analysis */}
              {Boolean(response.video_analysis) && (
                <div className="mp-result-section">
                  <div className="mp-section-tag">
                    <motion.span
                      className="mp-icon-badge mp-tag-icon-badge badge-video"
                      whileHover={{
                        scale: 1.45,
                        rotate: [0, 18, -16, 0],
                        y: -2,
                        transition: { duration: 0.4, ease: "easeOut" },
                      }}
                      whileTap={{ scale: 0.88 }}
                    >
                      🎬
                    </motion.span>
                    <span>Video Analysis</span>
                  </div>
                  <div className="mp-vision-box">
                    <strong>Language:</strong> {String((response.video_analysis as Record<string, unknown>).language || "unknown")}
                    <div style={{ marginTop: 8 }}>
                      <strong>Transcription:</strong> {String((response.video_analysis as Record<string, unknown>).transcription || "None")}
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Analysis */}
              {Boolean(response.audio_analysis) && (
                <div className="mp-result-section">
                  <div className="mp-section-tag">
                    <motion.span
                      className="mp-icon-badge mp-tool-icon-badge badge-audio"
                      whileHover={{
                        scale: 1.45,
                        y: [0, -4, 2, 0],
                        rotate: [0, -15, 15, 0],
                        transition: { duration: 0.4, ease: "easeOut" },
                      }}
                      whileTap={{ scale: 0.88 }}
                    >
                      🎙️
                    </motion.span>
                    <span>Audio Analysis</span>
                  </div>
                  <div className="mp-ocr-box">
                    <strong>Language:</strong> {String((response.audio_analysis as Record<string, unknown>).language || "unknown")}
                    <div style={{ marginTop: 8 }}>
                      <strong>Transcription:</strong> {String((response.audio_analysis as Record<string, unknown>).transcription || "None")}
                    </div>
                  </div>
                </div>
              )}

              {/* PDF Analysis */}
              {Boolean(response.pdf_analysis) && (
                <div className="mp-result-section">
                  <div className="mp-section-tag">
                    <motion.span
                      className="mp-icon-badge mp-tag-icon-badge badge-vision"
                      whileHover={{
                        scale: 1.45,
                        y: [0, -4, 2, 0],
                        rotate: [0, -14, 14, 0],
                        transition: { duration: 0.4, ease: "easeOut" },
                      }}
                      whileTap={{ scale: 0.88 }}
                    >
                      📄
                    </motion.span>
                    <span>PDF Analysis</span>
                  </div>
                  <div className="mp-vision-box">
                    <strong>Pages:</strong> {String((response.pdf_analysis as Record<string, unknown>).page_count || 0)} | <strong>Method:</strong> {String((response.pdf_analysis as Record<string, unknown>).method || "unknown")}
                    <div style={{ marginTop: 8 }}>
                      <strong>Extracted Text:</strong> {String((response.pdf_analysis as Record<string, unknown>).extracted_text || "None")}
                    </div>
                  </div>
                </div>
              )}

              {/* Gemini Output */}
              {Boolean(response.gemini_output) && (
                <details className="mp-details-toggle">
                  <summary className="mp-details-summary">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <motion.span
                        className="mp-icon-badge badge-audience"
                        style={{ width: "20px", height: "20px", fontSize: "11px" }}
                        whileHover={{ scale: 1.45, rotate: [0, -18, 18, 0] }}
                        whileTap={{ scale: 0.88 }}
                      >
                        🧠
                      </motion.span>
                      <span>Gemini Model Output</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Click to expand ▼</span>
                  </summary>
                  <div className="mp-details-content">
                    {String(response.gemini_output)}
                  </div>
                </details>
              )}

              {/* Compressed Data */}
              {Boolean(response.compressed_data) && (
                <details className="mp-details-toggle">
                  <summary className="mp-details-summary">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <motion.span
                        className="mp-icon-badge badge-brief"
                        style={{ width: "20px", height: "20px", fontSize: "11px" }}
                        whileHover={{ scale: 1.45, y: [0, -4, 2, 0] }}
                        whileTap={{ scale: 0.88 }}
                      >
                        📦
                      </motion.span>
                      <span>Compressed Knowledge Schema (JSON)</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Click to expand ▼</span>
                  </summary>
                  <div className="mp-details-content">
                    <pre className="mp-json-box">
                      {JSON.stringify(response.compressed_data, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
