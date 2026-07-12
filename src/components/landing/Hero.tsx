"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#FAF9F6] py-24 md:py-36 px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-16 max-w-7xl mx-auto">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-[#EFF6FF] to-[#FAF5FF] rounded-full blur-[120px] opacity-70 -z-10 pointer-events-none" />

      {/* Left Column: Human-Centric Content */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 space-y-8 text-left z-10"
      >
        {/* Modern Badge */}
        <div className="inline-flex items-center gap-2 bg-[#1F5F8B]/5 border border-[#1F5F8B]/10 rounded-full px-4 py-1.5 text-[11px] font-bold text-[#1F5F8B] uppercase tracking-wider">
          <Sparkles size={12} className="text-[#0D9488]" />
          AI-Powered • Neurodivergent-First Learning
        </div>

        {/* Storytelling Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0F172A] leading-[1.1] tracking-tight font-sans">
          Learning that adapts to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F5F8B] to-[#0D9488] font-black">
            you
          </span>
          ,<br />
          not the other way around.
        </h1>

        {/* Empathetic Subheading */}
        <p className="text-[#475569] text-base md:text-lg leading-relaxed max-w-lg font-medium">
          Traditional platforms assume all minds process information in the same format. NeuroLearn is built to adapt text layouts, focus settings, and learning pace to your cognitive strengths.
        </p>

        {/* Redesigned Premium Buttons */}
        <div className="flex flex-wrap gap-4 items-center">
          <Link href="/auth/register" className="no-underline">
            <button className="h-13 px-8 text-sm font-semibold text-white bg-gradient-to-r from-[#1F5F8B] to-[#0D9488] hover:from-[#154668] hover:to-[#0A7368] border-none rounded-2xl cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2">
              Get Started <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/auth/login" className="no-underline">
            <button className="h-13 px-8 text-sm font-semibold text-[#1E293B] bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-slate-300 rounded-2xl cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center">
              Sign In
            </button>
          </Link>
        </div>

        {/* Verification / Trust Indicators */}
        <div className="pt-6 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-y-3.5 gap-x-6">
          {[
            "Personalized Learning",
            "Accessibility First",
            "Privacy Focused",
            "AI Assisted"
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-xs font-bold text-[#475569]">
              <div className="w-5 h-5 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
                <Check size={11} strokeWidth={3} />
              </div>
              {item}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Column: Physical-feeling overlapping 3D learner cards */}
      <div className="flex-1 relative w-full min-h-[460px] md:min-h-[520px] flex items-center justify-center select-none pt-10">
        
        {/* Card 1: Dyslexia (Left, rotated counter-clockwise, slightly lower) */}
        <motion.div
          initial={{ opacity: 0, x: -50, y: 50, rotate: -12 }}
          animate={{ opacity: 1, x: -100, y: 20, rotate: -6 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute z-10 origin-bottom-right"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="w-[190px] md:w-[220px] rounded-[24px] bg-[#E0F2FE]/85 backdrop-blur-md border border-white/50 shadow-lg overflow-hidden p-4 group hover:scale-[1.03] transition-transform duration-300"
          >
            <div className="relative w-full aspect-[1024/476] rounded-xl overflow-hidden mb-3.5 shadow-sm bg-white/40">
              <Image
                src="/images/dyslexia.png"
                alt="Dyslexia Dashboard Screenshot"
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 160px, 190px"
                priority
              />
            </div>
            <div className="space-y-1 text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#0284C7]/15 text-[#0284C7] uppercase tracking-wider">
                dyslexia Preset
              </span>
              <h3 className="text-xs font-black text-slate-800 m-0">Reading Spacing</h3>
              <p className="text-[10px] leading-relaxed text-slate-600 m-0">
                Adjustable fonts and letter boundaries that limit character confusion.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Card 2: ADHD (Center, larger, scaled up, on top, draws eye) */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: -20, scale: 1.05 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute z-30 origin-center"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-[210px] md:w-[245px] rounded-[28px] bg-[#FFEDD5]/90 backdrop-blur-md border-2 border-white shadow-2xl overflow-hidden p-4.5 group hover:scale-[1.03] transition-transform duration-300"
          >
            <div className="relative w-full aspect-[1024/490] rounded-xl overflow-hidden mb-4 shadow-md bg-white/40">
              <Image
                src="/images/adhd.png"
                alt="ADHD Dashboard Screenshot"
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 180px, 210px"
                priority
              />
            </div>
            <div className="space-y-1 text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#EA580C]/15 text-[#EA580C] uppercase tracking-wider">
                ADHD PRESET
              </span>
              <h3 className="text-sm font-black text-slate-800 m-0">Attentional Focus</h3>
              <p className="text-xs leading-relaxed text-slate-600 m-0">
                AI text chunk splitting and Pomodoro timers to avoid reading drift.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Card 3: Autism (Right, rotated clockwise, slightly lower) */}
        <motion.div
          initial={{ opacity: 0, x: 50, y: 50, rotate: 12 }}
          animate={{ opacity: 1, x: 100, y: 20, rotate: 6 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute z-20 origin-bottom-left"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="w-[190px] md:w-[220px] rounded-[24px] bg-[#E6FBF7]/85 backdrop-blur-md border border-white/50 shadow-lg overflow-hidden p-4 group hover:scale-[1.03] transition-transform duration-300"
          >
            <div className="relative w-full aspect-[1024/492] rounded-xl overflow-hidden mb-3.5 shadow-sm bg-white/40">
              <Image
                src="/images/autism.png"
                alt="Autism Dashboard Screenshot"
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 160px, 190px"
                priority
              />
            </div>
            <div className="space-y-1 text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#0D9488]/15 text-[#0D9488] uppercase tracking-wider">
                Autism PRESET
              </span>
              <h3 className="text-xs font-black text-slate-800 m-0">Sensory Calm</h3>
              <p className="text-[10px] leading-relaxed text-slate-600 m-0">
                Low contrast themes and disabled motion presets to prevent cognitive exhaustion.
              </p>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
