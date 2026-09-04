"use client";

import React, { useEffect, useState } from "react";

interface StartLoadingProps {
  isLoading?: boolean;
  isInitialLoad?: boolean;
}

const StartLoading: React.FC<StartLoadingProps> = ({ isLoading = true, isInitialLoad = false }) => {
  const [render, setRender] = useState(isLoading);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRender(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExiting(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);

      // Smooth progress interpolation
      const startTime = performance.now();
      const duration = 1200; // ms

      const updateProgress = (now: number) => {
        const elapsed = now - startTime;
        const rawT = Math.min(1, elapsed / duration);
        const easedT = 1 - Math.pow(1 - rawT, 3);
        const currentVal = Math.round(easedT * 100);

        setProgress(currentVal);

        if (rawT < 1) {
          requestAnimationFrame(updateProgress);
        }
      };

      const animId = requestAnimationFrame(updateProgress);
      return () => cancelAnimationFrame(animId);
    } else {
      setProgress(100);
      setIsExiting(true);
      // Slower, cinematic 1000ms center aperture expansion
      const timeout = setTimeout(() => {
        setRender(false);
        setIsExiting(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 h-[100dvh] w-screen z-[99999] flex flex-col items-center justify-center select-none font-sans overflow-hidden touch-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
        isExiting ? "pointer-events-none" : ""
      }`}
    >
      {/* ── GPU-Accelerated Feathered True-Circle Iris Reveal (Universal Mobile + Desktop) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <svg
          className={`w-[220vmax] h-[220vmax] aspect-square pointer-events-none transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExiting ? "opacity-0" : "opacity-100"
          }`}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft feathered edge for the expanding center hole */}
            <radialGradient id="irisFeather" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="black" />
              <stop offset="100%" stopColor="white" />
            </radialGradient>

            <mask id="centerIrisMask">
              {/* Base solid white: covers entire viewport in black */}
              <rect x="0" y="0" width="100" height="100" fill="white" />
              
              {/* Center expanding circle: cuts a true 1:1 circular hole from center outward */}
              <circle
                cx="50"
                cy="50"
                r="3"
                fill="url(#irisFeather)"
                className={`transform-gpu transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isExiting ? "scale-[40]" : "scale-0"
                }`}
                style={{ transformOrigin: "50px 50px" }}
              />
            </mask>
          </defs>

          {/* The screen-filling dark backdrop with dynamic center iris cutout */}
          <rect x="0" y="0" width="100" height="100" fill="#050505" mask="url(#centerIrisMask)" />
        </svg>
      </div>

      {/* ── Center Stage Content (Gently Scales & Dissolves from Center) ── */}
      <div 
        className={`relative z-10 flex flex-col items-center px-4 text-center transform-gpu will-change-[transform,opacity] transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExiting ? "scale-105 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        
        {/* ── Sculpted Monolithic Emblem (Double-Bezel Geometry) ── */}
        <div className="relative mb-6 sm:mb-10 group">
          {/* Outer Polished Shell */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.03] border border-white/10 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center">
            {/* Inner Core Plate */}
            <div className="w-full h-full rounded-[12px] bg-[#0c0c0c] border border-white/15 flex items-center justify-center relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              
              {/* Refined Geometric Vector Glyph */}
              <svg 
                className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-emblem-pulse" 
                viewBox="0 0 28 28" 
                fill="none"
              >
                <path
                  d="M14 4L23 9.5V20.5L14 26L5 20.5V9.5L14 4Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-70"
                />
                <circle cx="14" cy="15" r="3" fill="currentColor" className="opacity-90" />
                <path
                  d="M14 4V12M23 20.5L16.5 16.5M5 20.5L11.5 16.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  className="opacity-40"
                />
              </svg>

              {/* Specular Light Sweep */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-full animate-specular-sweep" />
            </div>
          </div>
        </div>

        {/* ── Brand Wordmark ── */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-2xl font-bold tracking-[0.20em] sm:tracking-[0.32em] text-white uppercase antialiased whitespace-nowrap">
            BOUYANT AI
          </h1>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.18em] sm:tracking-[0.25em] text-neutral-400 uppercase whitespace-nowrap">
            {isInitialLoad ? "SYSTEM INITIALIZATION" : "RECONFIGURING PIPELINE"}
          </span>
        </div>

        {/* ── Hairline Precision Progress Bar & Readout ── */}
        <div className="flex items-center gap-3 sm:gap-4 w-48 sm:w-64 max-w-[80vw]">
          <div className="flex-1 h-[1.5px] bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-white transition-all duration-150 ease-out shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-neutral-400 w-7 sm:w-8 text-right tabular-nums">
            {progress}%
          </span>
        </div>

      </div>

      <style>{`
        @keyframes emblemPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
          }
        }

        @keyframes specularSweep {
          0% {
            transform: translateX(-120%) rotate(25deg);
          }
          100% {
            transform: translateX(160%) rotate(25deg);
          }
        }

        .animate-emblem-pulse {
          animation: emblemPulse 2.8s cubic-bezier(0.32, 0.72, 0, 1) infinite;
        }

        .animate-specular-sweep {
          animation: specularSweep 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default StartLoading;



