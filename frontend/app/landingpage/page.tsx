"use client";

import { useEffect, useRef, useState } from "react";

export default function FrameByFrameLandingPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

    let animationFrameId: number;
    let targetTime = 0;
    let currentTime = 0;

    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0 && video.duration) {
        const scrollFraction = Math.max(0, Math.min(1, window.scrollY / scrollHeight));
        targetTime = scrollFraction * video.duration;
      }
    };

    const updateFrame = () => {
      if (video && video.duration) {
        const diff = targetTime - currentTime;
        // Smooth frame interpolation
        if (Math.abs(diff) > 0.003) {
          currentTime += diff * 0.22;
          video.currentTime = Math.max(0, Math.min(currentTime, video.duration - 0.01));
        }
      }
      animationFrameId = requestAnimationFrame(updateFrame);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    animationFrameId = requestAnimationFrame(updateFrame);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("canplaythrough", handleLoaded);
    };
  }, []);

  return (
    <div className="relative bg-black min-h-[600vh] w-full selection:bg-none">
      {/* ── Fixed Fullscreen Video Layer (Frame-by-Frame Scroll-Controlled) ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-black z-0 pointer-events-none">
        <video
          ref={videoRef}
          src="/landing-video.mp4"
          muted
          playsInline
          preload="auto"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
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
