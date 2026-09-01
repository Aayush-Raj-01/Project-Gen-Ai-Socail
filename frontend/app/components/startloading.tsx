"use client";

import React, { useEffect, useState } from "react";

interface StartLoadingProps {
  isLoading?: boolean;
  isInitialLoad?: boolean;
}

const StartLoading: React.FC<StartLoadingProps> = ({ isLoading = true, isInitialLoad = false }) => {
  const [render, setRender] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setRender(true);
    } else {
      const timeout = setTimeout(() => setRender(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-in-out ${
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="loader">
        <div className="infinity" />

        <div className="loading">
          <span>{isInitialLoad ? "Initializing" : "Loading"}</span>

          <div className="dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .loader {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #000;
          overflow: hidden;
        }

        .infinity {
          width: 190px;
          height: 90px;
          position: relative;
          margin-bottom: 45px;
        }

        .infinity::before {
          content: "";
          position: absolute;
          inset: 15px;
          border: 5px solid transparent;
          border-top-color: #5eead4;
          border-bottom-color: #14b8a6;
          border-radius: 50%;
          transform: rotate(30deg);
          animation: infinity 1.5s linear infinite;
          filter: drop-shadow(0 0 8px #2dd4bf);
        }

        .infinity::after {
          content: "";
          position: absolute;
          inset: 15px;
          border: 5px solid transparent;
          border-left-color: #2dd4bf;
          border-right-color: #0d9488;
          border-radius: 50%;
          transform: rotate(-30deg);
          animation: infinity 1.5s linear infinite reverse;
          filter: drop-shadow(0 0 8px #14b8a6);
        }

        .loading {
          position: absolute;
          top: calc(50% + 70px);
          display: flex;
          align-items: center;
          color: #5eead4;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 5px;
          text-transform: uppercase;
          text-shadow: 0 0 8px #14b8a6;
          opacity: 0.8;
        }

        .dots {
          display: flex;
          gap: 5px;
          margin-left: 5px;
        }

        .dots span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #5eead4;
          box-shadow:
            0 0 7px #2dd4bf,
            0 0 12px #14b8a6;
          animation: blink 1.8s ease-in-out infinite;
        }

        .dots span:nth-child(1) {
          animation-delay: 0s;
        }

        .dots span:nth-child(2) {
          animation-delay: 0.3s;
        }

        .dots span:nth-child(3) {
          animation-delay: 0.6s;
        }

        @keyframes infinity {
          to {
            transform: rotate(390deg);
          }
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 0.15;
            transform: scale(0.7);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 600px) {
          .infinity {
            transform: scale(0.8);
            margin-bottom: 35px;
          }

          .loading {
            top: calc(50% + 60px);
            font-size: 10px;
            letter-spacing: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default StartLoading;
