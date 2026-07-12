"use client";

import { useState } from "react";
import { 
  Database, 
  Shield, 
  CloudLightning,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12 animate-fade-in text-[var(--text-primary)]">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Application Settings</h1>
          <p className="text-[var(--text-secondary)] font-semibold text-sm mt-1">
            Configure system settings, notification rules, and offline data preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Settings Options */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sync & Offline Data Card */}
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]/60">
              <Database size={18} className="text-[var(--accent)]" />
              Data & Offline Sync
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)]/30 rounded-xl opacity-75">
                <div className="space-y-0.5 text-left">
                  <span className="text-sm font-bold text-[var(--text-primary)]">Offline Document Access</span>
                  <p className="text-[10px] text-[var(--text-secondary)] font-semibold">Sync files to local storage so you can review simplified materials offline</p>
                </div>
                <span className="text-[10px] font-extrabold text-[var(--accent)] bg-[var(--bg-secondary)]/60 px-2.5 py-1 rounded-lg border border-[var(--border)]">
                  Coming Soon
                </span>
              </div>
            </div>
          </section>

        </div>

        {/* Right Side Column */}
        <div className="space-y-6">
          
          {/* Security & Access Card */}
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]/60">
              <Shield size={18} className="text-[var(--accent)]" />
              Privacy & Security
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-semibold leading-normal text-left">
              Your simplified inputs are stored locally or processed privately. We do not sell your academic readings or data to third-party advertisers.
            </p>
            <div className="space-y-2 pt-2">
              <button className="w-full py-2.5 bg-[var(--bg-secondary)]/50 border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-xs rounded-xl transition-all">
                Export My Data
              </button>
              <button className="w-full py-2.5 bg-[var(--bg-secondary)]/50 border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-xs rounded-xl transition-all">
                View Privacy Statement
              </button>
            </div>
          </section>

          {/* Integration Status Card */}
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]/60">
              <CloudLightning size={18} className="text-[var(--accent)]" />
              Integrations
            </h3>
            
            <div className="space-y-3 text-left">
              <p className="text-xs text-[var(--text-secondary)] font-semibold leading-normal mb-1">
                Connect external study materials and calendar services in a future update.
              </p>
              <div className="flex justify-between items-center opacity-75">
                <span className="text-xs font-bold text-[var(--text-primary)]">Notion workspace</span>
                <span className="text-[9px] font-extrabold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
                  COMING SOON
                </span>
              </div>
              <div className="flex justify-between items-center opacity-75">
                <span className="text-xs font-bold text-[var(--text-primary)]">Google Calendar</span>
                <span className="text-[9px] font-extrabold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
                  COMING SOON
                </span>
              </div>
            </div>
          </section>

        </div>

      </div>

      {/* Save Action Area */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl shadow-sm flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-xs font-bold transition-colors shadow-sm"
        >
          Save System Changes
        </button>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-3 rounded-xl shadow-xl border border-[var(--border)]"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-xs font-bold">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
