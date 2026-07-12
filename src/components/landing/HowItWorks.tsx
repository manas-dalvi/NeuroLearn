"use client";

import React from "react";
import { UploadCloud, Sparkles, Sliders, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: UploadCloud,
      title: "Upload Materials",
      desc: "Drag and drop textbooks, research articles, or PDFs into your library.",
      color: "#1F5F8B",
      bgColor: "bg-blue-50/50",
    },
    {
      num: "02",
      icon: Sparkles,
      title: "AI Restructuring",
      desc: "Our model chunks long paragraphs and adapts linguistic levels in seconds.",
      color: "#EA580C",
      bgColor: "bg-orange-50/50",
    },
    {
      num: "03",
      icon: Sliders,
      title: "Choose Layouts",
      desc: "Apply dyslexia fonts, spacious grids, or low-contrast sensory themes.",
      color: "#0D9488",
      bgColor: "bg-teal-50/50",
    },
    {
      num: "04",
      icon: GraduationCap,
      title: "Study Comfortably",
      desc: "Test your retention with quizzes and maintain attentional flow in Focus Mode.",
      color: "#7C3AED",
      bgColor: "bg-purple-50/50",
    },
  ];

  return (
    <section className="bg-white py-24 md:py-32 px-6 md:px-12 relative border-b border-[#E2E8F0]/40">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl text-left">
          <span className="text-[11px] font-bold tracking-wider text-[#1F5F8B] uppercase">
            Product Flow
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            How does it work?
          </h2>
          <p className="text-[#475569] text-base leading-relaxed">
            NeuroLearn simplifies your reading load in four seamless phases designed for zero friction.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-[#FAF9F6] border border-[#E2E8F0]/80 rounded-[24px] p-6 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md hover:translate-y-[-4px] transition-all duration-300 relative group"
              >
                {/* Large Number Badge */}
                <div
                  style={{ color: `${step.color}15` }}
                  className="absolute top-4 right-6 text-5xl font-black font-sans leading-none select-none tracking-tight transition-colors duration-300 group-hover:text-opacity-80"
                >
                  {step.num}
                </div>

                {/* Icon Circle */}
                <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center shadow-inner`}>
                  <Icon size={20} style={{ color: step.color }} />
                </div>

                {/* Content */}
                <div className="space-y-2 mt-8">
                  <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#475569] m-0">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
