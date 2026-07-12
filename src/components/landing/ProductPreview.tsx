"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Clock, Sliders, LineChart, Lock, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState<"dyslexia" | "adhd" | "autism">("dyslexia");

  const tabs = [
    { id: "dyslexia", label: "Dyslexia Workspace", image: "/images/dyslexia.png", color: "#1F5F8B" },
    { id: "adhd", label: "ADHD Focus Space", image: "/images/adhd.png", color: "#EA580C" },
    { id: "autism", label: "Autism Calm View", image: "/images/autism.png", color: "#0D9488" },
  ];

  return (
    <section className="bg-[#F0F9FF] py-24 md:py-36 px-6 md:px-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-blue-300/30 via-purple-300/10 to-teal-300/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <span className="text-[11px] font-bold tracking-wider text-[#1F5F8B] uppercase">
            Interactive Preview
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            What does it look like?
          </h2>
          <p className="text-[#475569] text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Explore the real NeuroLearn interface. Toggle the views below to see how layouts reshape automatically for different learning styles.
          </p>
        </div>

        {/* Premium Tab Workspace Switcher */}
        <div className="flex justify-center p-1.5 bg-slate-200/50 backdrop-blur-md rounded-[20px] max-w-md mx-auto border border-white/20 shadow-sm z-10 relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl border-none cursor-pointer transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-md"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3D Browser Perspective Container */}
        <div className="relative w-full max-w-5xl mx-auto pt-4" style={{ perspective: "1200px" }}>
          
          {/* Mockup Window */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, rotateX: 6, rotateY: -3, scale: 0.96 }}
            animate={{ opacity: 1, rotateX: 3, rotateY: -1, scale: 1 }}
            whileHover={{ rotateX: 0, rotateY: 0, scale: 1.01 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden text-left origin-center"
          >
            {/* Premium Browser Chrome */}
            <div className="bg-[#FAF9F6] border-b border-slate-200/60 px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Traffic buttons */}
                <div className="flex gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] border border-[#DC2626]/20" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] border border-[#D97706]/20" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] border border-[#059669]/20" />
                </div>
                {/* Arrows */}
                <div className="hidden sm:flex gap-1.5 text-slate-400">
                  <ChevronLeft size={15} />
                  <ChevronRight size={15} />
                  <RotateCcw size={13} className="ml-1" />
                </div>
              </div>

              {/* URL Address Bar */}
              <div className="flex-1 max-w-md bg-slate-200/40 rounded-xl text-xs text-slate-600 py-1.5 px-4 flex items-center justify-center gap-1.5 border border-slate-200/30">
                <Lock size={12} className="text-[#0D9488]" />
                <span className="font-sans font-medium tracking-tight select-none">
                  neurolearn.app/workspace/document_01
                </span>
              </div>

              {/* End spacer */}
              <div className="w-16 hidden sm:block" />
            </div>

            {/* Main Application Screenshot */}
            <div
              className="relative w-full bg-slate-50"
              style={{
                aspectRatio:
                  activeTab === "dyslexia"
                    ? "1024 / 476"
                    : activeTab === "adhd"
                    ? "1024 / 490"
                    : "1024 / 492",
              }}
            >
              <Image
                src={tabs.find((t) => t.id === activeTab)!.image}
                alt={`${activeTab} workspace dashboard`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          </motion.div>

          {/* Floating Callout 1: AI Simplification (Left, top) */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[-30px] top-[15%] hidden xl:flex items-start gap-3.5 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 shadow-xl max-w-[230px] text-left z-20"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1F5F8B]/10 flex items-center justify-center text-[#1F5F8B] shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#0F172A] m-0">AI Simplification</h4>
              <p className="text-[10px] leading-relaxed text-[#475569] m-0 font-medium">
                Converts dense textbooks into simplified levels in real time.
              </p>
            </div>
          </motion.div>

          {/* Floating Callout 2: Focus Mode (Right, top) */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute right-[-30px] top-[22%] hidden xl:flex items-start gap-3.5 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 shadow-xl max-w-[230px] text-left z-20"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EA580C]/10 flex items-center justify-center text-[#EA580C] shrink-0">
              <Clock size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#0F172A] m-0">Focus Timer</h4>
              <p className="text-[10px] leading-relaxed text-[#475569] m-0 font-medium">
                Structured workspaces mapping reading rules directly to Pomodoro focus sessions.
              </p>
            </div>
          </motion.div>

          {/* Floating Callout 3: Accessibility Control (Left, bottom) */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute left-[-40px] bottom-[22%] hidden xl:flex items-start gap-3.5 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 shadow-xl max-w-[230px] text-left z-20"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488] shrink-0">
              <Sliders size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#0F172A] m-0">Accessibility Controls</h4>
              <p className="text-[10px] leading-relaxed text-[#475569] m-0 font-medium">
                Enable OpenDyslexic font and adjust tracking distances on the fly.
              </p>
            </div>
          </motion.div>

          {/* Floating Callout 4: Progress Tracking (Right, bottom) */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute right-[-40px] bottom-[15%] hidden xl:flex items-start gap-3.5 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 shadow-xl max-w-[230px] text-left z-20"
          >
            <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] shrink-0">
              <LineChart size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#0F172A] m-0">Progress Metrics</h4>
              <p className="text-[10px] leading-relaxed text-[#475569] m-0 font-medium">
                Tracks focus time, completed chapters, and generated quiz scores.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
