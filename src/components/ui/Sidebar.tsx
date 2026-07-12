"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LayoutDashboard, BookOpen, Focus, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion } from "framer-motion";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/focus", label: "Focus Mode", icon: Focus },
  { href: "/assessment", label: "Profile", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25 }}
      style={{
        height: "100vh", position: "sticky", top: 0,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "20px 0", flexShrink: 0, overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px", marginBottom: 32 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, var(--accent), #f472b6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Brain size={18} color="#fff" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "'Space Grotesk', sans-serif", whiteSpace: "nowrap" }}
          >
            NL<span className="gradient-text">AP</span>
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "0 10px" }}>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-nav-item ${pathname === item.href ? "active" : ""}`}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "0 10px" }}>
        {!collapsed && user && (
          <div style={{
            padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10,
            border: "1px solid var(--border)", marginBottom: 8,
          }}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 2 }}>
              {user.displayName || "Learner"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-nav-item"
          style={{ width: "100%", justifyContent: collapsed ? "center" : "flex-start", background: "none", border: "none" }}
          title={collapsed ? "Log Out" : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Log Out</span>}
        </button>
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="sidebar-nav-item"
          style={{ width: "100%", marginTop: 4, justifyContent: collapsed ? "center" : "flex-start", background: "none", border: "none" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  );
}
