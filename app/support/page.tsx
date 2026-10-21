"use client";

import { useEffect, useState } from "react";
import { SupportModalDrawer } from "../components/support/SupportModalDrawer";
import { PlanType } from "../components/support/SupportPlanCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SupportPreviewPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Retrieve logged-in Supabase user if available
  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setCurrentUser(data.user);
          }
        });
      }
    } catch (err) {
      console.warn(
        "Could not retrieve user session in SupportModalDrawer:",
        err,
      );
    }
  }, []);

  const effectiveUserName =
    currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name;
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      {/* Full Modal Drawer */}
      <SupportModalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userName={effectiveUserName}
        onSelectPlan={(plan: PlanType) => {
          console.log("Selected plan:", plan);
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}
