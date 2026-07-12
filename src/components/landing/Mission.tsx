"use client";

import React from "react";
import { XCircle, CheckCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Mission() {
  const traditionalPoints = [
    {
      title: "Long, dense reading material",
      desc: "Unstructured textbooks and academic PDFs that quickly cause cognitive and reading fatigue.",
    },
    {
      title: "One-size-fits-all experience",
      desc: "Fixed layout formats that ignore cognitive and attention differences.",
    },
    {
      title: "Difficult to stay focused",
      desc: "Interfaces filled with visual noise, sidebars, and alerts causing distraction.",
    },
    {
      title: "No AI assistance",
      desc: "Requires manual reading and translation of highly complex academic terminology.",
    },
    {
      title: "Manual revision",
      desc: "Time-consuming manual notes creation and active-recall test preparation.",
    },
    {
      title: "Limited personalization",
      desc: "Rigid typography that cannot adjust spacing or contrast to support dyslexia.",
    },
  ];

  const neuroPoints = [
    {
      title: "AI Text Simplification",
      desc: "Adapts academic text difficulty and vocabulary complexity in real time.",
    },
    {
      title: "Adaptive Content Chunking",
      desc: "Splits long reading files into structured, bite-sized cognitive milestones.",
    },
    {
      title: "Focus Mode (Pomodoro)",
      desc: "Shields your reading view with Pomodoro timers and focus line rulers.",
    },
    {
      title: "Accessibility Preferences",
      desc: "Adjust OpenDyslexic font, layout spacing sliders, and calm color themes.",
    },
    {
      title: "Progress Tracking",
      desc: "Monitors daily goals, streak metrics, and study focus sessions automatically.",
    },
    {
      title: "AI Quiz Generation",
      desc: "Creates recall quizzes directly from your reading materials for self-testing.",
    },
  ];

  return (
    <section id="about" className="bg-[#FDFBF7] py-24 md:py-32 px-6 md:px-12 relative border-t border-[#E2E8F0]/50">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl text-left">
          <span className="text-[11px] font-bold tracking-wider text-[#1F5F8B] uppercase">
            Platform Vision
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            Built for different minds.
          </h2>
          <p className="text-[#475569] text-base md:text-lg leading-relaxed font-medium">
            Traditional digital tools assume every learner processes information in the exact same format. NeuroLearn rejects the one-size-fits-all model.
          </p>
        </div>

        {/* Two-Column Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          
          {/* Traditional Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-[#E2E8F0]/80 rounded-[32px] p-8 shadow-sm flex flex-col hover:border-slate-350 hover:shadow-md transition-all duration-300"
          >
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A] m-0">Traditional Learning</h3>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block mt-0.5">
                    Rigid & Monolithic
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed font-medium m-0 max-w-md h-8">
                Monolithic educational systems neglect individual cognitive differences, causing fast mental exhaustion.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-6" />

            {/* Feature Blocks */}
            <div className="space-y-6">
              {traditionalPoints.map((point) => (
                <div key={point.title} className="flex items-start gap-3.5">
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-[#1E293B] m-0">{point.title}</h4>
                    <p className="text-xs leading-relaxed text-[#475569] m-0 font-medium">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* NeuroLearn Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white border-2 border-[#1F5F8B] rounded-[32px] p-8 shadow-xl flex flex-col hover:shadow-2xl transition-all duration-300"
          >
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0D9488] shadow-inner">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A] m-0">NeuroLearn Workspace</h3>
                    <span className="text-[9px] font-bold text-[#0D9488] uppercase tracking-widest block mt-0.5">
                      Fluid & Personal
                    </span>
                  </div>
                </div>
                {/* Inline Badge */}
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#1F5F8B]/10 text-[#1F5F8B] uppercase tracking-wider border border-[#1F5F8B]/10">
                  AI Workspace
                </span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed font-medium m-0 max-w-md h-8">
                An adaptive learning workspace designed to adjust typography, pacing, and focus tools to your mind.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-6" />

            {/* Feature Blocks */}
            <div className="space-y-6">
              {neuroPoints.map((point) => (
                <div key={point.title} className="flex items-start gap-3.5">
                  <CheckCircle2 size={15} className="text-[#0D9488] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-[#1E293B] m-0">{point.title}</h4>
                    <p className="text-xs leading-relaxed text-[#475569] m-0 font-medium">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
