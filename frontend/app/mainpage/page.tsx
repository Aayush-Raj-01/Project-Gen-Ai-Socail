"use client";

import { useState, useRef, useCallback } from "react";
import "./mainpage.css";

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
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

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
    // Find the first file to send (prioritize image, then video, audio, pdf)
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

    try {
      let res: Response;

      if (fileToSend) {
        // File pipeline — send to respective endpoint based on file type
        const formData = new FormData();
        formData.append("file", fileToSend.file);

        let endpoint = "http://localhost:8000/analyze-image";
        if (fileToSend.type === "video") endpoint = "http://localhost:8000/analyze-video";
        if (fileToSend.type === "audio") endpoint = "http://localhost:8000/analyze-audio";
        if (fileToSend.type === "pdf") endpoint = "http://localhost:8000/analyze-pdf";

        res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
      } else {
        // Text-only pipeline — send to /process-prompt
        res = await fetch("http://localhost:8000/process-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim() }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);

        // Check if this is a content moderation rejection
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
  }, [attachedFiles, prompt]);

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
              background: "linear-gradient(135deg, #1a0a0a 0%, #2a1010 100%)",
              border: "1px solid rgba(255, 80, 80, 0.3)",
              borderRadius: 20,
              padding: "32px 28px",
              zIndex: 1000,
              boxShadow: "0 24px 80px rgba(255, 40, 40, 0.15), 0 0 40px rgba(255, 0, 0, 0.05)",
              animation: "fadeIn 0.25s ease-out",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 48 }}>🛡️</span>
            </div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#ff6b6b",
              textAlign: "center",
              marginBottom: 12,
            }}>
              Content Blocked
            </h3>
            <p style={{
              fontSize: 14,
              color: "rgba(255, 180, 180, 0.85)",
              textAlign: "center",
              lineHeight: 1.6,
              marginBottom: 24,
            }}>
              Your request was flagged by our content safety system:
            </p>
            <div style={{
              background: "rgba(255, 60, 60, 0.08)",
              border: "1px solid rgba(255, 80, 80, 0.15)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 24,
            }}>
              <p style={{
                fontSize: 13,
                color: "#ff9a9a",
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
                background: "linear-gradient(135deg, #ff4444 0%, #cc2222 100%)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Understood
            </button>
          </div>
        </>
      )}

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
              disabled={isLoading || (attachedFiles.length === 0 && prompt.trim().length === 0)}
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
             {" "}Processing through pipeline...

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
            {!!response.final_output && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Final Output</h4>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#d4e8e2", whiteSpace: "pre-wrap" }}>
                  {String(response.final_output)}
                </div>
              </div>
            )}

            {/* Image Analysis */}
            {!!response.image_analysis && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Image Analysis</h4>
                <p style={{ fontSize: 13, color: "#a0d4c4", lineHeight: 1.6 }}>
                  {String((response.image_analysis as Record<string, unknown>).image_description || "")}
                </p>
                {!!(response.image_analysis as Record<string, unknown>).ocr_text && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                    <strong>OCR:</strong> {String((response.image_analysis as Record<string, unknown>).ocr_text)}
                  </p>
                )}
              </div>
            )}

            {/* Video Analysis */}
            {!!response.video_analysis && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Video Analysis</h4>
                <p style={{ fontSize: 13, color: "#a0d4c4", lineHeight: 1.6 }}>
                  <strong>Language:</strong> {String((response.video_analysis as Record<string, unknown>).language || "unknown")}
                </p>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8, maxHeight: 150, overflow: "auto", background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                  <strong>Transcription:</strong> {String((response.video_analysis as Record<string, unknown>).transcription || "None")}
                </div>
              </div>
            )}

            {/* Audio Analysis */}
            {!!response.audio_analysis && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Audio Analysis</h4>
                <p style={{ fontSize: 13, color: "#a0d4c4", lineHeight: 1.6 }}>
                  <strong>Language:</strong> {String((response.audio_analysis as Record<string, unknown>).language || "unknown")}
                </p>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8, maxHeight: 150, overflow: "auto", background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                  <strong>Transcription:</strong> {String((response.audio_analysis as Record<string, unknown>).transcription || "None")}
                </div>
              </div>
            )}

            {/* PDF Analysis */}
            {!!response.pdf_analysis && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>PDF Analysis</h4>
                <p style={{ fontSize: 13, color: "#a0d4c4", lineHeight: 1.6 }}>
                  <strong>Pages:</strong> {String((response.pdf_analysis as Record<string, unknown>).page_count || 0)} | <strong>Method:</strong> {String((response.pdf_analysis as Record<string, unknown>).method || "unknown")}
                </p>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8, maxHeight: 150, overflow: "auto", background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                  <strong>Extracted Text:</strong> {String((response.pdf_analysis as Record<string, unknown>).extracted_text || "None")}
                </div>
              </div>
            )}


            {/* Gemini Output */}
            {!!response.gemini_output && (
              <details style={{ marginBottom: 12 }}>
                <summary style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer", textTransform: "uppercase", letterSpacing: 1.5 }}>Gemini Raw Output</summary>
                <div style={{ fontSize: 13, color: "#7dd4b8", marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {String(response.gemini_output)}
                </div>
              </details>
            )}

            {/* Compressed Data */}
            {!!response.compressed_data && (
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
