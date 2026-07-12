"use client";

import React from "react";
import { Sparkles, Layers, Clock, Sliders, LineChart, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Features() {
  const cards = [
    {
      icon: Sparkles,
      title: "AI Text Simplification",
      desc: "Instantly adapts complex scientific or academic texts into readable, simplified explanations. Toggle vocabulary complexity on the fly to match your comfort level without losing core facts.",
      badge: "AI",
      color: "#1F5F8B",
      bgColor: "bg-blue-50/70 border-blue-100",
      iconBg: "bg-blue-500/10 text-blue-600",
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200/50",
      cols: "lg:col-span-2",
    },
    {
      icon: Layers,
      title: "Adaptive Chunking",
      desc: "Breaks dense PDFs and long textbook chapters into short, structured reading blocks to combat executive fatigue.",
      badge: "Layout",
      color: "#0D9488",
      bgColor: "bg-teal-50/70 border-teal-100",
      iconBg: "bg-teal-500/10 text-teal-600",
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200/50",
      cols: "lg:col-span-1",
    },
    {
      icon: Clock,
      title: "Focus Mode (Pomodoro)",
      desc: "Shields your workspace from sidebar clutter and features integrated study timers with customizable focus rulers.",
      badge: "Focus",
      color: "#EA580C",
      bgColor: "bg-orange-50/70 border-orange-100",
      iconBg: "bg-orange-500/10 text-orange-600",
      badgeBg: "bg-orange-50 text-orange-700 border-orange-200/50",
      cols: "lg:col-span-1",
    },
    {
      icon: Sliders,
      title: "Accessibility Preferences",
      desc: "Fine-tune reading layouts using specialized fonts like OpenDyslexic, customizable line and letter spacing controls, and sensory-friendly Sepia or Dark color themes.",
      badge: "Accessibility",
      color: "#7C3AED",
      bgColor: "bg-purple-50/70 border-purple-100",
      iconBg: "bg-purple-500/10 text-purple-600",
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200/50",
      cols: "lg:col-span-2",
    },
    {
      icon: LineChart,
      title: "Progress Tracking",
      desc: "Visualize your learning consistency with real-time stats showing completed focus duration, study streak tracking, and processed reading milestones.",
      badge: "Analytics",
      color: "#2563EB",
      bgColor: "bg-indigo-50/70 border-indigo-100",
      iconBg: "bg-indigo-500/10 text-indigo-600",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
      cols: "lg:col-span-2",
    },
    {
      icon: HelpCircle,
      title: "AI Quiz Generation",
      desc: "Generates active-recall multiple choice quizzes directly from your reading materials for comfortable self-testing.",
      badge: "Learning",
      color: "#059669",
      bgColor: "bg-emerald-50/70 border-emerald-100",
      iconBg: "bg-emerald-500/10 text-emerald-600",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
      cols: "lg:col-span-1",
    },
  ];

  return (
    <section id="features" className="bg-[#FAF5FF] py-24 md:py-32 px-6 md:px-12 relative overflow-hidden border-b border-[#E2E8F0]/40">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-purple-200/20 via-blue-200/10 to-teal-200/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-center">
          <span className="text-[11px] font-bold tracking-wider text-[#1F5F8B] uppercase">
            Platform Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            Designed for Cognitive Comfort
          </h2>
          <p className="text-[#475569] text-base md:text-lg font-medium leading-relaxed">
            NeuroLearn helps reduce cognitive overload through thoughtful design and AI-assisted learning.
          </p>
        </div>

        {/* Premium Bento Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-[28px] p-8 flex flex-col justify-between hover:translate-y-[-5px] hover:shadow-xl hover:bg-white hover:border-slate-300/80 transition-all duration-350 ${card.cols} group`}
              >
                <div className="space-y-5">
                  {/* Top Bar: Icon and Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shadow-inner`}>
                      <Icon size={20} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider ${card.badgeBg}`}>
                      {card.badge}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-[#0F172A] m-0 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-all duration-200">
                      {card.title}
                    </h3>
                    <p className="text-xs md:text-sm leading-relaxed text-[#475569] m-0 font-medium">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
