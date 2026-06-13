// src/lib/api.ts
import {
  DEMO_PROFILE,
  DEMO_SESSIONS,
  DEMO_CHUNKS,
  DEMO_SESSION,
} from "./mockData";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ─── Demo delay helper ───────────────────────────────────────────────────────
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ─── HTTP helper ─────────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API Error");
  }
  return res.json();
}

// ─── In-memory store for demo mode ──────────────────────────────────────────
let _demoProfile: CognitiveProfile | null = null;
const _demoSessions: LearningSession[] = [...DEMO_SESSIONS];
const _demoChunks: Record<string, ContentChunk[]> = {
  "demo-session-001": DEMO_CHUNKS,
};

function chunkText(text: string, wordLimit: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    const combined = (current + " " + s).trim();
    if (combined.split(" ").length > wordLimit && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = combined;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
}

function simplifyDemo(text: string, level: string): string {
  if (level === "beginner") {
    return text
      .replace(/\b(\w{10,})\b/g, (w) => w.slice(0, 6) + "…")
      .replace(/([.!?])\s+/g, "$1\n\n");
  }
  if (level === "advanced") return text;
  // intermediate — break long sentences, add bullet intro
  const lines = text.split(/(?<=[.!?])\s+/);
  return lines.slice(0, 3).join(" ");
}

// ─── API Object ───────────────────────────────────────────────────────────────
export const api = {
  // ── Cognitive Profile ─────────────────────────────────────────────────────
  getProfile: async (token: string): Promise<CognitiveProfile> => {
    if (DEMO_MODE) {
      await delay(400);
      if (_demoProfile) return _demoProfile;
      throw new Error("Profile not found. Please complete the assessment wizard.");
    }
    return request<CognitiveProfile>("/api/profile", {}, token);
  },

  createProfile: async (token: string, data: CreateProfilePayload): Promise<CognitiveProfile> => {
    if (DEMO_MODE) {
      await delay(700);
      _demoProfile = { ...DEMO_PROFILE, ...data, id: "demo-profile-" + Date.now() };
      return _demoProfile;
    }
    return request<CognitiveProfile>("/api/profile", { method: "POST", body: JSON.stringify(data) }, token);
  },

  updateProfile: async (token: string, data: Partial<CognitiveProfile>): Promise<CognitiveProfile> => {
    if (DEMO_MODE) {
      await delay(400);
      _demoProfile = { ...((_demoProfile ?? DEMO_PROFILE) as CognitiveProfile), ...data };
      return _demoProfile as CognitiveProfile;
    }
    return request<CognitiveProfile>("/api/profile", { method: "PATCH", body: JSON.stringify(data) }, token);
  },

  // ── Sessions ──────────────────────────────────────────────────────────────
  createSession: async (token: string, data: CreateSessionPayload): Promise<LearningSession> => {
    if (DEMO_MODE) {
      await delay(1200); // Simulate AI processing time
      const profile = _demoProfile ?? DEMO_PROFILE;
      const wordLimit = profile.chunk_word_limit ?? 80;
      const level = profile.reading_level ?? "intermediate";
      const rawChunks = chunkText(data.text, wordLimit);
      const sessionId = "session-" + Date.now();

      const chunks: ContentChunk[] = rawChunks.map((text, i) => ({
        id: `chunk-${sessionId}-${i}`,
        session_id: sessionId,
        original_text: text,
        simplified_text: simplifyDemo(text, level),
        level,
        chunk_index: i,
        word_count: text.split(" ").length,
      }));

      _demoChunks[sessionId] = chunks;

      const session: LearningSession = {
        id: sessionId,
        user_id: "demo-user",
        content_title: data.content_title,
        chunks,
        total_focus_minutes: 0,
        completed_chunks: 0,
        started_at: new Date().toISOString(),
      };
      _demoSessions.unshift(session);
      return session;
    }
    return request<LearningSession>("/api/sessions", { method: "POST", body: JSON.stringify(data) }, token);
  },

  getSessions: async (token: string): Promise<LearningSession[]> => {
    if (DEMO_MODE) {
      await delay(400);
      return _demoSessions;
    }
    return request<LearningSession[]>("/api/sessions", {}, token);
  },

  updateSession: async (token: string, sessionId: string, data: Partial<LearningSession>): Promise<LearningSession> => {
    if (DEMO_MODE) {
      await delay(200);
      const idx = _demoSessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) _demoSessions[idx] = { ..._demoSessions[idx], ...data };
      return _demoSessions[idx] ?? DEMO_SESSION;
    }
    return request<LearningSession>(`/api/sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify(data) }, token);
  },

  // ── Content ───────────────────────────────────────────────────────────────
  uploadContent: async (token: string, data: UploadContentPayload): Promise<UploadContentResponse> => {
    if (DEMO_MODE) {
      await delay(800);
      return { session_id: "demo-session-001", chunk_count: DEMO_CHUNKS.length };
    }
    return request<UploadContentResponse>("/api/content/upload", { method: "POST", body: JSON.stringify(data) }, token);
  },

  getChunks: async (token: string, sessionId: string): Promise<ChunksResponse> => {
    if (DEMO_MODE) {
      await delay(400);
      const chunks = _demoChunks[sessionId] ?? DEMO_CHUNKS;
      return { chunks };
    }
    return request<ChunksResponse>(`/api/content/chunks/${sessionId}`, {}, token);
  },

  simplifyChunk: async (token: string, data: SimplifyPayload): Promise<SimplifyResponse> => {
    if (DEMO_MODE) {
      await delay(900);
      const simplified = simplifyDemo(data.text, data.level);
      return { simplified };
    }
    return request<SimplifyResponse>("/api/content/simplify", { method: "POST", body: JSON.stringify(data) }, token);
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AccessibilityPrefs {
  font_family: string;
  font_size: number;
  line_spacing: number;
  color_theme: "default" | "dark" | "sepia" | "high_contrast";
  dyslexia_font: boolean;
  high_contrast: boolean;
}

export interface CognitiveProfile {
  id: string;
  user_id: string;
  diagnosis_type: string;
  focus_duration_minutes: number;
  break_duration_minutes: number;
  chunk_word_limit: number;
  reading_level: "beginner" | "intermediate" | "advanced";
  accessibility: AccessibilityPrefs;
}

export interface ContentChunk {
  id: string;
  session_id: string;
  original_text: string;
  simplified_text: string;
  level: string;
  chunk_index: number;
  word_count: number;
}

export interface LearningSession {
  id: string;
  user_id: string;
  content_title: string;
  chunks: ContentChunk[];
  total_focus_minutes: number;
  completed_chunks: number;
  started_at: string;
  ended_at?: string;
}

export type CreateProfilePayload = Omit<CognitiveProfile, "id" | "user_id">;
export type UploadContentPayload = { title: string; text: string };
export type UploadContentResponse = { session_id: string; chunk_count: number };
export type ChunksResponse = { chunks: ContentChunk[] };
export type SimplifyPayload = { text: string; level: "beginner" | "intermediate" | "advanced" };
export type SimplifyResponse = { simplified: string };
export type CreateSessionPayload = { content_title: string; text: string };

