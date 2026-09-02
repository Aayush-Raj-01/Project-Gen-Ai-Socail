"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Download, Share2, Sparkles, RefreshCw } from "lucide-react";
import Navbar from "../components/navbar";

// Mock data representing the generated outputs
const MOCK_OUTPUTS = [
  {
    id: "linkedin",
    name: "LinkedIn Post",
    content: "🚀 Excited to share my latest thoughts on AI transformation in the enterprise! \n\nThe landscape is shifting faster than ever, and those who adapt will thrive. Here are my top 3 takeaways from this week's deep dive into generative workflows:\n\n1️⃣ Automation is no longer optional.\n2️⃣ Quality data > Big data.\n3️⃣ Human-in-the-loop remains critical for edge cases.\n\nWhat are you seeing in your industry? Let's discuss below! 👇\n\n#ArtificialIntelligence #FutureOfWork #Innovation #TechTrends",
  },
  {
    id: "twitter",
    name: "Twitter Thread",
    content: "1/5 🧵 AI transformation is moving at breakneck speed. Here's what you need to know to stay ahead of the curve this quarter. 👇\n\n2/5 First, automation is no longer just a 'nice to have'. If you aren't automating repetitive data tasks, your competitors definitely are. Time is your most valuable asset.\n\n3/5 Second, we need to stop obsessing over BIG data and start focusing on QUALITY data. Garbage in, garbage out has never been more true than with LLMs.\n\n4/5 Third, humans aren't going anywhere. 'Human-in-the-loop' is the only reliable way to handle hallucinations and edge cases. AI is a copilot, not a replacement.\n\n5/5 The takeaway? Start small, prioritize clean data, and empower your team. What's your biggest AI challenge right now? Reply below! 🚀",
  },
  {
    id: "blog",
    name: "Blog Article",
    content: "## The Enterprise Guide to AI Transformation\n\nAs we enter the next quarter, the conversation around Artificial Intelligence has shifted from 'what if' to 'how fast'. The initial hype cycle has settled, leaving us with the undeniable reality that generative workflows are fundamentally rewiring how modern businesses operate.\n\n### The Automation Imperative\nWe are seeing a massive divergence in the market. Companies that treat AI as a core investment are pulling away from those treating it as a novel IT experiment. Automation of rote, repetitive tasks is now the baseline expectation for operational efficiency.\n\n### The Quality Data Mandate\nHowever, the bottleneck is rarely compute power—it is data quality. Organizations are realizing that feeding vast amounts of unstructured, dirty data into an LLM yields unpredictable results. The new gold rush is internal data curation and governance.\n\n### The Human Element\nFinally, the most successful implementations all share a common architecture: Human-in-the-loop. The technology is not yet capable of autonomous, high-stakes decision making without oversight. Empowering employees to act as 'editors' rather than 'writers' is the key to unlocking immense productivity gains without sacrificing quality or brand safety.\n\nThe future is here, but it requires deliberate execution. Are you ready?",
  },
  {
    id: "summary",
    name: "Executive Summary",
    content: "Executive Summary: AI Transformation\n\n- Primary Objective: Accelerate adoption of generative workflows to maintain competitive advantage.\n- Key Finding 1: Automation of repetitive tasks is now a baseline requirement, not a differentiator.\n- Key Finding 2: Data quality and governance must take precedence over sheer data volume to prevent LLM hallucinations.\n- Strategic Recommendation: Implement 'Human-in-the-loop' architectures to ensure quality control while scaling productivity.\n- Conclusion: Deliberate, secure execution is required to transition from AI experimentation to enterprise-wide infrastructure.",
  }
];

export default function OutputPage() {
  const [activeTabId, setActiveTabId] = useState(MOCK_OUTPUTS[0].id);
  const [copied, setCopied] = useState(false);

  const activeOutput = MOCK_OUTPUTS.find((o) => o.id === activeTabId);

  const handleCopy = () => {
    if (activeOutput) {
      navigator.clipboard.writeText(activeOutput.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row pt-28 px-4 md:px-12 pb-12 gap-10 max-w-[1600px] mx-auto w-full">
        
        {/* LEFT SIDEBAR - "SIDE BUBBLES" */}
        <aside className="w-full md:w-72 flex-shrink-0 flex flex-col gap-10">
          <div className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black border-b-2 border-black pb-4">
              Generated Formats
            </h2>
            
            <div className="flex flex-col gap-4">
              {MOCK_OUTPUTS.map((output) => {
                const isActive = activeTabId === output.id;
                return (
                  <button
                    key={output.id}
                    onClick={() => setActiveTabId(output.id)}
                    className={`
                      relative px-6 py-5 rounded-full text-left font-black text-[13px] tracking-widest uppercase transition-all duration-300
                      flex items-center justify-between group overflow-hidden
                      ${isActive 
                        ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] translate-x-2" 
                        : "bg-white text-black border-2 border-black hover:bg-gray-100 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      }
                    `}
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {isActive && (
                        <motion.span
                          layoutId="active-indicator"
                          className="w-2 h-2 rounded-full bg-white block"
                        />
                      )}
                      {output.name}
                    </span>
                    
                    {/* Small arrow icon */}
                    <svg 
                      className={`w-5 h-5 transition-transform duration-300 ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} 
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Actions */}
          <div className="mt-auto space-y-4 pt-8 border-t-2 border-black">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black mb-6">
              Quick Actions
            </h2>
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-black text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all rounded-sm">
              <RefreshCw size={16} strokeWidth={3} />
              Regenerate All
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-800 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors rounded-sm border-2 border-transparent">
              <Download size={16} strokeWidth={3} />
              Export ZIP
            </button>
          </div>
        </aside>

        {/* RIGHT PANE - CONTENT DISPLAY */}
        <section className="flex-1 flex flex-col min-h-[600px] border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative transition-all">
          
          {/* Header Bar */}
          <div className="h-20 border-b-4 border-black flex items-center justify-between px-8 bg-white">
            <div className="flex items-center gap-4">
              <Sparkles size={24} strokeWidth={2.5} className="text-black" />
              <h1 className="font-black text-sm uppercase tracking-[0.2em]">
                {activeOutput?.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="w-12 h-12 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors rounded-none group">
                <Share2 size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-3 px-6 h-12 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors rounded-none font-black text-[11px] uppercase tracking-[0.2em]"
              >
                {copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-10 md:p-14 overflow-y-auto bg-[#fafafa] relative">
            {/* Minimalist linear grid background pattern */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{
                backgroundImage: `linear-gradient(to right, #000 2px, transparent 2px), linear-gradient(to bottom, #000 2px, transparent 2px)`,
                backgroundSize: '48px 48px'
              }}
            />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTabId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-10"
              >
                <div className="prose prose-xl prose-black max-w-4xl whitespace-pre-wrap font-medium leading-loose text-gray-900 tracking-tight">
                  {activeOutput?.content}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
        </section>
      </main>
    </div>
  );
}
