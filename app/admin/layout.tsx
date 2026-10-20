"use client";

import React, { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { MobileSearchDrawer } from "../components/layout/MobileSearchDrawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen font-bricolage bg-black text-neutral-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="xl:w-64" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          onOpenSidebar={() => setSidebarOpen(true)} 
          onOpenSearch={() => setSearchOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="h-15.75 xl:hidden"></div>
          <div className="max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </div>

      {/* Mobile Slide-in Search Drawer */}
      <MobileSearchDrawer isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}