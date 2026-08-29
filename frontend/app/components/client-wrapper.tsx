"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import StartLoading from "./startloading";
import Navbar from "./navbar";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Manage Initial App Load (6 seconds)
  useEffect(() => {
    // Check if we've already done the initial 6-second load in this session
    const hasInitialLoaded = sessionStorage.getItem("hasInitialLoaded");
    
    if (!hasInitialLoaded) {
      // First ever load in this session
      setIsLoading(true);
      setIsInitialLoad(true);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem("hasInitialLoaded", "true");
      }, 6500); // ~6-7 seconds as requested
      
      return () => clearTimeout(timer);
    } else {
      // Already did the initial big load
      setIsInitialLoad(false);
      setIsLoading(false);
    }
  }, []);

  // Manage Page Transitions / Route Changes (1.5 seconds)
  useEffect(() => {
    // Skip if we are currently doing the initial load
    if (isInitialLoad) return;
    
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Fast load for transitions
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams]); // Trigger when route changes

  return (
    <>
      <StartLoading isLoading={isLoading} isInitialLoad={isInitialLoad} />
      <Navbar />
      {/* 
        Hide the main content slightly while loading to prevent flashes, 
        or just let it render behind the fixed loading screen 
      */}
      <div className={`transition-opacity duration-500 flex flex-col min-h-screen ${isLoading ? "opacity-0" : "opacity-100"}`}>
        {children}
      </div>
    </>
  );
}
