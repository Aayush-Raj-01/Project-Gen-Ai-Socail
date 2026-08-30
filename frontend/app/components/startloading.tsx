"use client";

import { useEffect, useState } from "react";

interface StartLoadingProps {
  isLoading: boolean;
  isInitialLoad: boolean;
}

export default function StartLoading({ isLoading, isInitialLoad }: StartLoadingProps) {
  const [render, setRender] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setRender(true);
    } else {
      // Add a small delay before unmounting to allow fade-out animation
      const timeout = setTimeout(() => setRender(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ease-in-out ${
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="absolute inset-0 m-auto h-24 w-24 rounded-full border border-white/10 border-t-white/80 animate-spin" style={{ animationDuration: '2s' }}></div>
        <div className="absolute inset-0 m-auto h-16 w-16 rounded-full border border-white/10 border-b-white/50 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        
        {/* Center Dot */}
        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
        
        {/* Brand Text */}
        <div className="mt-16 text-center">
          <h1 className="text-white tracking-[0.3em] uppercase text-sm font-light opacity-80 animate-pulse">
            {isInitialLoad ? "Initializing" : "Loading"}
          </h1>
          {isInitialLoad && (
            <p className="text-white/40 text-xs mt-3 font-light tracking-wider">
              Preparing environment...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
