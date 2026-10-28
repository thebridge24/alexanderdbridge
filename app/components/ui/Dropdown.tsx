"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  contentClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  className = "",
  contentClassName = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dynamic positioning states
  const [verticalPosition, setVerticalPosition] = useState<"bottom" | "top">("bottom");
  const [horizontalPosition, setHorizontalPosition] = useState<"left" | "right">(align);

  // Measure bounds before rendering to prevent screen cutoff
  useLayoutEffect(() => {
    if (!isOpen || !dropdownRef.current || !menuRef.current) return;

    const triggerRect = dropdownRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check vertical overflow (if bottom space is less than menu height, open upwards)
    const spaceBelow = viewportHeight - triggerRect.bottom;
    if (spaceBelow < menuRect.height + 12 && triggerRect.top > menuRect.height) {
      setVerticalPosition("top");
    } else {
      setVerticalPosition("bottom");
    }

    // Check horizontal overflow (flip if cutoff on edges)
    if (align === "right") {
      const spaceLeft = triggerRect.right;
      if (spaceLeft < menuRect.width && viewportWidth - triggerRect.left > menuRect.width) {
        setHorizontalPosition("left");
      } else {
        setHorizontalPosition("right");
      }
    } else {
      const spaceRight = viewportWidth - triggerRect.left;
      if (spaceRight < menuRect.width && triggerRect.right > menuRect.width) {
        setHorizontalPosition("right");
      } else {
        setHorizontalPosition("left");
      }
    }
  }, [isOpen, align]);

  // Handle click outside & escape key listeners
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Action Trigger Button */}
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer inline-flex">
        {trigger}
      </div>

      {/* Dynamic Smart Menu Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: verticalPosition === "bottom" ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: verticalPosition === "bottom" ? 4 : -4 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={`absolute z-50 min-w-50 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden ${
              verticalPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } ${horizontalPosition === "right" ? "right-0" : "left-0"} ${contentClassName}`}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}