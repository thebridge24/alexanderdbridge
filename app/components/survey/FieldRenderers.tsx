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

export const FieldRenderer: React.FC<FieldProps> = ({
  question,
  value,
  onChange,
  onSubmitStep,
}) => {
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
          className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 outline-none transition-all duration-200 text-sm"
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
          rows={3}
          autoFocus
          className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl p-3.5 text-white placeholder-neutral-500 outline-none transition-all duration-200 resize-none text-sm"
        />
      );

    case "rating": {
      const max = question.max || 5;
      const currentRating = Number(value) || 0;
      return (
        <div className="flex items-center gap-2.5 py-1">
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
                className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                  isSelected
                    ? "bg-red-600/10 border-red-600 text-red-500 scale-105"
                    : "bg-neutral-900/80 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                }`}
              >
                <Star className={`w-6 h-6 ${isSelected ? "fill-red-500" : ""}`} />
              </button>
            );
          })}
        </div>
      );
    }

    case "single-choice":
    case "yes-no": {
      // Handle string format or object structure for "Other"
      const isOtherSelected =
        typeof value === "object" && value?.selected === "other"
          ? true
          : value === "other";
      const otherTextValue =
        typeof value === "object" && value?.selected === "other"
          ? value.text || ""
          : "";

      return (
        <div className="flex flex-col gap-2">
          {question.options?.map((opt: Option) => {
            const isSelected =
              typeof value === "object"
                ? value?.selected === opt.value
                : value === opt.value;

            return (
              <div key={opt.value} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (opt.value === "other") {
                      onChange({ selected: "other", text: otherTextValue });
                    } else {
                      onChange(opt.value);
                      if (onSubmitStep) setTimeout(onSubmitStep, 250);
                    }
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                    isSelected
                      ? "bg-red-600/10 border-red-600 text-white font-medium"
                      : "bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                  }`}
                >
                  <span className="text-xs md:text-sm">{opt.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? "border-red-500 bg-red-600" : "border-neutral-600"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>

                {/* Show custom input when "Other" option is active */}
                {opt.value === "other" && isSelected && (
                  <input
                    type="text"
                    autoFocus
                    value={otherTextValue}
                    onChange={(e) =>
                      onChange({ selected: "other", text: e.target.value })
                    }
                    placeholder="Please specify..."
                    className="ml-2 w-[calc(100%-0.5rem)] bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && onSubmitStep) {
                        e.preventDefault();
                        onSubmitStep();
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case "multiple-choice": {
      const selectedList: any[] = Array.isArray(value) ? value : [];

      const isOptSelected = (optVal: string) => {
        return selectedList.some((item) =>
          typeof item === "object" ? item.selected === optVal : item === optVal
        );
      };

      const getOtherText = () => {
        const otherObj = selectedList.find(
          (item) => typeof item === "object" && item.selected === "other"
        );
        return otherObj ? otherObj.text || "" : "";
      };

      const toggleOption = (optVal: string) => {
        if (isOptSelected(optVal)) {
          onChange(
            selectedList.filter((item) =>
              typeof item === "object" ? item.selected !== optVal : item !== optVal
            )
          );
        } else {
          if (optVal === "other") {
            onChange([...selectedList, { selected: "other", text: "" }]);
          } else {
            onChange([...selectedList, optVal]);
          }
        }
      };

      return (
        <div className="flex flex-col gap-2">
          {question.options?.map((opt: Option) => {
            const selected = isOptSelected(opt.value);
            return (
              <div key={opt.value} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                    selected
                      ? "bg-red-600/10 border-red-600 text-white font-medium"
                      : "bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                  }`}
                >
                  <span className="text-xs md:text-sm">{opt.label}</span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected ? "border-red-500 bg-red-600" : "border-neutral-600"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>

                {/* Show custom input when "Other" option is active */}
                {opt.value === "other" && selected && (
                  <input
                    type="text"
                    autoFocus
                    value={getOtherText()}
                    onChange={(e) => {
                      const newText = e.target.value;
                      const updated = selectedList.map((item) =>
                        typeof item === "object" && item.selected === "other"
                          ? { selected: "other", text: newText }
                          : item
                      );
                      onChange(updated);
                    }}
                    placeholder="Please specify..."
                    className="ml-2 w-[calc(100%-0.5rem)] bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-all duration-200"
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
};
