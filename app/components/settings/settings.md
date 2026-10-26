"use client";



import React from "react";

import Link from "next/link";

import { FaChevronRight } from "react-icons/fa";

import { SettingsSection } from "../../types/settings";



interface SettingsSectionListProps {

  sections: SettingsSection[];

}



export function SettingsSectionList({ sections }: SettingsSectionListProps) {

  return (

    <div className="px-6 space-y-6 bg-black">

      {sections.map((section, idx) => (

        <div key={idx} className="space-y-2">

          <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-wider px-1">

            {section.title}

          </h3>

          <div className="rounded-3xl bg-neutral-950 border border-neutral-900 overflow-hidden divide-y divide-neutral-900">

            {section.items.map((item) => {

              const Icon = item.icon;

              return (

                <Link

                  key={item.id}

                  href={item.href}

                  className="flex items-center justify-between p-4 hover:bg-neutral-900/50 transition-colors group"

                >

                  <div className="flex items-center gap-3.5">

                    <div className="p-2.5 rounded-2xl bg-neutral-900 text-neutral-300 group-hover:text-white group-hover:bg-neutral-800 transition-colors">

                      <Icon className="size-4" />

                    </div>

                    <span className="text-xs font-bold text-white">

                      {item.label}

                    </span>

                  </div>

                  <FaChevronRight className="size-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />

                </Link>

              );

            })}

          </div>

        </div>

      ))}

    </div>

  );

} 