"use client";
import Image from "next/image";
import React from "react";
import { Timeline } from "@/components/ui/timeline";

export function TimelineDemo() {
  const data = [
    {
      title: "2024",
      content: (
        <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 order-1 text-center">
              <h4 className="text-lg md:text-xl font-bold text-blue-400 mb-3">UiTMMart Launch</h4>
              <p className="text-white text-xs md:text-sm font-normal mb-4">
                Built and launched UiTMMart platform for students with integrated payment systems and seamless user experience.
              </p>
              
            </div>
            <div className="md:w-1/2 order-2">
              <Image
                src="/images/launch.png"
                alt="UiTMMart shopping"
                width={500}
                height={300}
                className="rounded-lg object-cover w-full h-48 md:h-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 order-2 md:order-2 text-center">
              <h4 className="text-lg md:text-xl font-bold text-blue-400 mb-3">Market Research & Development</h4>
              <p className="text-white text-xs md:text-sm font-normal mb-4">
                We identified the need for a dedicated platform to serve the UiTM student community and began development with a focused team.
              </p>
              <p className="text-white text-xs md:text-sm font-normal mb-4">
                Our research showed students needed an easy way to buy, sell, and exchange goods and services within campus.
              </p>
            </div>
            <div className="md:w-1/2 order-1 md:order-1">
              <Image
                src="/images/research.png"
                alt="Student team"
                width={500}
                height={300}
                className="rounded-lg object-cover w-full h-48 md:h-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2022",
      content: (
        <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 order-1 text-center">
              <h4 className="text-lg md:text-xl font-bold text-blue-400 mb-3">The Beginning</h4>
              <p className="text-white text-xs md:text-sm font-normal mb-4">
                Our journey began when a group of UiTM students identified the challenges of campus commerce and envisioned a better solution.
              </p>
              
            </div>
            <div className="md:w-1/2 order-2">
              <Image
                src="/images/beginning.png"
                alt="Platform concept"
                width={500}
                height={300}
                className="rounded-lg object-cover w-full h-48 md:h-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
              />
            </div>
          </div>
        </div>
      ),
    },
  ];
  return (
    <div className="w-full">
      <div className="w-full px-4 md:px-0">
        <Timeline data={data} />
      </div>
    </div>
  );
} 