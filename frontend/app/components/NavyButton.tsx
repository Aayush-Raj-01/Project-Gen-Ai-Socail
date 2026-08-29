"use client";

import React from "react";

export interface NavyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "gradient" | "outline" | "glow" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const NavyButton: React.FC<NavyButtonProps> = ({
  variant = "solid",
  size = "md",
  children,
  icon,
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B2A4A] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none";

  // Size styles
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5 tracking-wide",
    md: "px-5 py-2.5 text-sm gap-2 tracking-wide shadow-sm",
    lg: "px-7 py-3.5 text-base gap-2.5 tracking-wide shadow-md font-semibold",
  };

  // Navy variant styles
  const variantStyles = {
    // Deep classic navy
    solid:
      "bg-[#0A192F] text-white hover:bg-[#112240] active:bg-[#020c1b] shadow-[#0A192F]/25 hover:shadow-lg hover:shadow-[#0A192F]/40 border border-[#1E2D4A]",
    
    // Rich navy gradient with subtle gloss
    gradient:
      "bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A192F] text-white hover:from-[#1E293B] hover:to-[#1E3A5F] shadow-lg shadow-[#0F172A]/30 hover:shadow-[#1E3A5F]/40 border border-slate-700/50",
    
    // Glowing neon navy / cyan edge
    glow:
      "bg-[#0B132B] text-sky-100 hover:bg-[#1C2541] border border-[#3A506B] shadow-[0_0_15px_rgba(28,37,65,0.6)] hover:shadow-[0_0_25px_rgba(58,80,107,0.8)]",

    // Modern Navy outline
    outline:
      "bg-transparent text-[#0A192F] dark:text-[#64B5F6] border-2 border-[#0A192F] dark:border-[#64B5F6] hover:bg-[#0A192F] hover:text-white dark:hover:bg-[#64B5F6] dark:hover:text-[#0A192F]",

    // Subtle Ghost Navy
    ghost:
      "bg-transparent text-[#0A192F] dark:text-slate-200 hover:bg-[#0A192F]/10 dark:hover:bg-slate-800/60",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default NavyButton;
