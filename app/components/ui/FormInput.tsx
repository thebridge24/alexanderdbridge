"use client";

import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormInput({ label, className = "", ...props }: FormInputProps) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
        {label}
      </label>
      <input
        {...props}
        className={`w-full bg-transparent text-sm font-semibold text-white pb-2 border-b border-white/15 focus:border-primary outline-none transition-colors ${className}`}
      />
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function FormTextarea({ label, className = "", ...props }: FormTextareaProps) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
        {label}
      </label>
      <textarea
        {...props}
        rows={3}
        className={`w-full bg-black/40 text-sm font-semibold text-white p-3 border border-white/15 rounded-2xl focus:border-primary outline-none transition-colors resize-y min-h-20 ${className}`}
      />
    </div>
  );
}