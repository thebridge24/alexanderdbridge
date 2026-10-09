"use client";

import React, { useState } from "react";
import { SupportModalDrawer } from "@/components/support/SupportModalDrawer";
import { SupportIntroScreen } from "@/components/support/SupportIntroScreen";
import { SupportPlanCard, PlanType } from "@/components/support/SupportPlanCard";
import { Heart, Sparkles, Smartphone, Eye } from "lucide-react";

export default function SupportPreviewPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"intro" | "reader" | "supporter" | "sponsor">("intro");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-red-500">
              Admin Component Sandbox
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              Support The Word — Preview
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Test and review the mobile onboarding drawer and individual support package cards.
            </p>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-950/40 transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <Smartphone className="w-4 h-4" /> Open Full Modal Drawer
          </button>
        </div>

        {/* Selected Plan Notification Status */}
        {selectedPlan && (
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center justify-between">
            <span>
              Last action triggered: Selected plan <strong>{selectedPlan.toUpperCase()}</strong>
            </span>
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-[10px] uppercase font-mono underline hover:text-white"
            >
              Clear
            </button>
          </div>
        )}

        {/* Preview Screen Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-900">
          <span className="text-xs font-mono text-neutral-500 mr-2 shrink-0">
            Card Views:
          </span>
          <button
            onClick={() => setActiveTab("intro")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === "intro"
                ? "bg-red-600 text-white"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            Screen 1: Support Intro
          </button>
          <button
            onClick={() => setActiveTab("reader")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === "reader"
                ? "bg-red-600 text-white"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            Screen 2: Reader (₦500)
          </button>
          <button
            onClick={() => setActiveTab("supporter")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === "supporter"
                ? "bg-blue-600 text-white"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            Screen 3: Supporter (₦1,000)
          </button>
          <button
            onClick={() => setActiveTab("sponsor")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === "sponsor"
                ? "bg-purple-600 text-white"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            Screen 4: Sponsor (₦1,500)
          </button>
        </div>

        {/* Mobile Viewport Container Mockup */}
        <div className="flex justify-center py-4">
          <div className="w-full max-w-sm h-[800px] border-4 border-neutral-800 rounded-[40px] overflow-hidden shadow-2xl shadow-red-950/20 relative bg-black">
            {/* Mock Screen Rendering */}
            {activeTab === "intro" && (
              <SupportIntroScreen
                onNext={() => setActiveTab("reader")}
                currentStep={0}
                totalSteps={4}
              />
            )}

            {activeTab === "reader" && (
              <SupportPlanCard
                planType="reader"
                userName="Alexander"
                onSelectPlan={(p) => setSelectedPlan(p)}
                currentStep={1}
                totalSteps={4}
              />
            )}

            {activeTab === "supporter" && (
              <SupportPlanCard
                planType="supporter"
                userName="Alexander"
                onSelectPlan={(p) => setSelectedPlan(p)}
                currentStep={2}
                totalSteps={4}
              />
            )}

            {activeTab === "sponsor" && (
              <SupportPlanCard
                planType="sponsor"
                userName="Alexander"
                onSelectPlan={(p) => setSelectedPlan(p)}
                currentStep={3}
                totalSteps={4}
              />
            )}
          </div>
        </div>

        {/* Full Interactive Drawer Component */}
        <SupportModalDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          userName="Alexander Bridge"
          onSelectPlan={(plan: PlanType) => setSelectedPlan(plan)}
        />

      </div>
    </div>
  );
}
