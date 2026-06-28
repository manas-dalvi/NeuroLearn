"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Bell, 
  Moon, 
  Sun, 
  Accessibility, 
  Play,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useAccessibility } from "@/context/AccessibilityContext";

interface NavbarProps {
  onOpenAccessibility: () => void;
}

export default function Navbar({ onOpenAccessibility }: NavbarProps) {
  const { user, logout } = useAuth();
  const { settings, update } = useAccessibility();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleDarkMode = () => {
    update({ colorTheme: settings.colorTheme === "dark" ? "default" : "dark" });
  };

  return (
    <header className="h-16 w-full sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border)] px-6 flex items-center justify-between shadow-sm select-none">
      {/* Left side links */}
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight hidden sm:block">
          NeuroLearn
        </h2>
        <nav className="flex gap-6 text-sm font-semibold text-[var(--text-secondary)]">
          <a href="/dashboard" className="text-[var(--accent)] border-b-2 border-[var(--accent)] pb-1">
            My Courses
          </a>
        </nav>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Accessibility Toggle */}
          <button
            onClick={onOpenAccessibility}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)]/50 rounded-xl transition-all"
            title="Accessibility Settings"
          >
            <Accessibility size={20} />
          </button>



          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50 rounded-xl transition-all"
            title="Toggle Theme"
          >
            {settings.colorTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="h-6 w-px bg-[var(--border)] mx-1"></div>

        {/* Start Session Button */}
        <button className="flex items-center gap-2 px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
          <Play size={14} className="fill-white" />
          <span>Start Session</span>
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[var(--bg-secondary)]/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              <img
                src={
                  user?.photoURL ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDmGUhfq3rHV0clhm6ZpY8OhpQ7DTOWPaC9baXcM0a0Zlm4d_0WYtL28PvoHueVfEA6ngx1uewvSGZ41lpxqOm0ifWgxDS0NQXC-x5HgXf74B38lfq-K2IXsg507HzGW5Osa5C9EIIS66vv3TLrf8l0mxRG2x7flUimMz0n5wOQDJR9Tx7UYmFXhg4hTCgYA4XtFLa7SDIVyzdchVCLuqetH94LxyOO5rC-AqdYeGQTsZiwht92fBEMSHyRqPoI8vJj4ewhNbvrWQ"
                }
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown size={14} className="text-[var(--text-secondary)]" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg py-2 z-50 animate-fade-in text-[var(--text-primary)]">
              <div className="px-4 py-2 border-b border-[var(--border)]">
                <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.displayName || "Alex Rivera"}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email || "alex.rivera@edu.com"}</p>
              </div>
              <a
                href="/dashboard/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setShowUserDropdown(false)}
              >
                <span>My Profile</span>
              </a>
              <a
                href="/dashboard/settings"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setShowUserDropdown(false)}
              >
                <span>Account Settings</span>
              </a>
              <div className="border-t border-[var(--border)] my-1"></div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50/50 hover:text-rose-600 transition-colors text-left font-semibold"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
