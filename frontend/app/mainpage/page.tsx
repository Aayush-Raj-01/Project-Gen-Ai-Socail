"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShaderBackground from "../components/shader-background";

/* ────────────────────────────────────────────
   Output Parsing Helper
   ──────────────────────────────────────────── */
function parseOutputChunks(text: string) {
  if (!text) return [];
  if (!text.match(/^#+\s/m)) {
    return [{ title: "Result", content: text }];
  }
  const chunks: { title: string; content: string }[] = [];
  const lines = text.split('\n');
  let currentTitle = "Result";
  let currentContent = "";
  for (const line of lines) {
    if (line.match(/^#+\s/)) {
      if (currentContent.trim()) chunks.push({ title: currentTitle, content: currentContent.trim() });
      currentTitle = line.replace(/^#+\s/, '').trim();
      currentContent = "";
    } else {
      currentContent += line + "\n";
    }
  }
  if (currentContent.trim()) chunks.push({ title: currentTitle, content: currentContent.trim() });
  if (chunks.length > 0 && chunks[0].title === "Result" && !chunks[0].content) {
    chunks.shift();
  }
  return chunks;
}

const DESIRED_OUTPUT_OPTIONS = [
  { label: "Video Package", icon: "movie" },
  { label: "LinkedIn Post", icon: "article" },
  { label: "Twitter/X Post", icon: "forum" },
  { label: "Advisory", icon: "campaign" },
  { label: "Infographic", icon: "insert_chart" },
  { label: "Executive Summary", icon: "summarize" },
  { label: "Presentation", icon: "slideshow" },
];

const IntelligenceDropdown = ({ 
  label, 
  options, 
  selectedValue, 
  onSelect, 
  isOpen, 
  onToggle 
}: { 
  label: string; 
  options: string[]; 
  selectedValue: string; 
  onSelect: (val: string) => void; 
  isOpen: boolean; 
  onToggle: () => void; 
}) => {
  const isDefault = selectedValue === label || (label === 'Tone' && selectedValue === 'Professional');
  
  return (
    <div className="relative">
      <div 
        onClick={onToggle} 
        className={`glass-modal rounded-full h-12 flex items-center justify-between px-4 cursor-pointer hover:bg-white/10 transition-all ${
          isOpen ? 'ring-1 ring-[#10b981] bg-white/5 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : ''
        } ${!isDefault ? 'border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]' : 'text-on-surface border-white/5'}`}
      >
        <span className="font-body-sm font-medium truncate text-sm">{selectedValue}</span>
        <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.95 }} 
            transition={{ duration: 0.2, ease: "easeOut" }} 
            className="absolute top-14 left-0 min-w-full w-max bg-[#0b1727]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] overflow-hidden z-[100] py-2"
          >
            {options.map(opt => (
              <div 
                key={opt} 
                onClick={() => { onSelect(opt); }} 
                className={`px-4 py-2.5 cursor-pointer text-sm flex items-center justify-between transition-all duration-200 ${
                  selectedValue === opt 
                    ? 'bg-[#10b981]/10 text-[#10b981] font-semibold border-l-2 border-[#10b981]' 
                    : 'text-on-surface-variant font-medium hover:bg-white/5 hover:text-on-surface border-l-2 border-transparent'
                }`}
              >
                <span>{opt}</span>
                {selectedValue === opt && <span className="material-symbols-outlined text-[16px]">check</span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MainPage() {
  // ── State ──
  const [prompt, setPrompt] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<
    { name: string; type: string; file: File }[]
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  // Multi-select for Desired Outputs
  const [desiredOutputs, setDesiredOutputs] = useState<string[]>([]);
  
  // Intelligence Bar State
  const [selectors, setSelectors] = useState({
    tone: "Professional",
    audience: "Audience",
    language: "Language",
    detail: "Detail Level",
    objective: "Objective",
    style: "Style",
  });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<number>(0);
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

  const toggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
  }, []);

  const toggleDesiredOutput = useCallback((option: string) => {
    setDesiredOutputs((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
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

    try {
      let res: Response;

      // Construct a unified prompt that includes the intelligence selectors if they've been modified from defaults
      let enhancedPrompt = prompt.trim();
      const extras = [];
      if (selectors.tone !== "Professional") extras.push(`Tone: ${selectors.tone}`);
      if (selectors.audience !== "Audience") extras.push(`Target Audience: ${selectors.audience}`);
      if (selectors.language !== "Language") extras.push(`Language: ${selectors.language}`);
      if (selectors.detail !== "Detail Level") extras.push(`Detail Level: ${selectors.detail}`);
      if (selectors.objective !== "Objective") extras.push(`Objective: ${selectors.objective}`);
      if (selectors.style !== "Style") extras.push(`Writing Style: ${selectors.style}`);
      
      if (extras.length > 0) {
        enhancedPrompt += `\n\nAdditional Instructions:\n- ` + extras.join('\n- ');
      }

      if (fileToSend) {
        const formData = new FormData();
        formData.append("file", fileToSend.file);
        if (enhancedPrompt) formData.append("prompt", enhancedPrompt);
        if (desiredOutputs.length > 0) formData.append("desired_outputs", JSON.stringify(desiredOutputs));

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
          body: JSON.stringify({ 
            prompt: enhancedPrompt,
            desired_outputs: desiredOutputs.length > 0 ? desiredOutputs : undefined
          }),
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
      setActiveTab(0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [attachedFiles, prompt, desiredOutputs]);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md overflow-x-hidden relative">
      
      {/* Hidden file inputs */}
      <input ref={imageInputRef} className="hidden" type="file" accept="image/*" onChange={(e) => handleFileAttach(e, "image")} />
      <input ref={pdfInputRef} className="hidden" type="file" accept=".pdf" onChange={(e) => handleFileAttach(e, "pdf")} />
      <input ref={videoInputRef} className="hidden" type="file" accept="video/*" onChange={(e) => handleFileAttach(e, "video")} />

      {/* Background Shader */}
      <ShaderBackground />

      {/* Main Studio Canvas */}
      <main className="relative z-10 pb-32 px-margin-mobile md:px-margin-desktop max-w-[container-max] mx-auto min-h-screen flex flex-col items-center mt-12 md:mt-24 w-full">

        {/* The Studio Card (Bento/Glassmorphism Layout) */}
        <div className="glass-panel rounded-[24px] w-full max-w-5xl p-6 md:p-12 animate-fade-up delay-100 flex flex-col gap-8 relative overflow-hidden">
          
          {/* Light Leak Effect */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#10b981]/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Input Area */}
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-1">Core Subject / Prompt</label>
            </div>

            {/* Attached Files & Link Display inside the input area conceptually */}
            <AnimatePresence>
              {showLinkInput && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-full md:w-1/2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">link</span>
                    <input 
                      type="url" 
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      placeholder="Paste a URL here..." 
                      className="bg-transparent border-none focus:ring-0 outline-none w-full font-body-sm text-sm text-on-surface"
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {attachedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachedFiles.map((file, i) => (
                  <div key={i} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-body-sm text-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      {file.type === "image" ? "image" : file.type === "pdf" ? "picture_as_pdf" : "videocam"}
                    </span>
                    <span>{file.name}</span>
                    <button onClick={() => removeFile(i)} className="ml-1 text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="glass-modal rounded-xl emerald-glow-focus transition-all duration-300 relative group flex flex-col">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-40 bg-transparent border-none text-on-surface focus:ring-0 resize-none p-4 font-body-lg text-lg outline-none placeholder:text-on-surface-variant/50" 
                placeholder="Describe the content you want to generate, paste a link, or outline your key points..."
              ></textarea>
              
              {/* Attachment Buttons Area inside the textarea box for a clean look */}
              <div className="flex justify-between items-center p-3 border-t border-white/5 bg-black/10 rounded-b-xl">
                <div className="flex gap-2">
                  <button onClick={() => imageInputRef.current?.click()} className="h-10 w-10 glass-panel border-white/5 rounded-xl flex items-center justify-center text-on-surface hover:text-[#10b981] hover:border-[#10b981]/30 hover:bg-[#10b981]/10 transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]" title="Image">
                    <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform duration-300">image</span>
                  </button>
                  <button onClick={() => pdfInputRef.current?.click()} className="h-10 w-10 glass-panel border-white/5 rounded-xl flex items-center justify-center text-on-surface hover:text-[#10b981] hover:border-[#10b981]/30 hover:bg-[#10b981]/10 transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]" title="PDF">
                    <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform duration-300">picture_as_pdf</span>
                  </button>
                  <button onClick={() => videoInputRef.current?.click()} className="h-10 w-10 glass-panel border-white/5 rounded-xl flex items-center justify-center text-on-surface hover:text-[#10b981] hover:border-[#10b981]/30 hover:bg-[#10b981]/10 transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]" title="Video">
                    <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform duration-300">videocam</span>
                  </button>
                  <button onClick={() => setShowLinkInput(!showLinkInput)} className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all group shadow-sm ${showLinkInput ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'glass-panel border-white/5 text-on-surface hover:text-[#10b981] hover:border-[#10b981]/30 hover:bg-[#10b981]/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`} title="Link">
                    <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform duration-300">link</span>
                  </button>
                  <button onClick={toggleRecording} className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all group shadow-sm ${isRecording ? 'bg-error/10 text-error border border-error/30 animate-pulse shadow-[0_0_15px_rgba(255,180,171,0.2)]' : 'glass-panel border-white/5 text-on-surface hover:text-[#10b981] hover:border-[#10b981]/30 hover:bg-[#10b981]/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`} title="Audio">
                    <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform duration-300">mic</span>
                  </button>
                </div>
                <div className="text-on-surface-variant text-xs opacity-50 font-mono pr-2">
                  {prompt.length} / 2000
                </div>
              </div>
            </div>
          </div>

          {/* Intelligence Bar (Selectors - Functional) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <IntelligenceDropdown 
              label="Tone" 
              options={['Professional', 'Casual', 'Academic', 'Humorous', 'Urgent']} 
              selectedValue={selectors.tone} 
              onSelect={(val) => { setSelectors({...selectors, tone: val}); setActiveDropdown(null); }} 
              isOpen={activeDropdown === 'tone'} 
              onToggle={() => setActiveDropdown(activeDropdown === 'tone' ? null : 'tone')} 
            />
            <IntelligenceDropdown 
              label="Audience" 
              options={['General Public', 'Experts', 'Beginners', 'Gen Z', 'Executives']} 
              selectedValue={selectors.audience} 
              onSelect={(val) => { setSelectors({...selectors, audience: val}); setActiveDropdown(null); }} 
              isOpen={activeDropdown === 'audience'} 
              onToggle={() => setActiveDropdown(activeDropdown === 'audience' ? null : 'audience')} 
            />
            <IntelligenceDropdown 
              label="Language" 
              options={['English', 'Spanish', 'French', 'German', 'Hindi']} 
              selectedValue={selectors.language} 
              onSelect={(val) => { setSelectors({...selectors, language: val}); setActiveDropdown(null); }} 
              isOpen={activeDropdown === 'language'} 
              onToggle={() => setActiveDropdown(activeDropdown === 'language' ? null : 'language')} 
            />
            <IntelligenceDropdown 
              label="Detail Level" 
              options={['High Level', 'Detailed', 'Step-by-Step', 'Summary']} 
              selectedValue={selectors.detail} 
              onSelect={(val) => { setSelectors({...selectors, detail: val}); setActiveDropdown(null); }} 
              isOpen={activeDropdown === 'detail'} 
              onToggle={() => setActiveDropdown(activeDropdown === 'detail' ? null : 'detail')} 
            />
            <IntelligenceDropdown 
              label="Objective" 
              options={['Inform', 'Persuade', 'Entertain', 'Educate']} 
              selectedValue={selectors.objective} 
              onSelect={(val) => { setSelectors({...selectors, objective: val}); setActiveDropdown(null); }} 
              isOpen={activeDropdown === 'objective'} 
              onToggle={() => setActiveDropdown(activeDropdown === 'objective' ? null : 'objective')} 
            />
            <IntelligenceDropdown 
              label="Style" 
              options={['Formal', 'Storytelling', 'Direct', 'Creative']} 
              selectedValue={selectors.style} 
              onSelect={(val) => { setSelectors({...selectors, style: val}); setActiveDropdown(null); }} 
              isOpen={activeDropdown === 'style'} 
              onToggle={() => setActiveDropdown(activeDropdown === 'style' ? null : 'style')} 
            />
          </div>

          {/* Output Formats Grid */}
          <div className="mt-2">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase mb-4 block font-semibold tracking-widest">Desired Outputs</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {DESIRED_OUTPUT_OPTIONS.map((opt) => {
                const isSelected = desiredOutputs.includes(opt.label);
                return (
                  <div 
                    key={opt.label}
                    onClick={() => toggleDesiredOutput(opt.label)}
                    className={`${isSelected ? 'glass-modal border-[#10b981] bg-[#10b981]/10' : 'glass-panel hover:bg-white/5 border-white/5'} p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-1 relative group`}
                  >
                    <span className={`material-symbols-outlined text-3xl ${isSelected ? 'text-[#10b981]' : 'text-on-surface-variant'}`} data-icon={opt.icon} style={isSelected ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"} : {}}>
                      {opt.icon}
                    </span>
                    <span className="font-body-sm text-sm text-on-surface font-medium text-center">{opt.label}</span>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#10b981] emerald-glow"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Action */}
          <div className="mt-4 flex justify-end items-center gap-6">
            {isLoading && (
              <div className="text-on-surface-variant font-body-sm hidden md:flex items-center gap-2 text-sm animate-pulse">
                <span className="material-symbols-outlined text-sm">info</span>
                Generating...
              </div>
            )}
            <button 
              disabled={isLoading || (attachedFiles.length === 0 && prompt.trim().length === 0)}
              onClick={handleSubmit} 
              className="bg-[#10b981] text-black font-title-md font-medium text-lg h-12 px-8 rounded-full flex items-center justify-center gap-2 hover:bg-[#34d399] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-95 group"
            >
              <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>
              Generate Assets
            </button>
          </div>
        </div>

        {/* ── Status Messages ── */}
        {error && (
          <div className="mt-8 text-error font-body-sm bg-error/10 border border-error/20 p-4 rounded-xl w-full max-w-5xl text-center shadow-lg">
            {error}
          </div>
        )}
        {moderationWarning && (
          <div className="mt-8 text-[#f59e0b] font-body-sm bg-[#f59e0b]/10 border border-[#f59e0b]/20 p-4 rounded-xl w-full max-w-5xl text-center shadow-lg">
            {moderationWarning}
          </div>
        )}

        {/* ── Outputs Display ── */}
        {response && (
          <div className="mt-12 w-full max-w-5xl glass-panel rounded-[24px] p-8 shadow-2xl animate-fade-up">
            {response.output_chunks ? (
              <div className="output-tabs-container w-full">
                {/* Tabs Header */}
                <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-white/10 no-scrollbar">
                  {(response.output_chunks as { title: string }[]).map((chunk, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                        activeTab === idx 
                          ? "bg-[#10b981]/10 text-[#10b981] border-b-2 border-[#10b981]" 
                          : "text-on-surface-variant hover:text-[#10b981] hover:bg-white/5"
                      }`}
                    >
                      {chunk.title}
                    </button>
                  ))}
                </div>
                
                {/* Tab Content */}
                <div className="min-h-[200px] relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-body-md text-on-surface leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none"
                    >
                      {(response.output_chunks as { content: string }[])[activeTab]?.content}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              // Fallback if no chunks
              <div>
                <h3 className="font-headline-lg text-[#10b981] mb-4 text-2xl font-bold">Generated Content</h3>
                <pre className="whitespace-pre-wrap font-mono text-sm text-on-surface-variant bg-black/40 p-4 rounded-lg overflow-x-auto border border-white/10">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
