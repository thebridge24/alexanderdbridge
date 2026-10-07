"use client";

import React from "react";
import { Question, Option } from "@/types/survey";
import { Star, Check } from "lucide-react";

interface FieldProps {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  onSubmitStep?: () => void;
}

export const FieldRenderer: React.FC<FieldProps> = ({ question, value, onChange, onSubmitStep }) => {
  switch (question.type) {
    case "text":
    case "email":
    case "number":
      return (
        <input
          type={question.type === "text" ? "text" : question.type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Type your answer here..."}
          autoFocus
          className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none transition-all duration-200 text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSubmitStep) {
              e.preventDefault();
              onSubmitStep();
            }
          }}
        />
      );

    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Type your answer here..."}
          rows={4}
          autoFocus
          className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl p-4 text-white placeholder-neutral-500 outline-none transition-all duration-200 resize-none text-base"
        />
      );

    case "rating": {
      const max = question.max || 5;
      const currentRating = Number(value) || 0;
      return (
        <div className="flex items-center gap-3 py-2">
          {Array.from({ length: max }, (_, i) => i + 1).map((starVal) => {
            const isSelected = starVal <= currentRating;
            return (
              <button
                key={starVal}
                type="button"
                onClick={() => {
                  onChange(starVal);
                  if (onSubmitStep) setTimeout(onSubmitStep, 250);
                }}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                  isSelected
                    ? "bg-red-600/10 border-red-600 text-red-500 scale-105"
                    : "bg-neutral-900/80 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                }`}
              >
                <Star className={`w-7 h-7 ${isSelected ? "fill-red-500" : ""}`} />
              </button>
            );
          })}
        </div>
      );
    }

    case "single-choice":
    case "yes-no":
      return (
        <div className="flex flex-col gap-2.5">
          {question.options?.map((opt: Option) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  if (onSubmitStep) setTimeout(onSubmitStep, 250);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  isSelected
                    ? "bg-red-600/10 border-red-600 text-white font-medium"
                    : "bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                }`}
              >
                <span className="text-sm md:text-base">{opt.label}</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? "border-red-500 bg-red-600" : "border-neutral-600"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      );

    case "multiple-choice": {
      const selectedValues: string[] = Array.isArray(value) ? value : [];
      const toggleOption = (optValue: string) => {
        if (selectedValues.includes(optValue)) {
          onChange(selectedValues.filter((v) => v !== optValue));
        } else {
          onChange([...selectedValues, optValue]);
        }
      };

      return (
        <div className="flex flex-col gap-2.5">
          {question.options?.map((opt: Option) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  isSelected
                    ? "bg-red-600/10 border-red-600 text-white font-medium"
                    : "bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                }`}
              >
                <span className="text-sm md:text-base">{opt.label}</span>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected ? "border-red-500 bg-red-600" : "border-neutral-600"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
};
