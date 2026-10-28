/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { WelcomeHeader } from "../components/WelcomeHeader";
import { OverviewStatCards } from "../components/OverviewStatCards";
import {
  DevotionalItem,
  RecentDevotionalsTable,
} from "../components/RecentDevotionalsTable";
import AnalyticsSection, {
  DevotionalAnalyticsItem,
} from "../../components/AnalyticsSection";
import UserAnalyticsSection from "../../components/UserAnalyticsSection";

interface AdminUser {
  currentStreak?: number | null;
}

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    devotionals: 0,
    users: 0,
    activeStreaks: 0,
    feedbackCount: 0,
    thisMonthDevotions: 0,
  });

  const [recentDevotionals, setRecentDevotionals] = useState<DevotionalItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<DevotionalAnalyticsItem[]>([]);
  const [analyticsTotals, setAnalyticsTotals] = useState({
    views: 0,
    likes: 0,
    comments: 0,
  });

  useEffect(() => {
    async function loadOverviewData() {
      try {
        setLoading(true);
        // 1. Fetch devotionals, users, surveys, and analytics endpoints simultaneously
        const [devosRes, usersRes, surveysRes, analyticsRes] = await Promise.all([
          fetch("/api/devotionals").catch(() => null),
          fetch("/api/admin/users").catch(() => null),
          fetch("/api/admin/surveys").catch(() => null),
          fetch("/api/admin/analytics").catch(() => null),
        ]);

        const devosData = devosRes && devosRes.ok ? await devosRes.json() : { devotionals: [] };
        const usersData = usersRes && usersRes.ok ? await usersRes.json() : { users: [] };
        const surveysData = surveysRes && surveysRes.ok ? await surveysRes.json() : { submissions: [] };
        const analyticsDataJson = analyticsRes && analyticsRes.ok ? await analyticsRes.json() : { analytics: [] };

        const devosList = devosData.devotionals || [];
        const usersList = usersData.users || [];
        const surveysList = surveysData.submissions || [];
        const fetchedAnalytics = analyticsDataJson.analytics || [];

        // Map analytics by dateString for efficient lookup
        const analyticsMap = new Map(
          fetchedAnalytics.map((a: DevotionalAnalyticsItem) => [a.dateString, a])
        );

        // 2. Merge analytics (views, likes, comments) into each devotional item
        const enrichedDevotionals = devosList.map((d: any) => {
          const stats: any = analyticsMap.get(d.dateString) || {};
          return {
            ...d,
            views: stats.views || d.views || 0,
            likes: stats.likes || d.likes || 0,
            comments: stats.comments || d.comments || 0,
          };
        });

        // 3. Compute Active Streaks & This Month Devotions
        const activeStreaksCount = usersList.filter((u: AdminUser) => (u.currentStreak || 0) > 0).length;
        
        const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        const thisMonthDevosCount = devosList.filter((d: any) => 
          (d.dateString || "").startsWith(currentMonthPrefix)
        ).length;

        setTotals({
          devotionals: devosList.length,
          users: usersList.length,
          activeStreaks: activeStreaksCount,
          feedbackCount: surveysList.length,
          thisMonthDevotions: thisMonthDevosCount,
        });

        // 4. Update Analytics State for Charts
        setAnalyticsData(fetchedAnalytics);
        setAnalyticsTotals({
          views: analyticsDataJson.totalViews || 0,
          likes: analyticsDataJson.totalLikes || 0,
          comments: analyticsDataJson.totalComments || 0,
        });

        // 5. Set recent devotionals with fully populated engagement stats
        setRecentDevotionals(enrichedDevotionals.slice(-5).reverse());
      } catch (err) {
        console.error("Failed to load overview data:", err);
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
      
      <div className="grid grid-cols-1 gap-4">
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