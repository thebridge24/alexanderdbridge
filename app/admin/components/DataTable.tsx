"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  skeletonRows = 5,
  emptyMessage = "No transaction records available.",
}: DataTableProps<T>) {
  const SKELETON_WIDTHS = ["79%", "56%", "71%", "42%", "87%", "64%", "74%"];

  const getSkeletonWidth = (rowIndex: number, columnIndex: number) =>
    SKELETON_WIDTHS[(rowIndex + columnIndex) % SKELETON_WIDTHS.length];
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-800 bg-[#0A0A0A] shadow-sm">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3.5 font-bold whitespace-nowrap uppercase tracking-wider text-[10px] text-neutral-500 ${
                    col.className || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-900">
            {isLoading ? (
              // Staggered Skeleton Preloader State
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
                  {columns.map((col, colIndex) => (
                    <td key={`skeleton-cell-${colIndex}`} className="px-4 py-4">
                      <div
                        className="h-4 bg-neutral-800 rounded-md"
                        style={{
                          width: getSkeletonWidth(rowIndex, colIndex),
                          animationDelay: `${rowIndex * 0.08}s`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Smooth Scaling & Collapsing Table Rows
              <AnimatePresence mode="sync">
                {data.map((row, index) => (
                  <motion.tr
                    layout
                    key={row.id}
                    initial={{ opacity: 0, scale: 0.97, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      filter: "blur(4px)",
                      transition: { duration: 0.18, ease: "easeOut" },
                    }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.02,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    className="group hover:bg-neutral-900/50 hover:border-b hover:border-red-600 transition-colors cursor-pointer"
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={`cell-${row.id}-${colIndex}`}
                        className={`px-4 py-3.5 font-medium text-neutral-300 ${
                          col.className || ""
                        }`}
                      >
                        {col.cell
                          ? col.cell(row, index)
                          : col.accessorKey
                            ? String(row[col.accessorKey] ?? "")
                            : null}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
