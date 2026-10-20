"use client";

import Link from "next/link";
import { FiBookOpen, FiArrowUpRight, FiEye, FiHeart, FiMessageCircle } from "react-icons/fi";

export interface DevotionalItem {
  dateString: string;
  dayNumber: number;
  topic: string;
  text: string;
  views?: number;
  likes?: number;
  comments?: number;
}

export function RecentDevotionalsTable({ items }: { items: DevotionalItem[] }) {
  return (
    <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FiBookOpen className="text-red-500" /> Recent Published Devotionals
          </h2>
          <p className="text-xs text-neutral-400">Latest entries released to your app readers</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1 text-xs font-mono text-red-500 hover:text-red-400 transition-colors"
        >
          <span>View All</span>
          <FiArrowUpRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-mono tracking-wider text-[10px]">
              <th className="pb-3 px-3">Day / Date</th>
              <th className="pb-3 px-3">Topic Title</th>
              <th className="pb-3 px-3">Scripture</th>
              <th className="pb-3 px-3 text-right">Engagement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {items.slice(0, 5).map((item) => (
              <tr key={item.dateString} className="hover:bg-neutral-900/40 transition-colors">
                <td className="py-3.5 px-3 font-mono">
                  <span className="text-white font-bold block">Day {item.dayNumber}</span>
                  <span className="text-neutral-500 text-[10px]">{item.dateString}</span>
                </td>
                <td className="py-3.5 px-3 font-semibold text-neutral-200">
                  {item.topic}
                </td>
                <td className="py-3.5 px-3 text-neutral-400 italic">
                  {item.text}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-neutral-400">
                  <div className="flex items-center justify-end gap-3 text-[11px]">
                    <span className="flex items-center gap-1"><FiEye className="text-neutral-500" /> {item.views || 0}</span>
                    <span className="flex items-center gap-1"><FiHeart className="text-red-500" /> {item.likes || 0}</span>
                    <span className="flex items-center gap-1"><FiMessageCircle className="text-amber-500" /> {item.comments || 0}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}