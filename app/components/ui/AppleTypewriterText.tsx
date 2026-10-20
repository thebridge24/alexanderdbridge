"use client";

import { motion, Variants } from "framer-motion";

interface AppleTypewriterTextProps {
  text: string;
  className?: string;
  maxLength?: number; // Optional limit for mobile safety
}

export function AppleTypewriterText({
  text,
  className = "",
  maxLength,
}: AppleTypewriterTextProps) {
  // Truncate text gracefully if it exceeds maxLength on small screens
  const displayText =
    maxLength && text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;

  const letters = Array.from(displayText);

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.04 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200,
      },
    },
    hidden: {
      opacity: 0,
      y: 12,
      filter: "blur(6px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.h1
      key={text}
      title={text} // Shows full name on hover
      className={`inline-flex overflow-hidden tracking-tight font-bold truncate max-w-full ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          variants={child}
          key={`${letter}-${index}`}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.h1>
  );
}