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
    const hasInitialLoaded = typeof window !== "undefined" ? sessionStorage.getItem("hasInitialLoaded") : null;

    if (!hasInitialLoaded) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hasInitialLoaded", "true");
        }
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Manage Page Transitions / Route Changes (1.5 seconds)
  useEffect(() => {
    if (isInitialLoad) return;

    const startTimer = setTimeout(() => {
      setIsLoading(true);
    }, 0);

    const endTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [pathname, searchParams, isInitialLoad]);

  return (
    <>
      <StartLoading isLoading={isLoading} isInitialLoad={isInitialLoad} />
      <Navbar />
      <div className={`transition-opacity duration-500 flex flex-col min-h-screen ${isLoading ? "opacity-0" : "opacity-100"}`}>
        {children}
      </div>
    </>
  );
}
