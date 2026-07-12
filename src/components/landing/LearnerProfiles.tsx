"use client";

import React from "react";
import Image from "next/image";
import { Check, AlertTriangle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function LearnerProfiles() {
  const profiles = [
    {
      id: "dyslexia",
      title: "Support for Dyslexic Learners",
      subtitle: "Restore reading confidence and prevent letter tracking errors.",
      image: "/images/dyslexia.png",
      challenge: "Standard typographic styles lead to letter rotation, character crowding, and fast visual tracking fatigue, making long reading tasks feel exhausting.",
      helps: "NeuroLearn restructures text layouts at the font level, introducing weighted bottom characters, spacious line intervals, and softer background tones.",
      features: ["OpenDyslexic & Atkinson Hyperlegible fonts", "Adjustable line, word, and letter spacing sliders", "Glare-free sepia and cream background presets"],
      accent: "#1F5F8B",
      bgColor: "bg-blue-50/70 border-blue-100",
      isReverse: false,
    },
    {
      id: "adhd",
      title: "Sustaining ADHD Attentional Flow",
      subtitle: "Scaffold task initiation and limit focus drift.",
      image: "/images/adhd.png",
      challenge: "Confronting a dense multi-page textbook chapter triggers cognitive overwhelm, leading to quick distraction, losing place, or session abandonment.",
      helps: "We split long documents into micro-learning segments (chunks) and connect them to countdown timers to keep attentional focus high.",
      features: ["AI-generated content chunk roadmaps", "Focus mode with active line rulers", "Integrated study workspace Pomodoro timers"],
      accent: "#EA580C",
      bgColor: "bg-orange-50/70 border-orange-100",
      isReverse: true,
    },
    {
      id: "autism",
      title: "Predictable Spaces for Autism",
      subtitle: "Limit sensory overload and establish structured workspaces.",
      image: "/images/autism.png",
      challenge: "Bright white screens, busy sidebar grids, and excessive animation speeds trigger sensory overload, causing quick physiological exhaustion.",
      helps: "NeuroLearn provides quiet, predictable reading spaces with stable layouts and soft color themes.",
      features: ["Low-sensory color themes (default & dark modes)", "Zero-distraction workspace layouts", "Disabled interface transition animations"],
      accent: "#0D9488",
      bgColor: "bg-teal-50/70 border-teal-100",
      isReverse: false,
    },
  ];

  return (
    <section className="bg-[#F8FAFC] py-24 md:py-36 px-6 md:px-12 relative overflow-hidden border-b border-[#E2E8F0]/40">
      <div className="max-w-6xl mx-auto space-y-28">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-center">
          <span className="text-[11px] font-bold tracking-wider text-[#1F5F8B] uppercase">
            Learner Profiles
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            Who is it built for?
          </h2>
          <p className="text-[#475569] text-base md:text-lg font-medium leading-relaxed">
            Every mind has its own rhythm. We build custom-tailored workspace modes to remove cognitive barriers and let you study comfortably.
          </p>
        </div>

        {/* Profiles alternating rows */}
        <div className="space-y-32">
          {profiles.map((p, index) => (
            <div
              key={p.id}
              className={`flex flex-col lg:flex-row items-center gap-16 lg:gap-24 ${
                p.isReverse ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Profile Image & Pastel Container (Mock Browser Look) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 w-full flex items-center justify-center"
              >
                <div
                  className={`w-full max-w-md rounded-[32px] p-4 ${p.bgColor} border shadow-lg relative group hover:scale-[1.01] transition-transform duration-300`}
                >
                  <div
                    className="relative w-full rounded-2xl overflow-hidden shadow-md bg-white"
                    style={{
                      aspectRatio:
                        p.id === "dyslexia"
                          ? "1024 / 476"
                          : p.id === "adhd"
                          ? "1024 / 490"
                          : "1024 / 492",
                    }}
                  >
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 448px"
                      priority
                    />
                  </div>
                </div>
              </motion.div>

              {/* Profile Copy Content */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex-1 space-y-7 text-left"
              >
                <div>
                  <span
                    style={{ color: p.accent, backgroundColor: `${p.accent}12` }}
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3.5"
                  >
                    {p.id} support
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] m-0 font-sans tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-xs md:text-sm font-semibold text-slate-500 mt-2 m-0 italic">
                    {p.subtitle}
                  </p>
                </div>

                {/* Structured empathetic blocks */}
                <div className="space-y-5 pt-2 border-t border-slate-200/50">
                  {/* Common Challenge */}
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <AlertTriangle size={12} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Common Challenge</div>
                      <p className="text-xs leading-relaxed text-[#475569] m-0 font-medium">{p.challenge}</p>
                    </div>
                  </div>

                  {/* How it helps */}
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#1F5F8B]/5 text-[#1F5F8B] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Sparkles size={12} className="text-[#1F5F8B]" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#1F5F8B] uppercase tracking-wider">How NeuroLearn Helps</div>
                      <p className="text-xs leading-relaxed text-[#475569] m-0 font-medium">{p.helps}</p>
                    </div>
                  </div>

                  {/* Available Features */}
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#0D9488]/5 text-[#0D9488] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Check size={12} className="text-[#0D9488]" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">Workspace Features</div>
                      <ul className="list-none p-0 m-0 space-y-1.5 pt-1.5">
                        {p.features.map((feat) => (
                          <li key={feat} className="text-xs font-bold text-slate-700 flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
