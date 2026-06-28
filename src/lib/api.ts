// src/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function parseErrorDetail(err: any): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  
  if (err.detail !== undefined) {
    const detail = err.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          if (item && typeof item === "object") {
            const loc = Array.isArray(item.loc)
              ? item.loc.filter((x: any) => x !== "body").join(".")
              : "";
            const msg = item.msg || "Invalid value";
            return loc ? `${loc}: ${msg}` : msg;
          }
          return String(item);
        })
        .join(", ");
    }
    if (typeof detail === "object" && detail !== null) {
      return detail.message || JSON.stringify(detail);
    }
  }
  if (err.message) return err.message;
  return JSON.stringify(err);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Prevent browser caching of API requests
  headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  headers["Pragma"] = "no-cache";
  headers["Expires"] = "0";

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(parseErrorDetail(err));
  }
  return res.json();
}


// ─── API Object ───────────────────────────────────────────────────────────────
export const api = {
  // ── Cognitive Profile ─────────────────────────────────────────────────────
  getProfile: async (token: string): Promise<CognitiveProfile> => {
    return request<CognitiveProfile>("/api/v1/profile", {}, token);
  },

  createProfile: async (token: string, data: CreateProfilePayload): Promise<CognitiveProfile> => {
    return request<CognitiveProfile>("/api/v1/profile", { method: "POST", body: JSON.stringify(data) }, token);
  },

  updateProfile: async (token: string, data: Partial<CognitiveProfile>): Promise<CognitiveProfile> => {
    return request<CognitiveProfile>("/api/v1/profile", { method: "PATCH", body: JSON.stringify(data) }, token);
  },

  // ── Sessions ──────────────────────────────────────────────────────────────
  createSession: async (token: string, data: CreateSessionPayload): Promise<LearningSession> => {
    return request<LearningSession>("/api/v1/sessions", { method: "POST", body: JSON.stringify(data) }, token);
  },

  getSessions: async (token: string): Promise<LearningSession[]> => {
    return request<LearningSession[]>("/api/v1/sessions", {}, token);
  },

  updateSession: async (token: string, sessionId: string, data: Partial<LearningSession>): Promise<LearningSession> => {
    return request<LearningSession>(`/api/v1/sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify(data) }, token);
  },

  // ── Content ───────────────────────────────────────────────────────────────
  uploadContent: async (token: string, data: FormData): Promise<UploadContentResponse> => {
    return request<UploadContentResponse>("/api/v1/content/upload", { method: "POST", body: data, headers: {} }, token);
  },

  getChunks: async (token: string, sessionId: string): Promise<ChunksResponse> => {
    return request<ChunksResponse>(`/api/v1/content/chunks/${sessionId}`, {}, token);
  },

  simplifyChunk: async (token: string, data: SimplifyPayload): Promise<SimplifyResponse> => {
    return request<SimplifyResponse>("/api/v1/content/simplify", { method: "POST", body: JSON.stringify(data) }, token);
  },

  // ── Focus ─────────────────────────────────────────────────────────────────
  recordFocusSession: async (token: string, data: FocusRecordPayload): Promise<FocusRecordResponse> => {
    return request<FocusRecordResponse>("/api/v1/focus/record", { method: "POST", body: JSON.stringify(data) }, token);
  },

  // ── Gamification ──────────────────────────────────────────────────────────
  getProgressStats: async (token: string): Promise<ProgressStats> => {
    return request<ProgressStats>("/api/v1/progress/stats", {}, token);
  },

  getBadges: async (token: string): Promise<Badge[]> => {
    return request<Badge[]>("/api/v1/gamification/badges", {}, token);
  },

  getWeeklyXp: async (token: string): Promise<WeeklyXpItem[]> => {
    return request<WeeklyXpItem[]>("/api/v1/progress/weekly-xp", {}, token);
  },

  // ── Routines ──────────────────────────────────────────────────────────────
  getRoutines: async (token: string): Promise<Routine[]> => {
    return request<Routine[]>("/api/v1/routines", {}, token);
  },

  createRoutine: async (token: string, data: CreateRoutinePayload): Promise<Routine> => {
    return request<Routine>("/api/v1/routines", { method: "POST", body: JSON.stringify(data) }, token);
  },

  completeRoutine: async (token: string, routineId: string): Promise<{ completed: boolean; date: string }> => {
    return request<{ completed: boolean; date: string }>(`/api/v1/routines/${routineId}/complete`, { method: "POST" }, token);
  },

  // ── Study Assistant Chat ──────────────────────────────────────────────────
  getChatHistory: async (token: string, sessionId: string): Promise<ChatMessagePayload[]> => {
    return request<ChatMessagePayload[]>(`/api/v1/sessions/${sessionId}/chat`, {}, token);
  },

  chatChunk: async (token: string, data: ChunkChatRequest): Promise<ChunkChatResponse> => {
    return request<ChunkChatResponse>("/api/v1/chat/chunk", { method: "POST", body: JSON.stringify(data) }, token);
  },

  // ── Quiz Generator ────────────────────────────────────────────────────────
  generateQuiz: async (token: string, data: QuizGenerationRequest): Promise<QuizGenerationResponse> => {
    return request<QuizGenerationResponse>("/api/v1/quiz/generate", { method: "POST", body: JSON.stringify(data) }, token);
  },

  submitQuiz: async (token: string, data: QuizSubmissionRequest): Promise<QuizSubmissionResponse> => {
    return request<QuizSubmissionResponse>("/api/v1/quiz/submit", { method: "POST", body: JSON.stringify(data) }, token);
  },

  getQuizHistory: async (token: string, sessionId: string): Promise<QuizHistoryItem[]> => {
    return request<QuizHistoryItem[]>(`/api/v1/sessions/${sessionId}/quiz-history`, {}, token);
  },

  getQuizAttempt: async (token: string, attemptId: string): Promise<QuizSubmissionResponse> => {
    return request<QuizSubmissionResponse>(`/api/v1/quiz/attempt/${attemptId}`, {}, token);
  },

  generateSummary: async (token: string, sessionId: string): Promise<SummaryResponse> => {
    return request<SummaryResponse>(`/api/v1/sessions/${sessionId}/summary`, { method: "POST" }, token);
  }
};


// ─── Types ────────────────────────────────────────────────────────────────────
export interface AccessibilityPrefs {
  font_family: string;
  font_size: number;
  line_spacing: number;
  word_spacing: number;
  color_theme: string;
  dyslexia_font: boolean;
  high_contrast: boolean;
  reduce_motion: boolean;
}

export interface CognitiveProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  diagnosis_type: string;
  focus_duration_minutes: number;
  break_duration_minutes: number;
  chunk_word_limit: number;
  reading_level: "beginner" | "intermediate" | "advanced";
  email: string;
  daily_goal_target: number;
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

export interface Routine {
  id: string;
  title: string;
  description: string;
  scheduled_time: string;
  days_of_week: number[];
  is_active: boolean;
  completed_today: boolean;
}

export interface CreateRoutinePayload {
  title: string;
  description?: string;
  scheduled_time: string;
  days_of_week: number[];
  is_active?: boolean;
}

export interface FocusRecordPayload {
  session_id: string;
  chunk_id?: string;
  mode: "FOCUS" | "BREAK";
  duration_seconds: number;
  completed?: boolean;
  focus_session_id?: string;
}

export interface FocusRecordResponse {
  status: string;
  xp_earned: number;
  focus_session_id?: string;
}

export interface ProgressStats {
  level: number;
  xp: number;
  next_level_xp: number;
  streak: number;
  focus_minutes_today: number;
}

export interface WeeklyXpItem {
  day: string;
  xp: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  unlocked: boolean;
  date: string;
}

export type CreateProfilePayload = Omit<CognitiveProfile, "id" | "user_id" | "email" | "daily_goal_target"> & { daily_goal_target?: number };
export type UploadContentResponse = { session_id: string; chunk_count: number };
export type ChunksResponse = { chunks: ContentChunk[] };
export type SimplifyPayload = { text: string; level: "beginner" | "intermediate" | "advanced"; profile_type?: string };
export type SimplifyResponse = { simplified: string };
export type CreateSessionPayload = { content_title: string; text: string; profile_type?: string };

export interface ChatMessagePayload {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SourceMetadata {
  chunk_id: string;
  chunk_index: number;
  title: string;
}

export interface ChunkChatRequest {
  session_id: string;
  chunk_id?: string;
  question: string;
  mode?: string;
  parameters?: Record<string, any>;
}

export interface ChunkChatResponse {
  answer: string;
  sources: SourceMetadata[];
  confidence_score: number;
  confidence_level: "High" | "Medium" | "Low";
}

export interface QuizQuestionSchema {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer" | "fill_in_the_blank";
  options?: string[];
}

export interface QuizGenerationRequest {
  session_id: string;
  chunk_id?: string;
  difficulty: "easy" | "medium" | "hard";
  num_questions: number;
  profile_type?: string;
}

export interface QuizGenerationResponse {
  quiz_attempt_id: string;
  questions: QuizQuestionSchema[];
}

export interface QuestionSubmission {
  question_id: string;
  user_answer: string;
}

export interface QuizSubmissionRequest {
  quiz_attempt_id: string;
  answers: QuestionSubmission[];
  time_taken?: number;
}

export interface QuizQuestionEvaluation {
  question_id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  explanation: string;
}

export interface QuizSubmissionResponse {
  quiz_attempt_id: string;
  score: number;
  accuracy: number;
  correct_count: number;
  total_questions: number;
  evaluations: QuizQuestionEvaluation[];
  xp_earned: number;
  new_xp: number;
  new_level: number;
}

export interface QuizHistoryItem {
  quiz_attempt_id: string;
  difficulty: string;
  score: number;
  accuracy: number;
  total_questions: number;
  created_at: string;
  attempt_number: number;
}

export interface SummaryResponse {
  summary: string;
}
