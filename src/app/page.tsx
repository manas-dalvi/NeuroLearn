import React from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductPreview from "@/components/landing/ProductPreview";
import Mission from "@/components/landing/Mission";
import Features from "@/components/landing/Features";
import LearnerProfiles from "@/components/landing/LearnerProfiles";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-[#FAF9F6] text-[#0F172A] min-h-screen font-sans selection:bg-[#1F5F8B]/10 selection:text-[#1F5F8B] overflow-x-hidden scroll-smooth">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ProductPreview />
        <Mission />
        <Features />
        <LearnerProfiles />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

