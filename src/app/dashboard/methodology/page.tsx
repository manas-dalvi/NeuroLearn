"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  ShieldAlert,
  Brain,
  Lightbulb,
  Clock,
  Target
} from "lucide-react";

export default function MethodologyPage() {
  const [activeResearchTab, setActiveResearchTab] = useState<"adhd" | "dyslexia" | "autism">("dyslexia");

  // 2. Frontend Research Tabs data
  const RESEARCH_DATA = {
    adhd: {
      title: "ADHD (Attention-Deficit/Hyperactivity Disorder)",
      findings: "We learned that students with ADHD often experience higher mental fatigue because online environments are filled with distracting visual details that compete for their attention [3].",
      decisions: "This led us to design a workspace that helps students stay focused on one task at a time. By using timeboxed intervals and progress indicators, we created a structure that supports focus and makes starting tasks much easier [8].",
      features: [
        "Focused study sessions with built-in Pomodoro support",
        "Learning content broken into smaller, manageable sections",
        "Interactive checklists to track tasks and maintain focus"
      ],
      reference: "Costa, C. (2025). Neurodivergent by Design: Using AI to Honor and Support Learning Differences. IntechOpen [8]."
    },
    dyslexia: {
      title: "Dyslexia",
      findings: "We found that traditional digital layouts often cause visual stress and reading fatigue for dyslexic students, making letters appear crowded or rotated. Bright white backgrounds can also cause a dazzling effect, making it harder to track lines of text [5].",
      decisions: "To address this, we integrated custom typography and background options that reduce visual crowding. By giving students control over font styles, sizing, and color overlays, we made the reading experience much smoother and more comfortable [5].",
      features: [
        "Easier-to-read font options",
        "Comfortable spacing controls",
        "Reading ruler and keyword highlighting"
      ],
      reference: "Khan, R. U., Oon, Y. B., Ul Haq, M. I., & Hajarah, S. (2018). Proposed user interface design criteria for children with dyslexia. IJET [5]."
    },
    autism: {
      title: "Autism Spectrum",
      findings: "Our research showed that autistic students often face sensory overload due to clutter, unpredictable layouts, and moving animations on screen, which can cause anxiety and cognitive exhaustion [6].",
      decisions: "We designed NeuroLearn to offer predictability and sensory calm. By allowing users to disable movement and select quiet, low-contrast themes, we created a sensory-friendly space that reduces visual anxiety [6].",
      features: [
        "Calmer study experience with reduced motion",
        "Sensory-friendly themes (Sepia Warm and Dark Mode)",
        "Vocabulary helper with simple, direct language support"
      ],
      reference: "Waisman, T. C., Alba, L. A., & Green, S. (2022). Barriers to Inclusive Learning for Autistic Individuals. Pediatrics [6]."
    }
  };

  // 3. Mapping Table
  const MAPPING_ROWS = [
    {
      finding: "Students with dyslexia read faster and make fewer errors when text uses clear, bottom-heavy typography that prevents letter confusion [5].",
      feature: "Easier-to-read font options and custom text sizing.",
      outcome: "Helps letters stand out clearly, making reading feel more natural and less tiring."
    },
    {
      finding: "Bright white screens can cause intense glare and eye fatigue, while softer, warmer background colors help improve reading comfort and speed [5].",
      feature: "Sensory themes including Sepia Warm and Dark Mode.",
      outcome: "Eases eye strain and makes it comfortable to study for longer periods."
    },
    {
      finding: "Diverse learners often face high mental fatigue when trying to process complex language and dense page layouts in digital environments [3].",
      feature: "AI Content Simplifier and content broken into smaller sections.",
      outcome: "Lowers reading fatigue by simplifying wording and spacing out the page layout."
    },
    {
      finding: "Erratic movement and visual clutter on webpages can trigger sensory overload and anxiety for autistic learners [6].",
      feature: "Calmer study experience with reduced motion and sensory themes.",
      outcome: "Reduces visual anxiety by keeping the interface stable and distraction-free."
    },
    {
      finding: "Students with ADHD often struggle with planning, organization, and maintaining focus in unstructured environments [8].",
      feature: "Interactive task checklists and Pomodoro focus store.",
      outcome: "Helps break down assignments into small, manageable steps and builds study habits."
    },
    {
      finding: "Reading along while listening to audio narration significantly improves word comprehension and memory retention for dyslexic students [5].",
      feature: "Text-to-speech audio reader built into the workspace.",
      outcome: "Strengthens word recognition and helps learners process information through both sight and sound."
    },
    {
      finding: "Having a clear visual line-guide helps autistic students stay focused on their current line and avoid losing their place [6].",
      feature: "Movable reading ruler and keyword highlighter.",
      outcome: "Shields readers from surrounding text distractions and keeps their place secure."
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
    <div className="space-y-16 max-w-[1200px] mx-auto pb-24 animate-fade-in text-[var(--text-primary)] px-4">

      {/* Premium Hero Section */}
      <section className="text-center space-y-8 py-16 md:py-24 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl mb-2 shadow-sm"
        >
          <BookOpen size={32} className="text-[var(--accent)]" />
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-[var(--text-primary)]"
          >
            The Story Behind <span className="text-[var(--accent)]">NeuroLearn</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed"
          >
            Curious how NeuroLearn became more than just an idea? Explore the research, design, and technology behind it.
          </motion.p>
        </div>

        {/* Abstract learning connections graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pt-6 flex justify-center"
        >
          <svg className="w-full max-w-[500px] h-[100px]" viewBox="0 0 500 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Connection Lines */}
            <path d="M 50 50 L 150 25 M 50 50 L 150 75 M 150 25 L 250 50 M 150 75 L 250 50 M 250 50 L 350 25 M 250 50 L 350 75 M 350 25 L 450 50 M 350 75 L 450 50" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 50 50 Q 150 -10 250 50 T 450 50" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.4" />

            {/* Animated Nodes */}
            <circle cx="50" cy="50" r="6" fill="var(--accent)" />
            <circle cx="50" cy="50" r="10" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.3" className="animate-pulse" />

            <circle cx="150" cy="25" r="5" fill="var(--text-secondary)" />
            <circle cx="150" cy="75" r="5" fill="var(--text-secondary)" />

            <circle cx="250" cy="50" r="7" fill="var(--accent)" />
            <circle cx="250" cy="50" r="12" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.3" className="animate-pulse" />

            <circle cx="350" cy="25" r="5" fill="var(--text-secondary)" />
            <circle cx="350" cy="75" r="5" fill="var(--text-secondary)" />

            <circle cx="450" cy="50" r="6" fill="var(--accent)" />
            <circle cx="450" cy="50" r="10" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.3" className="animate-pulse" />
          </svg>
        </motion.div>
      </section>

      {/* Narrative Section: Where It All Began & Why Learning Needed to Change */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl border border-[var(--border)] shadow-sm space-y-6 flex flex-col justify-center h-full"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)]">
              <Brain size={22} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Where It All Began
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
            {"NeuroLearn began as a mission to design a supportive digital space for students with dyslexia, ADHD, and autism. By replacing rigid, one-size-fits-all layouts with customizable text formats, sensory-friendly color controls, and focused study tools, we sought to build an adaptive platform from the ground up. Our journey started with a simple belief: online learning should conform to the student's needs, reducing reading stress and visual fatigue so they can focus on their goals."}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl border border-[var(--border)] shadow-sm space-y-6 flex flex-col justify-center h-full"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)]">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Why Traditional Learning Falls Short
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
            During our research, we discovered that many learning platforms follow a one-size-fits-all approach. While effective for some learners, this often leaves students with ADHD, dyslexia, autism, and other diverse learning needs without the support they require. This understanding became the starting point for NeuroLearn and inspired us to build a learning experience that adapts to every learner instead of expecting every learner to adapt.
          </p>
        </motion.div>
      </section>

      {/* Our Guiding Principles Section */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Designed with Purpose</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Three guiding ideas shaped every decision we made while building NeuroLearn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Understanding Every Learner",
              desc: "We began by studying how different learners experience reading, attention, and information processing. These insights helped us design an experience that feels comfortable, clear, and supportive from the very beginning.",
              icon: Target
            },
            {
              title: "Building Around Real Needs",
              desc: "Instead of creating a single learning experience for everyone, we focused on flexibility. Every feature was inspired by real educational challenges and designed to adapt to individual learning preferences.",
              icon: Lightbulb
            },
            {
              title: "Turning Research into Experience",
              desc: "Every study we explored became an opportunity to improve NeuroLearn. Our goal was to transform research findings into simple, practical features that make learning more engaging, accessible, and enjoyable.",
              icon: Clock
            }
          ].map((principle, idx) => {
            const IconComponent = principle.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-300 space-y-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center">
                  <IconComponent size={22} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-[var(--text-primary)]">{principle.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                    {principle.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Research Statistics Section */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Research at a Glance</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Key insights that shaped our journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { value: "5", label: "Research Papers Explored" },
            { value: "3", label: "Neurodivergent Profiles Studied" },
            { value: "9", label: "Research-Inspired Features" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] text-center space-y-2 shadow-sm"
            >
              <span className="text-5xl font-black text-[var(--accent)] tracking-tight block">
                {stat.value}
              </span>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Designing for Every Learner Section */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Designing for Every Mind</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Creating experiences that adapt to every learner.</p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto pb-px scrollbar-none">
          {(["dyslexia", "adhd", "autism"] as const).map((tab) => {
            const isActive = activeResearchTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveResearchTab(tab)}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all relative capitalize whitespace-nowrap
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
        <div className="bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl border border-[var(--border)] shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeResearchTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">{RESEARCH_DATA[activeResearchTab].title}</h3>
                <p className="text-xs text-[var(--accent)] font-bold uppercase tracking-wider mt-1">Literature Foundation</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">What We Learned</h5>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
                      {RESEARCH_DATA[activeResearchTab].findings}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">How It Shaped NeuroLearn</h5>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
                      {RESEARCH_DATA[activeResearchTab].decisions}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[var(--bg-secondary)]/30 p-6 md:p-8 rounded-2xl border border-[var(--border)] space-y-4">
                  <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">How NeuroLearn Helps</h5>
                  <ul className="space-y-3">
                    {RESEARCH_DATA[activeResearchTab].features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-[var(--text-secondary)] font-semibold flex items-start gap-2 leading-relaxed">
                        <span className="text-[var(--accent)] mt-0.5">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center gap-2">
                <FileText size={14} className="text-[var(--accent)] flex-shrink-0" />
                <span className="text-xs font-bold text-[var(--text-secondary)] italic leading-normal">
                  Paper Reference: {RESEARCH_DATA[activeResearchTab].reference}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* From Research to Reality Table Section */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">From Research to Features</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Turning evidence into meaningful experiences.</p>
        </div>

        <div className="overflow-x-auto bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-sm">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                <th className="p-5 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-[40%]">Research Insight</th>
                <th className="p-5 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-[30%]">NeuroLearn Feature</th>
                <th className="p-5 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider w-[30%]">User Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {MAPPING_ROWS.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[var(--bg-secondary)]/20 transition-colors duration-150
                    ${idx % 2 === 1 ? "bg-[var(--bg-secondary)]/10" : ""}
                  `}
                >
                  <td className="p-5 text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">{row.finding}</td>
                  <td className="p-5 text-xs text-[var(--text-primary)] font-bold leading-normal">{row.feature}</td>
                  <td className="p-5 text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {/* References Section - Restored Top-Right Concise Citation Label */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">The Research Behind NeuroLearn</h2>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">The evidence that guided every decision.</p>
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
