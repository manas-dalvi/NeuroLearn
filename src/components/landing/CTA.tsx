"use client";

import React from "react";
import Link from "next/link";
import { Brain, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="bg-white py-24 px-6 md:px-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-[#EFF6FF] to-[#FAF5FF] rounded-full blur-[120px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%)",
        }}
        className="max-w-4xl mx-auto rounded-[36px] p-8 md:p-20 border border-[#E2E8F0] shadow-xl text-center space-y-10 relative"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#1F5F8B] to-[#0D9488] flex items-center justify-center text-white mx-auto shadow-md">
          <Brain size={24} />
        </div>

        <div className="space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight font-sans m-0 leading-tight">
            Every learner deserves a space built around them.
          </h2>
          <p className="text-[#475569] text-base md:text-lg leading-relaxed font-medium">
            Create your free NeuroLearn account today and experience learning tailored to your cognitive strengths.
          </p>
        </div>

        {/* Polished Gradient and Outline CTA Buttons */}
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <Link href="/auth/register" className="no-underline">
            <button className="h-13 px-8 text-sm font-semibold text-white bg-gradient-to-r from-[#1F5F8B] to-[#0D9488] hover:from-[#154668] hover:to-[#0A7368] border-none rounded-2xl cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2">
              Create Free Account <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/auth/login" className="no-underline">
            <button className="h-13 px-8 text-sm font-semibold text-[#1E293B] bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-2xl cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center">
              Sign In
            </button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
