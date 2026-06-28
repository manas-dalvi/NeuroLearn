"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  LayoutDashboard, 
  Target, 
  Sparkles, 
  TrendingUp, 
  User, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  Accessibility,
  BookOpen
} from "lucide-react";
import { useAccessibility } from "@/context/AccessibilityContext";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onOpenAccessibility: () => void;
}

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/focus", label: "Focus Mode", icon: Target },
  { href: "/dashboard/simplifier", label: "AI Simplifier", icon: Sparkles },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/methodology", label: "Methodology", icon: BookOpen },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
];

export default function Sidebar({ collapsed, setCollapsed, onOpenAccessibility }: SidebarProps) {
  const pathname = usePathname();
  const { settings } = useAccessibility();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen sticky top-0 flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)] shadow-sm flex-shrink-0 overflow-x-hidden select-none z-50"
    >
      {/* Sidebar Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-md shadow-[var(--accent)]/10 flex-shrink-0">
            <Brain size={18} className="text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg text-[var(--text-primary)] tracking-tight whitespace-nowrap"
              >
                NeuroLearn
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-grow py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group text-sm font-semibold select-none
                ${
                  isActive
                    ? "bg-[var(--accent-glow)] text-[var(--accent)] border-l-[4px] border-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-primary)]"
                }
              `}
              style={{
                borderTopLeftRadius: isActive ? "4px" : "12px",
                borderBottomLeftRadius: isActive ? "4px" : "12px",
              }}
            >
              <item.icon size={18} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`} />
              
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}

              {/* Collapsed Tooltip */}
              {collapsed && (
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md pointer-events-none z-50 whitespace-nowrap ml-2">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions & Utilities */}
      <div className="mt-auto p-3 border-t border-[var(--border)] space-y-1.5 flex-shrink-0">
        {/* Accessibility Panel Button */}
        <button
          onClick={onOpenAccessibility}
          className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--accent)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-all duration-200 group relative"
        >
          <Accessibility size={18} className="text-[var(--accent)] flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Accessibility</span>}
          
          {collapsed && (
            <div className="absolute left-16 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md pointer-events-none z-50 whitespace-nowrap ml-2">
              Accessibility Options
            </div>
          )}
        </button>

        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group text-sm font-semibold select-none
                ${
                  isActive
                    ? "bg-[var(--accent-glow)] text-[var(--accent)] border-l-[4px] border-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-primary)]"
                }
              `}
              style={{
                borderTopLeftRadius: isActive ? "4px" : "12px",
                borderBottomLeftRadius: isActive ? "4px" : "12px",
              }}
            >
              <item.icon size={18} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`} />
              
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}

              {/* Collapsed Tooltip */}
              {collapsed && (
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md pointer-events-none z-50 whitespace-nowrap ml-2">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </motion.aside>
  );
}
