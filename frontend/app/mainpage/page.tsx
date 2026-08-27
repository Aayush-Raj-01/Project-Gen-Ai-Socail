"use client";

import { useState, useRef, useCallback } from "react";

/* ────────────────────────────────────────────
   Data for the bubble-type popup selectors
   ──────────────────────────────────────────── */
const SELECTOR_DATA = {
  targetAudience: {
    label: "Target Audience",
    icon: "👥",
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
    options: ["English", "Hindi", "French"],
  },
  levelOfDetail: {
    label: "Level of Detail",
    icon: "📊",
    options: ["Short", "Medium", "Detailed"],
  },
  communicationObjective: {
    label: "Objective",
    icon: "🎯",
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

/* ────────────────────────────────────────────
   Inline styles (no separate CSS file needed)
   ──────────────────────────────────────────── */

export default function MainPage() {
  // ── State ──
  const [prompt, setPrompt] = useState("");
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
      setOpenSelector(openSelector === key ? null : key);
    },
    [openSelector]
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

  const handleSubmit = useCallback(async () => {
    // Find the first image file to send
    const imageFile = attachedFiles.find((f) => f.type === "image");
    if (!imageFile) {
      setError("Please attach an image file to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile.file);

      const res = await fetch("http://localhost:8000/analyze-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [attachedFiles]);

  return (
    <div className="mainpage-root">
      <style>{`
        /* ── Reset & Base ── */
        .mainpage-root {
          min-height: 100vh;
          background: #050a09;
          color: #e0e8e6;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Ambient Background Glow ── */
        .mainpage-root::before {
          content: '';
          position: fixed;
          top: -40%;
          left: -20%;
          width: 80%;
          height: 80%;
          background: radial-gradient(ellipse at center, rgba(0, 200, 150, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .mainpage-root::after {
          content: '';
          position: fixed;
          bottom: -30%;
          right: -20%;
          width: 70%;
          height: 70%;
          background: radial-gradient(ellipse at center, rgba(0, 180, 140, 0.04) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .mp-header {
          width: 100%;
          max-width: 1200px;
          padding: 24px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 10;
        }

        .mp-logo {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #00c896 0%, #00a87a 50%, #008f6a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mp-logo-sub {
          font-size: 11px;
          font-weight: 400;
          color: rgba(255,255,255,0.3);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-left: 8px;
        }

        .mp-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mp-header-btn {
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0, 200, 150, 0.15);
          background: rgba(0, 200, 150, 0.06);
          color: #a0d4c4;
        }

        .mp-header-btn:hover {
          background: rgba(0, 200, 150, 0.12);
          border-color: rgba(0, 200, 150, 0.3);
          color: #00c896;
        }

        /* ── Main Content ── */
        .mp-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 820px;
          padding: 40px 24px 60px;
          position: relative;
          z-index: 10;
        }

        .mp-title {
          font-size: 38px;
          font-weight: 300;
          text-align: center;
          margin-bottom: 8px;
          letter-spacing: -1px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.2;
        }

        .mp-title em {
          font-style: italic;
          font-weight: 400;
          background: linear-gradient(135deg, #00c896 0%, #4aedc4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mp-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.35);
          text-align: center;
          margin-bottom: 40px;
          letter-spacing: 0.3px;
        }

        /* ── Prompt Card ── */
        .mp-prompt-card {
          width: 100%;
          background: rgba(10, 20, 18, 0.85);
          border: 1px solid rgba(0, 200, 150, 0.08);
          border-radius: 20px;
          padding: 0;
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow:
            0 0 60px rgba(0, 200, 150, 0.03),
            0 20px 60px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }

        .mp-prompt-card:focus-within {
          border-color: rgba(0, 200, 150, 0.2);
          box-shadow:
            0 0 80px rgba(0, 200, 150, 0.06),
            0 20px 60px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        /* ── Prompt Textarea ── */
        .mp-textarea-wrap {
          padding: 24px 28px 12px;
        }

        .mp-textarea {
          width: 100%;
          min-height: 100px;
          background: transparent;
          border: none;
          outline: none;
          color: #d4e8e2;
          font-size: 15px;
          line-height: 1.7;
          resize: none;
          font-family: inherit;
          letter-spacing: 0.2px;
        }

        .mp-textarea::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        /* ── Attached Files ── */
        .mp-attachments {
          padding: 0 28px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mp-attachment-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(0, 200, 150, 0.08);
          border: 1px solid rgba(0, 200, 150, 0.12);
          color: #7dd4b8;
          animation: chipIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes chipIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .mp-attachment-remove {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          transition: color 0.2s;
        }

        .mp-attachment-remove:hover {
          color: #ff6b6b;
        }

        /* ── Link Input ── */
        .mp-link-section {
          padding: 0 28px;
          margin-top: 8px;
          animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mp-link-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(0, 200, 150, 0.04);
          border: 1px solid rgba(0, 200, 150, 0.1);
        }

        .mp-link-icon {
          font-size: 14px;
          color: rgba(0, 200, 150, 0.5);
        }

        .mp-link-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #a0d4c4;
          font-size: 13px;
          font-family: inherit;
        }

        .mp-link-input::placeholder {
          color: rgba(255, 255, 255, 0.15);
        }

        .mp-link-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.25);
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          transition: color 0.2s;
        }

        .mp-link-close:hover {
          color: #ff6b6b;
        }

        /* ── Toolbar ── */
        .mp-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          margin-top: 8px;
        }

        .mp-toolbar-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mp-tool-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.45);
        }

        .mp-tool-btn:hover {
          background: rgba(0, 200, 150, 0.08);
          color: #7dd4b8;
          border-color: rgba(0, 200, 150, 0.12);
        }

        .mp-tool-btn.active {
          background: rgba(0, 200, 150, 0.1);
          color: #00c896;
          border-color: rgba(0, 200, 150, 0.2);
        }

        .mp-tool-icon {
          font-size: 15px;
        }

        /* ── Audio Recording Btn ── */
        .mp-audio-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.45);
          position: relative;
        }

        .mp-audio-btn:hover {
          background: rgba(0, 200, 150, 0.08);
          color: #7dd4b8;
          border-color: rgba(0, 200, 150, 0.12);
        }

        .mp-audio-btn.recording {
          background: rgba(255, 80, 80, 0.12);
          color: #ff6b6b;
          border-color: rgba(255, 80, 80, 0.25);
          animation: pulse-recording 1.5s infinite;
        }

        @keyframes pulse-recording {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 80, 80, 0.2); }
          50% { box-shadow: 0 0 0 6px rgba(255, 80, 80, 0); }
        }

        .mp-recording-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ff6b6b;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ── Submit Button ── */
        .mp-submit-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          background: linear-gradient(135deg, #00c896 0%, #009e78 100%);
          color: #050a09;
          font-size: 18px;
          box-shadow: 0 4px 20px rgba(0, 200, 150, 0.2);
        }

        .mp-submit-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 30px rgba(0, 200, 150, 0.35);
        }

        .mp-submit-btn:active {
          transform: scale(0.97);
        }

        .mp-submit-btn:disabled {
          opacity: 0.3;
          cursor: default;
          transform: none;
          box-shadow: none;
        }

        /* ── Selectors Bar (Bubble Popups) ── */
        .mp-selectors-bar {
          width: 100%;
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .mp-selector-trigger {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0, 200, 150, 0.1);
          background: rgba(10, 20, 18, 0.7);
          color: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: relative;
          user-select: none;
        }

        .mp-selector-trigger:hover {
          border-color: rgba(0, 200, 150, 0.25);
          color: #a0d4c4;
          background: rgba(0, 200, 150, 0.06);
        }

        .mp-selector-trigger.active {
          border-color: rgba(0, 200, 150, 0.3);
          color: #00c896;
          background: rgba(0, 200, 150, 0.08);
          box-shadow: 0 0 20px rgba(0, 200, 150, 0.08);
        }

        .mp-selector-trigger.has-value {
          border-color: rgba(0, 200, 150, 0.2);
          color: #7dd4b8;
        }

        .mp-selector-value {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 20px;
          background: rgba(0, 200, 150, 0.12);
          color: #4aedc4;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .mp-selector-chevron {
          font-size: 10px;
          transition: transform 0.3s;
          color: rgba(255, 255, 255, 0.25);
        }

        .mp-selector-trigger.active .mp-selector-chevron {
          transform: rotate(180deg);
          color: #00c896;
        }

        /* ── Popup Dropdown ── */
        .mp-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
        }

        .mp-popup {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 200px;
          background: rgba(12, 24, 20, 0.95);
          border: 1px solid rgba(0, 200, 150, 0.12);
          border-radius: 16px;
          padding: 8px;
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(0, 200, 150, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          z-index: 100;
          animation: popupIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popupIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        .mp-popup-title {
          padding: 8px 12px 6px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.25);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .mp-popup-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          color: rgba(255, 255, 255, 0.6);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .mp-popup-option:hover {
          background: rgba(0, 200, 150, 0.08);
          color: #a0d4c4;
        }

        .mp-popup-option.selected {
          background: rgba(0, 200, 150, 0.1);
          color: #00c896;
        }

        .mp-popup-option-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .mp-popup-option.selected .mp-popup-option-dot {
          background: #00c896;
          border-color: #00c896;
          box-shadow: 0 0 8px rgba(0, 200, 150, 0.4);
        }

        /* ── Hidden file inputs ── */
        .mp-hidden-input {
          display: none;
        }

        /* ── Floating particles (decorative) ── */
        .mp-particle {
          position: fixed;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(0, 200, 150, 0.15);
          pointer-events: none;
          z-index: 0;
        }

        .mp-particle:nth-child(1) { top: 15%; left: 10%; animation: float1 8s infinite; }
        .mp-particle:nth-child(2) { top: 25%; right: 15%; animation: float2 12s infinite; width: 3px; height: 3px; }
        .mp-particle:nth-child(3) { bottom: 30%; left: 20%; animation: float3 10s infinite; }
        .mp-particle:nth-child(4) { top: 60%; right: 25%; animation: float1 14s infinite; width: 1.5px; height: 1.5px; }
        .mp-particle:nth-child(5) { bottom: 20%; right: 10%; animation: float2 9s infinite; }

        @keyframes float1 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 0.3; }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
          33% { transform: translateY(-20px) translateX(-15px); opacity: 0.25; }
          66% { transform: translateY(10px) translateX(5px); opacity: 0.15; }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-25px) translateX(-10px); opacity: 0.35; }
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .mp-header {
            padding: 16px 20px;
          }

          .mp-content {
            padding: 20px 16px 40px;
          }

          .mp-title {
            font-size: 26px;
          }

          .mp-textarea-wrap {
            padding: 18px 18px 8px;
          }

          .mp-toolbar {
            padding: 12px 16px 14px;
            flex-wrap: wrap;
            gap: 8px;
          }

          .mp-toolbar-left {
            flex-wrap: wrap;
          }

          .mp-selectors-bar {
            gap: 6px;
          }

          .mp-selector-trigger {
            padding: 7px 14px;
            font-size: 12px;
          }

          .mp-attachments {
            padding: 0 18px;
          }

          .mp-link-section {
            padding: 0 18px;
          }

          .mp-popup {
            min-width: 170px;
          }
        }
      `}</style>

      {/* Floating particles */}
      <div className="mp-particle" />
      <div className="mp-particle" />
      <div className="mp-particle" />
      <div className="mp-particle" />
      <div className="mp-particle" />

      {/* ── Header ── */}
      <header className="mp-header">
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span className="mp-logo">GenAI Social</span>
          <span className="mp-logo-sub">Studio</span>
        </div>
        <div className="mp-header-actions">
          <button className="mp-header-btn">History</button>
          <button className="mp-header-btn">Settings</button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mp-content">
        <h1 className="mp-title">
          Craft your content with a touch of{" "}
          <em>intelligence</em>
        </h1>
        <p className="mp-subtitle">
          Generate AI-powered social content tailored to your audience
        </p>

        {/* ── Prompt Card ── */}
        <div className="mp-prompt-card">
          {/* Textarea */}
          <div className="mp-textarea-wrap">
            <textarea
              className="mp-textarea"
              placeholder="Describe what you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="mp-attachments">
              {attachedFiles.map((file, i) => (
                <span key={i} className="mp-attachment-chip">
                  <span>
                    {file.type === "image"
                      ? "🖼️"
                      : file.type === "pdf"
                      ? "📄"
                      : "🎬"}
                  </span>
                  {file.name}
                  <button
                    className="mp-attachment-remove"
                    onClick={() => removeFile(i)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Link Input */}
          {showLinkInput && (
            <div className="mp-link-section">
              <div className="mp-link-input-wrap">
                <span className="mp-link-icon">🔗</span>
                <input
                  className="mp-link-input"
                  type="url"
                  placeholder="Paste a URL here..."
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  autoFocus
                />
                <button
                  className="mp-link-close"
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkValue("");
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

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

          {/* Toolbar */}
          <div className="mp-toolbar">
            <div className="mp-toolbar-left">
              <button
                className="mp-tool-btn"
                onClick={() => imageInputRef.current?.click()}
              >
                <span className="mp-tool-icon">🖼️</span>
                Image
              </button>
              <button
                className="mp-tool-btn"
                onClick={() => pdfInputRef.current?.click()}
              >
                <span className="mp-tool-icon">📄</span>
                PDF
              </button>
              <button
                className="mp-tool-btn"
                onClick={() => videoInputRef.current?.click()}
              >
                <span className="mp-tool-icon">🎬</span>
                Video
              </button>

              <div
                style={{
                  width: "1px",
                  height: "20px",
                  background: "rgba(255,255,255,0.06)",
                  margin: "0 4px",
                }}
              />

              <button
                className={`mp-tool-btn ${showLinkInput ? "active" : ""}`}
                onClick={() => setShowLinkInput(!showLinkInput)}
              >
                <span className="mp-tool-icon">🔗</span>
                Link
              </button>

              <button
                className={`mp-audio-btn ${isRecording ? "recording" : ""}`}
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <span className="mp-recording-dot" />
                    Recording...
                  </>
                ) : (
                  <>
                    <span className="mp-tool-icon">🎙️</span>
                    Audio
                  </>
                )}
              </button>
            </div>

            <button
              className="mp-submit-btn"
              disabled={isLoading || (attachedFiles.length === 0)}
              title="Generate"
              onClick={handleSubmit}
            >
              {isLoading ? "⏳" : "➜"}
            </button>
          </div>
        </div>

        {/* ── Bubble-Type Selector Bar ── */}
        <div className="mp-selectors-bar">
          {(Object.keys(SELECTOR_DATA) as SelectorKey[]).map((key) => {
            const data = SELECTOR_DATA[key];
            const isOpen = openSelector === key;
            const selectedValue = selections[key];

            return (
              <div key={key} style={{ position: "relative" }}>
                <button
                  className={`mp-selector-trigger ${isOpen ? "active" : ""} ${
                    selectedValue ? "has-value" : ""
                  }`}
                  onClick={() => toggleSelector(key)}
                >
                  <span style={{ fontSize: "14px" }}>{data.icon}</span>
                  {data.label}
                  {selectedValue && (
                    <span className="mp-selector-value">{selectedValue}</span>
                  )}
                  <span className="mp-selector-chevron">▼</span>
                </button>

                {/* Popup Dropdown */}
                {isOpen && (
                  <>
                    <div
                      className="mp-popup-overlay"
                      onClick={() => setOpenSelector(null)}
                    />
                    <div className="mp-popup">
                      <div className="mp-popup-title">{data.label}</div>
                      {data.options.map((option) => (
                        <button
                          key={option}
                          className={`mp-popup-option ${
                            selectedValue === option ? "selected" : ""
                          }`}
                          onClick={() => {
                            selectOption(key, option);
                            setOpenSelector(null);
                          }}
                        >
                          <span className="mp-popup-option-dot" />
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Error Message ── */}
        {error && (
          <div style={{
            marginTop: 20,
            padding: "14px 20px",
            borderRadius: 12,
            background: "rgba(255, 80, 80, 0.1)",
            border: "1px solid rgba(255, 80, 80, 0.2)",
            color: "#ff8a8a",
            fontSize: 13,
            width: "100%",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Loading Indicator ── */}
        {isLoading && (
          <div style={{
            marginTop: 24,
            textAlign: "center",
            color: "rgba(0, 200, 150, 0.7)",
            fontSize: 14,
          }}>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
            {" "}Processing image through pipeline...
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Response Display ── */}
        {response && (
          <div style={{
            marginTop: 24,
            width: "100%",
            background: "rgba(10, 20, 18, 0.85)",
            border: "1px solid rgba(0, 200, 150, 0.12)",
            borderRadius: 16,
            padding: 24,
            backdropFilter: "blur(40px)",
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#00c896",
              marginBottom: 16,
            }}>Pipeline Result</h3>

            {/* Final Output */}
            {response.final_output && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Final Output</h4>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#d4e8e2", whiteSpace: "pre-wrap" }}>
                  {String(response.final_output)}
                </div>
              </div>
            )}

            {/* Image Analysis */}
            {response.image_analysis && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Image Analysis</h4>
                <p style={{ fontSize: 13, color: "#a0d4c4", lineHeight: 1.6 }}>
                  {String((response.image_analysis as Record<string, unknown>).image_description || "")}
                </p>
                {(response.image_analysis as Record<string, unknown>).ocr_text && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                    <strong>OCR:</strong> {String((response.image_analysis as Record<string, unknown>).ocr_text)}
                  </p>
                )}
              </div>
            )}

            {/* Gemini Output */}
            {response.gemini_output && (
              <details style={{ marginBottom: 12 }}>
                <summary style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer", textTransform: "uppercase", letterSpacing: 1.5 }}>Gemini Raw Output</summary>
                <div style={{ fontSize: 13, color: "#7dd4b8", marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {String(response.gemini_output)}
                </div>
              </details>
            )}

            {/* Compressed Data */}
            {response.compressed_data && (
              <details>
                <summary style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer", textTransform: "uppercase", letterSpacing: 1.5 }}>Compressed Data (JSON)</summary>
                <pre style={{ fontSize: 11, color: "#7dd4b8", marginTop: 8, overflow: "auto", maxHeight: 300, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8 }}>
                  {JSON.stringify(response.compressed_data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
