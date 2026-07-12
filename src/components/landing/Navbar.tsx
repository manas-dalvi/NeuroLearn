"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 transition-all duration-300 w-full px-6 md:px-12 py-4 flex items-center justify-between ${
          scrolled
            ? "backdrop-blur-md bg-[#FAF9F6]/80 border-b border-[#E2E8F0] shadow-sm"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-9 h-9 rounded-lg bg-[#1F5F8B] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Brain size={18} color="#fff" />
          </div>
          <span className="font-extrabold text-xl font-sans tracking-tight text-[#0F172A] m-0">
            NeuroLearn
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-semibold text-[#475569] hover:text-[#1F5F8B] transition-colors no-underline"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-sm font-semibold text-[#475569] hover:text-[#1F5F8B] transition-colors no-underline"
          >
            About NeuroLearn
          </a>
          <a
            href="#accessibility"
            className="text-sm font-semibold text-[#475569] hover:text-[#1F5F8B] transition-colors no-underline"
          >
            Accessibility
          </a>
          <a
            href="#contact"
            className="text-sm font-semibold text-[#475569] hover:text-[#1F5F8B] transition-colors no-underline"
          >
            Contact
          </a>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login" className="no-underline">
            <button className="text-sm font-semibold text-[#475569] hover:text-[#1F5F8B] bg-transparent border-none px-4 py-2 cursor-pointer transition-colors">
              Login
            </button>
          </Link>
          <Link href="/auth/register" className="no-underline">
            <button className="h-10 px-5 text-sm font-semibold text-white bg-[#1F5F8B] hover:bg-[#154668] border-none rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#475569] hover:bg-[#FAF9F6] border-none bg-transparent rounded-lg cursor-pointer transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[73px] z-40 bg-[#FAF9F6] border-b border-[#E2E8F0] shadow-lg md:hidden flex flex-col px-6 py-6 gap-4"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-[#1E293B] py-2 border-b border-[#F1F5F9] no-underline"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-[#1E293B] py-2 border-b border-[#F1F5F9] no-underline"
            >
              About NeuroLearn
            </a>
            <a
              href="#accessibility"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-[#1E293B] py-2 border-b border-[#F1F5F9] no-underline"
            >
              Accessibility
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-[#1E293B] py-2 border-b border-[#F1F5F9] no-underline"
            >
              Contact
            </a>
            <div className="flex gap-4 pt-4">
              <Link href="/auth/login" className="flex-1 no-underline" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-white border border-[#E2E8F0] rounded-xl font-semibold text-[#475569] text-sm cursor-pointer hover:bg-slate-50 transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/auth/register" className="flex-1 no-underline" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-[#1F5F8B] text-white border-none rounded-xl font-semibold text-sm cursor-pointer hover:bg-[#154668] transition-colors shadow-sm">
                  Get Started
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
