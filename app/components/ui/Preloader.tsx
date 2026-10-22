import React from "react";
import { FiLoader } from "react-icons/fi";

interface PreloaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | string;
  className?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export default function Preloader({ size = "md", className = "" }: PreloaderProps) {
  const sizeClass = SIZE_MAP[size] || size; // Supports preset keys or custom utility classes (e.g. "w-5 h-5")

  return (
    <div className="inline-flex items-center justify-center">
      <FiLoader className={`${sizeClass} text-white animate-spin ${className}`} />
    </div>
  );
}