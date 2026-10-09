"use client";

import React, { useState } from "react";
import { SupportModalDrawer } from "../../components/support/SupportModalDrawer";
import { SupportPlanCard, PlanType } from "../../components/support/SupportPlanCard";
import { Smartphone } from "lucide-react";

export default function SupportPreviewPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="px-6 py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-semibold rounded-2xl shadow-xl shadow-red-950/50 transition-all flex items-center gap-2.5"
      >
        <Smartphone className="w-5 h-5" /> Open Support Drawer
      </button>

      {/* Full Modal Drawer */}
      <SupportModalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userName="Alexander Bridge"
        onSelectPlan={(plan: PlanType) => {
          console.log("Selected plan:", plan);
          setIsDrawerOpen(false);
        }}
      />

    </div>
  );
}
