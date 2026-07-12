"use client";

import React, { useState } from "react";
import { Sliders, Type, Palette, Eye, AlignLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Accessibility() {
  const [theme, setTheme] = useState<"default" | "sepia" | "dark">("sepia");
  const [font, setFont] = useState<"inter" | "dyslexic">("dyslexic");
  const [spacing, setSpacing] = useState<"normal" | "extra">("extra");
  const [ruler, setRuler] = useState<boolean>(true);

  const themeStyles = {
    default: { bg: "bg-[#FAF7F2]", text: "text-[#1E293B]" },
    sepia: { bg: "bg-[#FAF1D6]", text: "text-[#5A3E1B]" },
    dark: { bg: "bg-[#0A0A10]", text: "text-[#E2E8F0]" },
  };

  const fontStyles = {
    inter: "font-sans",
    dyslexic: "font-mono font-medium tracking-wide",
  };

  return (
    <section id="accessibility" className="bg-white py-24 md:py-36 px-6 md:px-12 relative border-b border-[#E2E8F0]/40">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl text-left">
          <span className="text-[11px] font-bold tracking-wider text-[#1F5F8B] uppercase">
            User-Driven Layouts
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            How does it adapt?
          </h2>
          <p className="text-[#475569] text-base md:text-lg leading-relaxed font-medium">
            NeuroLearn is designed using evidence-informed accessibility and learning principles. We make accessibility a core pillar of the interface—not an afterthought.
          </p>
        </div>

        {/* Visual Showcase Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* Controls Mock Widget (Left 5 columns) */}
          <div className="lg:col-span-5 bg-[#FAF9F6] border border-[#E2E8F0]/80 rounded-[32px] p-6 md:p-8 space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F5F8B]/5 border border-[#1F5F8B]/10 flex items-center justify-center text-[#1F5F8B] shadow-sm">
                  <Sliders size={18} />
                </div>
                <h3 className="text-base font-extrabold text-[#0F172A] m-0">Accessibility Controls</h3>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed font-medium">
                Click the preview options below to see how NeuroLearn adjusts word presentation and spacing in real time.
              </p>
            </div>

            <div className="space-y-5 pt-6 border-t border-slate-200/60">
              {/* Font Selector Option */}
              <div className="space-y-2.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Type size={12} className="text-slate-400" /> Typographic Font
                </label>
                <div className="flex bg-slate-200/30 p-1 rounded-xl gap-1 border border-slate-200/20">
                  <button
                    onClick={() => setFont("inter")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      font === "inter" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Clean Sans-Serif
                  </button>
                  <button
                    onClick={() => setFont("dyslexic")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      font === "dyslexic" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    OpenDyslexic
                  </button>
                </div>
              </div>

              {/* Theme Selector Option */}
              <div className="space-y-2.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette size={12} className="text-slate-400" /> Color Scheme
                </label>
                <div className="flex bg-slate-200/30 p-1 rounded-xl gap-1 border border-slate-200/20">
                  <button
                    onClick={() => setTheme("default")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      theme === "default" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Cream
                  </button>
                  <button
                    onClick={() => setTheme("sepia")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      theme === "sepia" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Warm Sepia
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      theme === "dark" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Sensory Dark
                  </button>
                </div>
              </div>

              {/* Spacing Option */}
              <div className="space-y-2.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft size={12} className="text-slate-400" /> Line & Word Spacing
                </label>
                <div className="flex bg-slate-200/30 p-1 rounded-xl gap-1 border border-slate-200/20">
                  <button
                    onClick={() => setSpacing("normal")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      spacing === "normal" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setSpacing("extra")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      spacing === "extra" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Comfortable (1.8x)
                  </button>
                </div>
              </div>

              {/* Focus Ruler Option */}
              <div className="space-y-2.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={12} className="text-slate-400" /> Attentional Focus Aid
                </label>
                <div className="flex bg-slate-200/30 p-1 rounded-xl gap-1 border border-slate-200/20">
                  <button
                    onClick={() => setRuler(false)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      !ruler ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Off
                  </button>
                  <button
                    onClick={() => setRuler(true)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors ${
                      ruler ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"
                    }`}
                  >
                    Focus Ruler On
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reader Card Mockup (Right 7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <motion.div
              animate={{
                backgroundColor: theme === "default" ? "#FAF7F2" : theme === "sepia" ? "#FAF1D6" : "#0A0A10",
                borderColor: theme === "default" ? "#E2E8F0" : theme === "sepia" ? "#E8D09F" : "#1F2937",
              }}
              transition={{ duration: 0.3 }}
              className="w-full border rounded-[32px] p-6 md:p-10 shadow-xl relative overflow-hidden transition-all duration-300"
            >
              {/* Reading Ruler overlay */}
              {ruler && (
                <div
                  style={{
                    top: spacing === "extra" ? "124px" : "118px",
                    height: spacing === "extra" ? "38px" : "32px",
                  }}
                  className="absolute left-0 right-0 bg-[#0D9488]/8 border-t border-b border-[#0D9488]/30 pointer-events-none z-10 transition-all duration-300"
                />
              )}

              {/* Reader Header */}
              <div className="flex items-center justify-between border-b border-[#000000]/5 pb-4 mb-6">
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Lesson Reader Preview
                </span>
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-350" />
                  <span className="w-2 h-2 rounded-full bg-slate-350" />
                </div>
              </div>

              {/* Reader Content Text */}
              <div
                className={`space-y-5 leading-relaxed tracking-normal select-none transition-all duration-300 ${
                  themeStyles[theme].text
                } ${fontStyles[font]}`}
                style={{
                  lineHeight: spacing === "extra" ? "2.0" : "1.6",
                  wordSpacing: spacing === "extra" ? "2.5px" : "0px",
                  fontFamily: font === "dyslexic" ? "'OpenDyslexic', 'Atkinson Hyperlegible', monospace" : "inherit",
                }}
              >
                <p className="m-0 text-sm md:text-base font-semibold">
                  Traditional learning software forces a single style of reading. By loading all information into rigid columns, students must work extra hard just to read standard lines of text.
                </p>
                <p className="m-0 text-sm md:text-base relative z-20 font-black">
                  NeuroLearn adapts the interface formatting dynamically, letting you modify contrast, letter spacing, font properties, and focus guides to match your processing strengths.
                </p>
                <p className="m-0 text-sm md:text-base font-semibold">
                  This custom design significantly limits extraneous brain strain, allowing you to focus your attention on understanding concepts rather than navigating visual noise.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
