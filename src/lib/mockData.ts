// src/lib/mockData.ts
// Demo data for running NLAP without a live backend

import { CognitiveProfile, LearningSession, ContentChunk } from "./api";

export const DEMO_PROFILE: CognitiveProfile = {
  id: "demo-profile-001",
  user_id: "demo-user",
  diagnosis_type: "adhd",
  focus_duration_minutes: 25,
  break_duration_minutes: 5,
  chunk_word_limit: 80,
  reading_level: "intermediate",
  accessibility: {
    font_family: "Inter",
    font_size: 16,
    line_spacing: 1.8,
    color_theme: "dark",
    dyslexia_font: false,
    high_contrast: false,
  },
};

export const DEMO_CHUNKS: ContentChunk[] = [
  {
    id: "chunk-001",
    session_id: "demo-session-001",
    original_text:
      "Photosynthesis is the process by which green plants, algae, and certain bacteria convert light energy—usually from the sun—into chemical energy stored in glucose. This process takes place primarily in the chloroplasts of plant cells.",
    simplified_text:
      "Photosynthesis is how plants make their food. Plants use sunlight to turn water and air into sugar (glucose). This happens inside special parts of plant cells called chloroplasts.",
    level: "intermediate",
    chunk_index: 0,
    word_count: 42,
  },
  {
    id: "chunk-002",
    session_id: "demo-session-001",
    original_text:
      "The overall equation for photosynthesis is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This means six molecules of carbon dioxide and six molecules of water, using light energy, produce one molecule of glucose and six molecules of oxygen.",
    simplified_text:
      "Here is the photosynthesis recipe:\n• Ingredients: Carbon dioxide (CO₂) + Water (H₂O) + Sunlight\n• Result: Glucose (sugar) + Oxygen\n\nPlants breathe in CO₂ and release oxygen—the air we breathe!",
    level: "intermediate",
    chunk_index: 1,
    word_count: 45,
  },
  {
    id: "chunk-003",
    session_id: "demo-session-001",
    original_text:
      "Photosynthesis occurs in two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). In the light-dependent reactions, chlorophyll absorbs light and uses its energy to split water molecules, releasing oxygen as a byproduct.",
    simplified_text:
      "Photosynthesis has two steps:\n\n1. Light Step: Chlorophyll (the green stuff in leaves) captures sunlight. It uses that energy to break apart water. This releases oxygen into the air.\n\n2. Dark Step (Calvin Cycle): The plant uses the captured energy to build sugar from CO₂.",
    level: "intermediate",
    chunk_index: 2,
    word_count: 44,
  },
  {
    id: "chunk-004",
    session_id: "demo-session-001",
    original_text:
      "The Calvin cycle, also known as the light-independent reactions or carbon fixation, takes place in the stroma of the chloroplast. During this cycle, the plant uses ATP and NADPH produced during the light reactions to convert carbon dioxide into glucose.",
    simplified_text:
      "The Calvin Cycle happens in the second step. Think of it as the plant's kitchen:\n• It takes CO₂ from the air\n• Uses the energy stored from sunlight\n• Builds glucose (sugar) that the plant can use for energy and growth",
    level: "intermediate",
    chunk_index: 3,
    word_count: 46,
  },
  {
    id: "chunk-005",
    session_id: "demo-session-001",
    original_text:
      "Factors that affect the rate of photosynthesis include light intensity, carbon dioxide concentration, temperature, and water availability. Plants perform best when all these factors are at their optimal levels, a concept known as the limiting factor principle.",
    simplified_text:
      "Four things affect how fast photosynthesis works:\n• 🌞 More light → faster photosynthesis\n• 💨 More CO₂ → faster photosynthesis\n• 🌡️ Right temperature → best performance\n• 💧 Enough water → keeps things running\n\nIf any one is missing, photosynthesis slows down.",
    level: "intermediate",
    chunk_index: 4,
    word_count: 42,
  },
];

export const DEMO_SESSION: LearningSession = {
  id: "demo-session-001",
  user_id: "demo-user",
  content_title: "Introduction to Photosynthesis",
  chunks: DEMO_CHUNKS,
  total_focus_minutes: 12,
  completed_chunks: 2,
  started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
};

export const DEMO_SESSIONS: LearningSession[] = [
  DEMO_SESSION,
  {
    id: "demo-session-002",
    user_id: "demo-user",
    content_title: "The Water Cycle Explained",
    chunks: [],
    total_focus_minutes: 25,
    completed_chunks: 5,
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "demo-session-003",
    user_id: "demo-user",
    content_title: "Basic Algebra: Variables & Equations",
    chunks: [],
    total_focus_minutes: 20,
    completed_chunks: 3,
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];
