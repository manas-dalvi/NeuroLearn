"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  HelpCircle, 
  Cpu, 
  Database, 
  Layers, 
  FileText, 
  Activity, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Brain,
  Lightbulb,
  Clock,
  CheckCircle2,
  ListCollapse,
  Eye,
  Target,
  FileSpreadsheet,
  LineChart
} from "lucide-react";
import { useAccessibility } from "@/context/AccessibilityContext";

export default function MethodologyPage() {
  const { settings } = useAccessibility();
  const [activeResearchTab, setActiveResearchTab] = useState<"adhd" | "dyslexia" | "autism">("dyslexia");
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // 1. Engineering Timeline steps (SDLC Diagram)
  const TIMELINE_STEPS = [
    {
      num: 1,
      title: "Problem Identification",
      desc: "Analyzing the challenges neurodivergent students encounter in standard, static, or text-heavy online learning platforms (e.g. extraneous cognitive overload).",
      icon: ShieldAlert
    },
    {
      num: 2,
      title: "Literature Review",
      desc: "Conducting research across neuropsychology and accessibility literature to find proven guidelines (UDL guidelines, dyslexic visual criteria, and sensory overload triggers).",
      icon: BookOpen
    },
    {
      num: 3,
      title: "Requirement Analysis",
      desc: "Deriving core functional modules based on literature (e.g. visual spacing adjustments, distraction-free Pomodoro focus mode, and chunked summaries).",
      icon: ListCollapse
    },
    {
      num: 4,
      title: "Technology Selection",
      desc: "Selecting performant frameworks suited for rapid style rendering (Next.js/React) and low-latency RAG orchestration (FastAPI/ChromaDB/Groq).",
      icon: Cpu
    },
    {
      num: 5,
      title: "System Design",
      desc: "Defining relational schemas (SQLite) for profiles, configuring the vector store (ChromaDB) for document chunk indexing, and designing prompt templates.",
      icon: Layers
    },
    {
      num: 6,
      title: "Frontend Development",
      desc: "Building the responsive dashboard layout, accessibility panel drawer, content workspace, and focus timers in Next.js.",
      icon: Eye
    },
    {
      num: 7,
      title: "Backend Development",
      desc: "Structuring the API routers, authentication cookies, parsing engines, and DB session managers.",
      icon: Database
    },
    {
      num: 8,
      title: "AI Integration",
      desc: "Developing the RAG pipeline using Groq Llama-3.1-8b-instant to generate simplified content, summaries, and quizzes based on retrieved contexts.",
      icon: Sparkles
    },
    {
      num: 9,
      title: "Testing & Evaluation",
      desc: "Validating data flows, streak computations, and state consistency across widgets to ensure real-time progress updates.",
      icon: CheckCircle2
    }
  ];

  // 2. Frontend Research Tabs data
  const RESEARCH_DATA = {
    adhd: {
      title: "ADHD (Attention-Deficit/Hyperactivity Disorder)",
      findings: "Learners with ADHD exhibit altered working memory and attentional modulation, rendering them highly vulnerable to distractions from redundant stimuli, which results in elevated Extraneous Cognitive Load (ECL) in multimedia environments [3].",
      decisions: "Mitigate distraction by utilizing short, segmented content chunks combined with timebox boundaries to scaffold task initiation and sustain focused attention [8].",
      features: [
        "Focused study Pomodoro timer with structured intervals.",
        "Adaptive chunking of learning materials based on profile word limits.",
        "Progressive task list checklists to maintain visual structure."
      ],
      reference: "Costa, C. (2025). Neurodivergent by Design: Using AI to Honor and Support Learning Differences. IntechOpen [8]."
    },
    dyslexia: {
      title: "Dyslexia",
      findings: "Dyslexic readers face severe letter tracking fatigue and mirror rotation stress. Standard white screens with high-contrast text increase glare/dazzle, while serif font structures increase visual crowding and decoding errors [5].",
      decisions: "Optimize font legibility by implementing plain, evenly-spaced sans-serif options (OpenDyslexic, Inter) and using chromatic overlays (sepia, warm background tones) to prevent dazzle [5].",
      features: [
        "Dyslexia font toggle mapping to the OpenDyslexic fallback font-family.",
        "Line and word spacing adjustment scales to decrease visual crowding.",
        "Movable horizontal Reading Ruler and important keyword highlighter."
      ],
      reference: "Khan, R. U., Oon, Y. B., Ul Haq, M. I., & Hajarah, S. (2018). Proposed user interface design criteria for children with dyslexia. IJET [5]."
    },
    autism: {
      title: "Autism Spectrum",
      findings: "Autistic learners report experiencing intense sensory overload and anxiety-inducing layout clutter in digital spaces. Reduced sensory habituation means they struggle to ignore erratic visual animations or layout shifts [6].",
      decisions: "Deliver structure and predictability. Provide quiet study setups with minimal motion transitions and low-brightness, sensory-friendly color palettes [6].",
      features: [
        "Reduce Motion Toggle to completely suppress transition animations.",
        "Sensory themes (Sepia Warm and Dark Mode) to prevent sensory overload.",
        "AI Study Assistant with simple, direct vocabulary scaffolding."
      ],
      reference: "Waisman, T. C., Alba, L. A., & Green, S. (2022). Barriers to Inclusive Learning for Autistic Individuals. Pediatrics [6]."
    }
  };

  // 3. Mapping Table
  const MAPPING_ROWS = [
    {
      finding: "Dyslexic readers show lower error rates and faster reading times on sans-serif and bottom-heavy fonts [5].",
      feature: "OpenDyslexic Font Option & Accessibility Context styling.",
      path: "src/context/AccessibilityContext.tsx",
      outcome: "Reduced visual crowding and letter rotation errors."
    },
    {
      finding: "White backgrounds cause visual glare/dazzle. Softer backdrops (cream/sepia) improve reading speeds [5].",
      feature: "Color Theme Presets (Default, Dark, Sepia Warm, High Contrast).",
      path: "src/components/accessibility/AccessibilityPanel.tsx",
      outcome: "Reduced visual fatigue, eye strain, and reading stress."
    },
    {
      finding: "Neurodivergent learners experience significantly higher Extraneous Cognitive Load (ECL) in online learning [3].",
      feature: "AI Content Simplifier (Beginner, Intermediate, Advanced) and Adaptive Chunking.",
      path: "backend/app/services/rag_service.py",
      outcome: "Reduced cognitive load by lowering linguistic complexity and visual density."
    },
    {
      finding: "Autistic individuals suffer sensory overload and require customizable tones and minimal layout motion [6].",
      feature: "Reduce Motion Toggle & Sensory Color Themes.",
      path: "src/app/dashboard/layout.tsx",
      outcome: "Mitigation of sensory anxiety and tracking triggers."
    },
    {
      finding: "Executive dysfunction in ADHD requires visual task breakdowns and externalized scaffolding [8].",
      feature: "Focus Mode Task Tracker, chunk-based progress, and XP metrics.",
      path: "src/app/dashboard/focus/page.tsx",
      outcome: "Scaffolding for task initiation and sustained attention."
    },
    {
      finding: "Dyslexic students benefit from auditory-visual bimodal reinforcement to improve retention [5].",
      feature: "Audio Content TTS Reader inside the simplified workspace.",
      path: "src/app/dashboard/simplifier/page.tsx",
      outcome: "Enhanced phonological awareness and auditory-visual reinforcement."
    },
    {
      finding: "Autistic students benefit from focus lines and layout stabilizers [6].",
      feature: "Reading Ruler and Word Highlight tools.",
      path: "src/app/dashboard/focus/page.tsx",
      outcome: "Shielded line focus and reduced visual distraction."
    }
  ];

  // 4. Technology Stack Cards
  const TECH_STACK = [
    {
      title: "Frontend Layer",
      tech: "Next.js 16 / React 19 / Zustand 5",
      desc: "Selected for fast page hydration and client-side style updates. Zustand stores global Pomodoro states cleanly, while Next.js's App Router enables modular layouts.",
      icon: Eye
    },
    {
      title: "Backend Services",
      tech: "FastAPI 0.111.0",
      desc: "Asynchronous Python API server chosen for high concurrency. It handles heavy network-bound processes (LLM streams and PDF chunking) without blocking requests.",
      icon: Cpu
    },
    {
      title: "AI & RAG Engine",
      tech: "ChromaDB / Groq (Llama-3.1-8b)",
      desc: "Retrieval-Augmented Generation (RAG) queries local sentence-transformer vector indexes (ChromaDB) and feeds relevant text as context to Groq to generate responses.",
      icon: Sparkles
    },
    {
      title: "Database Engine",
      tech: "SQLite (SQLAlchemy & aiosqlite)",
      desc: "Lightweight, serverless relational database. SQLAlchemy's async engine manages asynchronous connections to persist user progress, profiles, and streaks.",
      icon: Database
    }
  ];

  // 5. Research References
  const REFERENCES = [
    {
      id: 1,
      citation: "Costa, C. (2025)",
      title: "Neurodivergent by Design: Using AI to Honor and Support Learning Differences",
      authors: "Christina Costa",
      year: "2025",
      publisher: "IntechOpen",
      contribution: "Provided the core concept of shifting AI from standardization to personalization, and the use of AI tools to scaffold executive functioning in higher education."
    },
    {
      id: 2,
      citation: "Le Cunff et al. (2024)",
      title: "Neurodiversity Positively Predicts Perceived Extraneous Load in Online Learning: A Quantitative Research Study",
      authors: "Anne-Laure Le Cunff, Vincent Giampietro, and Eleanor Dommett",
      year: "2024",
      publisher: "Education Sciences (MDPI)",
      contribution: "Contributed the foundational statistical evidence proving that neurodivergent students experience significantly higher Extraneous Cognitive Load (ECL) in online settings."
    },
    {
      id: 3,
      citation: "Jamali et al. (2023)",
      title: "Learning Engagement of Children with Dyslexia Through Tangible User Interface: An Experiment",
      authors: "Siti Nurliana Jamali, Novia Admodisastro, Azrina Kamaruddin, & Sa'adah Hassan",
      year: "2023",
      publisher: "IJACSA",
      contribution: "Provided the framework for User-Centered Design (UCD) and highlighted how multisensory visual, auditory, and tactile elements increase learning engagement."
    },
    {
      id: 4,
      citation: "Khan et al. (2018)",
      title: "Proposed user interface design criteria for children with dyslexia",
      authors: "Rehman Ullah Khan, Yin Bee Oon, Muhammad Inam Ul Haq, & Siti Hajarah",
      year: "2018",
      publisher: "IJET",
      contribution: "Outlined the empirical typographic and contrast boundaries (specific font styles, larger pixel ranges, and pastel cream/yellow background overlays)."
    },
    {
      id: 5,
      citation: "Waisman et al. (2022)",
      title: "Barriers to Inclusive Learning for Autistic Individuals",
      authors: "TC Waisman, Laura A. Alba, and Shulamite A. Green",
      year: "2022",
      publisher: "Pediatrics",
      contribution: "Identified postsecondary sensory hyper-reactivity barriers and justified the use of low-brightness themes, quiet focus areas, and reduced motion parameters."
    }
  ];

  return (
    <div className="space-y-12 max-w-[1200px] mx-auto pb-16 animate-fade-in text-[var(--text-primary)]">
      
      {/* Premium Header */}
      <section className="text-center space-y-4 py-6 border-b border-[var(--border)]">
        <div className="inline-flex items-center justify-center p-3.5 bg-[var(--accent-glow)] text-[var(--accent)] rounded-2xl mb-2">
          <BookOpen size={36} />
        </div>
        <h1 className="text-4xl font-black tracking-tight">System Methodology & Foundations</h1>
        <p className="text-sm font-semibold text-[var(--text-secondary)] max-w-2xl mx-auto uppercase tracking-wider">
          Theoretical frameworks, UX design criteria, and architectural data flows underpinning NeuroLearn
        </p>
      </section>

      {/* Project Overview & Problem Statement */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Brain size={18} className="text-[var(--accent)]" /> Project Overview
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
            NeuroLearn is a cognitive assistive environment designed to support students with dyslexia, ADHD, and autism. By replacing static, one-size-fits-all digital layouts with dynamic, state-driven accessibility options and personalized retrieval models, the platform accommodates individual cognitive profiles from the outset.
          </p>
        </div>

        <div className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert size={18} className="text-[var(--accent)]" /> Problem Statement
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
            Mainstream digital learning platforms are often designed around neurotypical assumptions, creating accessibility barriers for neurodivergent learners such as individuals with ADHD, autism, dyslexia, and executive functioning challenges, leading to unequal educational participation and reduced learning effectiveness.
          </p>
        </div>
      </section>

      {/* Objectives Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">Objectives</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Key academic and technical goals of the NeuroLearn platform</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center">
              <Target size={18} />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Reduce Extraneous Load</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Minimize reading distractions, visual stress, and layout density to free up limited working memory capacity for core concept comprehension [3].
            </p>
          </div>
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center">
              <Lightbulb size={18} />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Personalize Accommodations</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Transition educational interventions from rigid templates to responsive, user-directed accessibility styles synchronized with profile schemas [8].
            </p>
          </div>
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center">
              <Clock size={18} />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Scaffold Executive Demands</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Externalize visual scheduling, segment reading materials, and utilize gamified multipliers to encourage task initiation and self-regulation [8].
            </p>
          </div>
        </div>
      </section>

      {/* Research Statistics Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">Research Statistics</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Quantitative review and implementation variables</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm text-center space-y-1">
            <span className="text-3xl font-black text-[var(--accent)] tracking-tight">5</span>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Academic Papers Reviewed</p>
          </div>
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm text-center space-y-1">
            <span className="text-3xl font-black text-[var(--accent)] tracking-tight">3</span>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Supported Profiles</p>
          </div>
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm text-center space-y-1">
            <span className="text-3xl font-black text-[var(--accent)] tracking-tight">9</span>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Accessibility Features</p>
          </div>
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm text-center space-y-1">
            <span className="text-3xl font-black text-[var(--accent)] tracking-tight">8</span>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Core Technologies Used</p>
          </div>
        </div>
      </section>

      {/* 1. Research Methodology Timeline / SDLC Diagram */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">SDLC & Engineering Timeline</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">The sequential system development lifecycle phases</p>
        </div>

        <div className="relative border-l border-[var(--border)] ml-4 md:ml-6 pl-6 space-y-6">
          {TIMELINE_STEPS.map((step) => {
            const StepIcon = step.icon;
            const isHovered = hoveredStep === step.num;
            return (
              <div 
                key={step.num} 
                className="relative"
                onMouseEnter={() => setHoveredStep(step.num)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Node Dot */}
                <div className={`absolute -left-[35px] w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all duration-300 z-10
                  ${isHovered ? "bg-[var(--accent)] border-[var(--accent)] text-white scale-110 shadow-md" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]"}
                `}>
                  {step.num}
                </div>

                {/* Step Card */}
                <motion.div 
                  className={`p-5 rounded-2xl border transition-all duration-300 bg-[var(--bg-card)]
                    ${isHovered ? "border-[var(--accent)] shadow-md translate-x-1" : "border-[var(--border)] shadow-sm"}
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      <StepIcon size={16} />
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">{step.title}</h4>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Frontend Research Tabs */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">Frontend Research</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">How research influenced UI/UX decisions</p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex border-b border-[var(--border)] gap-2">
          {(["dyslexia", "adhd", "autism"] as const).map((tab) => {
            const isActive = activeResearchTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveResearchTab(tab)}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all relative capitalize
                  ${isActive ? "border-[var(--accent)] text-[var(--accent)] font-extrabold" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
                `}
              >
                {tab}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabUnderline" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" 
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeResearchTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-black text-[var(--text-primary)]">{RESEARCH_DATA[activeResearchTab].title}</h3>
                <p className="text-[11px] text-[var(--accent)] font-bold uppercase tracking-wider mt-1">Literature Foundation</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Research Finding</h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                      {RESEARCH_DATA[activeResearchTab].findings}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">UI Design Decision</h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                      {RESEARCH_DATA[activeResearchTab].decisions}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-[var(--bg-secondary)]/30 p-5 rounded-xl border border-[var(--border)]">
                  <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Implemented Features</h5>
                  <ul className="space-y-2">
                    {RESEARCH_DATA[activeResearchTab].features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-[var(--text-secondary)] font-semibold flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-0.5">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center gap-2">
                <FileText size={14} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)] italic">
                  Paper Reference: {RESEARCH_DATA[activeResearchTab].reference}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 3. Research Mapping Table */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">Research Mapping</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Mapping Literature findings to NeuroLearn code files</p>
        </div>

        <div className="overflow-x-auto bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                <th className="p-4 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-1/4">Research Finding</th>
                <th className="p-4 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-1/4">Actual Feature</th>
                <th className="p-4 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-1/4">Actual File Path</th>
                <th className="p-4 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-1/4">Expected Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {MAPPING_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-secondary)]/20 transition-colors">
                  <td className="p-4 text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">{row.finding}</td>
                  <td className="p-4 text-xs text-[var(--text-primary)] font-bold">{row.feature}</td>
                  <td className="p-4 text-xs text-[var(--accent)] font-semibold font-mono break-all">{row.path}</td>
                  <td className="p-4 text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Technology Stack Justification */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">Technology Stack Justification</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Engineering decisions for optimized performance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TECH_STACK.map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <div key={idx} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200">
                <div className="space-y-4">
                  <div className="p-2.5 bg-[var(--accent-glow)] text-[var(--accent)] rounded-xl inline-flex">
                    <CardIcon size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">{card.title}</h4>
                    <p className="text-xs font-extrabold text-[var(--accent)]">{card.tech}</p>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. System Architecture Flowchart */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">System Architecture</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Data processing & pipeline sequence flow</p>
        </div>

        <div className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm">
          {/* Vertical Visual Architecture Timeline for responsiveness */}
          <div className="max-w-xl mx-auto space-y-3 relative before:absolute before:inset-y-0 before:left-6 before:w-0.5 before:bg-[var(--border)] ml-2">
            {[
              { title: "User Interaction", desc: "User triggers profile choices, chat requests, or document uploads", icon: Brain },
              { title: "Authentication Check", desc: "JWT verification via HTTPOnly cookies inside API routers", icon: Clock },
              { title: "PDF Processing", desc: "pyPDF extracts text content stream from local file", icon: FileText },
              { title: "Adaptive Chunking", desc: "Splits raw text dynamically based on profile limits", icon: ListCollapse },
              { title: "Sentence Transformers", desc: "all-MiniLM-L6-v2 embeds text segments to vector float array", icon: Cpu },
              { title: "ChromaDB Collection", desc: "Metadata and vectors are indexed in a local directory collection", icon: Database },
              { title: "Groq RAG Retrieval", desc: "Query maps nearest vectors and formats Llama-3.1-8b-instant context", icon: Sparkles },
              { title: "Personalized Response", desc: "LLM renders summaries, simplified text, or adaptive quizzes", icon: ArrowRight },
              { title: "Dashboard Update", desc: "Next.js updates states, re-draws progress graphs, and credits XP", icon: CheckCircle2 }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="flex items-start gap-6 relative">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] z-10 flex-shrink-0">
                    <StepIcon size={18} />
                  </div>
                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">{step.title}</h5>
                    <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expected Outcomes Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">Expected Outcomes</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Anticipated benefits from the research-aligned implementation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-2">
            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-[var(--accent)]" /> Typographic and Spacing Legibility
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Adjusting line spacing to 1.8x+ and substituting weighted fonts (OpenDyslexic) reduces tracking errors, character flips, and vertical line distortion for dyslexic readers [5].
            </p>
          </div>
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-2">
            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <LineChart size={16} className="text-[var(--accent)]" /> Attentional Modulation Scaffolding
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Applying RAG-driven adaptive text simplification and a distraction-free Pomodoro workspace supports task planning, preventing cognitive exhaustion for ADHD learners [3], [8].
            </p>
          </div>
        </div>
      </section>

      {/* 6. Research References */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-wider">Research References</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Academic citations and bibliography cards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REFERENCES.map((ref) => (
            <div key={ref.id} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4 hover:border-[var(--accent)] transition-all duration-200">
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  IEEE [{ref.id}]
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">{ref.citation}</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-[var(--text-primary)] leading-normal">{ref.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] font-semibold">
                  Authors: {ref.authors} ({ref.year}) • {ref.publisher}
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Contribution to NeuroLearn</span>
                <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">
                  {ref.contribution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
