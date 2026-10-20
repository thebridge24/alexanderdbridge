"use client";

import React, { useState, useEffect } from "react";
import { WelcomeHeader } from "../components/WelcomeHeader";
import { OverviewStatCards } from "../components/OverviewStatCards";
import { RecentDevotionalsTable } from "../components/RecentDevotionalsTable";
import AnalyticsSection, { DevotionalAnalyticsItem } from "../../components/AnalyticsSection";
import UserAnalyticsSection from "../../components/UserAnalyticsSection";

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    devotionals: 0,
    users: 0,
    activeStreaks: 0,
    feedbackCount: 0,
  });

  const [recentDevotionals, setRecentDevotionals] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<DevotionalAnalyticsItem[]>([]);
  const [analyticsTotals, setAnalyticsTotals] = useState({ views: 0, likes: 0, comments: 0 });

  useEffect(() => {
    async function loadOverviewData() {
      try {
        setLoading(true);
        const [devosRes, usersRes, surveysRes, analyticsRes] = await Promise.all([
          fetch("/api/devotionals").catch(() => null),
          fetch("/api/admin/users").catch(() => null),
          fetch("/api/admin/surveys").catch(() => null),
          fetch("/api/admin/analytics").catch(() => null),
        ]);

        const devosData = devosRes && devosRes.ok ? await devosRes.json() : { devotionals: [] };
        const usersData = usersRes && usersRes.ok ? await usersRes.json() : { users: [] };
        const surveysData = surveysRes && surveysRes.ok ? await surveysRes.json() : { submissions: [] };
        const analyticsData = analyticsRes && analyticsRes.ok ? await analyticsRes.json() : {};

        const devosList = devosData.devotionals || [];
        const usersList = usersData.users || [];
        const surveysList = surveysData.submissions || [];

        // Compute Active Streaks (>0 days)
        const activeStreaksCount = usersList.filter((u: any) => (u.currentStreak || 0) > 0).length;

        setTotals({
          devotionals: devosList.length,
          users: usersList.length,
          activeStreaks: activeStreaksCount,
          feedbackCount: surveysList.length,
        });

        setRecentDevotionals(devosList.slice(-5).reverse());
        setAnalyticsData(analyticsData.analytics || []);
        setAnalyticsTotals({
          views: analyticsData.totalViews || 0,
          likes: analyticsData.totalLikes || 0,
          comments: analyticsData.totalComments || 0,
        });
      } catch (err) {
        console.error("Failed to load overview analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOverviewData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome Greeting Header */}
      <WelcomeHeader />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* 2. Top Overview Stat Cards */}
      <OverviewStatCards totals={totals} loading={loading} />

      {/* 3. Devotional Engagement Analytics Chart */}
      <AnalyticsSection
        analyticsData={analyticsData}
        analyticsTotals={analyticsTotals}
        analyticsLoading={loading}
      />
        </div>
      

      {/* 4. Recent Devotionals Table View */}
      <RecentDevotionalsTable items={recentDevotionals} />

      {/* 5. User Leaderboards & Streaks Section */}
      <UserAnalyticsSection />
    </div>
  );
}