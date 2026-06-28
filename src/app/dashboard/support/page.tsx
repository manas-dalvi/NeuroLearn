"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Mail, 
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "How does the AI Simplifier adapt to different learning styles?",
    a: "The AI Simplifier analyzes the input text and applies specific rules based on your preset: ADHD mode formats the text into shorter chunks with bold action items; Dyslexia mode increases line and word spacing and sets the OpenDyslexic font; Autism mode reduces visual noise and keeps vocabulary definitions clear and straightforward."
  },
  {
    q: "Can I save simplified documents to read offline later?",
    a: "Yes! In your Profile or settings page, toggle the 'Offline Document Access' setting. Once synced, you can view your library history and access previously simplified materials without an active internet connection."
  },
  {
    q: "What is the Pomodoro timer duration adjustment range?",
    a: "You can adjust your default focus sessions between 5 minutes and 60 minutes in increments of 5 minutes. Go to the Profile page, find the 'Session Targets' card, and drag the slider to your desired length."
  },
  {
    q: "How does the speech synthesis feature work?",
    a: "We utilize the Web Speech API supported natively by modern browsers. You can select different voice personas (Jamie, Sarah, Leo) and customize playback speed directly within the Focus page or Accessibility settings drawer."
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12 animate-fade-in text-[var(--text-primary)]">
      
      {/* Page Header */}
      <div className="pb-4 border-b border-[var(--border)] text-left">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Support Center</h1>
        <p className="text-[var(--text-secondary)] font-semibold text-sm mt-1">
          Find answers to common questions or reach out to our team for custom accessibility requests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FAQs list - 2 Cols Span */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]/60 text-left">
              <HelpCircle size={18} className="text-[var(--accent)]" />
              Frequently Asked Questions
            </h3>

            <div className="divide-y divide-[var(--border)]/60">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex justify-between items-center text-left font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors gap-4"
                    >
                      <span className="text-sm">{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold mt-2.5 bg-[var(--bg-secondary)]/30 p-3.5 rounded-xl border border-[var(--border)] text-left">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contact Support Card Placeholder */}
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]/60 text-left">
              <MessageSquare size={18} className="text-[var(--accent)]" />
              Contact Support
            </h3>
            
            <div className="p-8 text-center bg-[var(--bg-secondary)]/10 rounded-2xl border border-[var(--border)]/50 space-y-3">
              <MessageSquare className="mx-auto text-[var(--text-secondary)]" size={32} />
              <h4 className="text-sm font-black text-[var(--text-primary)]">Ticketing System Coming Soon</h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed font-semibold">
                Our ticketing portal is currently being integrated. For urgent account issues, bug reports, or custom accessibility queries, please contact us at:
              </p>
              <a href="mailto:support@neurolearn.com" className="inline-block text-sm font-extrabold text-[var(--accent)] hover:underline">
                support@neurolearn.com
              </a>
            </div>
          </section>
        </div>

        {/* Resources card - 1 Col Span */}
        <div className="space-y-6">
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]/60 text-left">
              <BookOpen size={18} className="text-[var(--accent)]" />
              Learning Resources
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-semibold leading-normal text-left">
              Access guides and tutorials to make the most of the NeuroLearn adaptive layout options.
            </p>
            
            <div className="space-y-3 pt-2 text-left">
              <div className="p-3 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border)] flex items-center justify-between opacity-75">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Platform Tutorial</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-semibold">Walkthrough of features (5m video)</p>
                </div>
                <span className="text-[9px] font-extrabold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/80 px-2 py-0.5 rounded border border-[var(--border)] uppercase">
                  Coming Soon
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border)] flex items-center justify-between opacity-75">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">WCAG Compliance</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-semibold">Our commitment to accessibility compliance</p>
                </div>
                <span className="text-[9px] font-extrabold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/80 px-2 py-0.5 rounded border border-[var(--border)] uppercase">
                  Coming Soon
                </span>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-3 text-left">
            <h4 className="text-sm font-bold text-[var(--accent)] flex items-center gap-1.5">
              <Mail size={16} />
              Support Hours
            </h4>
            <p className="text-xs text-[var(--text-primary)] font-semibold leading-normal">
              Monday – Friday<br />
              9:00 AM – 5:00 PM EST
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] font-semibold leading-normal">
              Average response time is under 12 hours for all verified students.
            </p>
          </section>
        </div>

      </div>

    </div>
  );
}
