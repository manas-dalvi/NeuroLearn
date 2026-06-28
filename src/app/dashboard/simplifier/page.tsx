"use client";

import { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Check, 
  Volume2, 
  Copy, 
  Download, 
  Share2, 
  Lightbulb, 
  CheckCircle,
  Play,
  ArrowRight,
  TrendingUp,
  Brain,
  Zap,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { api, ContentChunk, LearningSession } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useRouter } from "next/navigation";

export default function SimplifierPage() {
  const { settings } = useAccessibility();
  const { token } = useAuth();
  const router = useRouter();
  const activeProfile = settings.activeProfile || "dyslexia";

  const [session, setSession] = useState<any | null>(null);
  const [chunks, setChunks] = useState<ContentChunk[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [inputText, setInputText] = useState("");
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [hasOutput, setHasOutput] = useState(false);
  const [activeTab, setActiveTab] = useState<"simplified" | "key-points" | "vocabulary" | "summary" | "assistant" | "quiz">("simplified");
  
  const [isCopied, setIsCopied] = useState(false);
  const [isReadAloudActive, setIsReadAloudActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // AI Quiz States
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quizNumQuestions, setQuizNumQuestions] = useState<number>(5);
  const [quizScope, setQuizScope] = useState<string>("all");
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(false);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [quizActive, setQuizActive] = useState<boolean>(false);

  // Quiz Part B States
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [reviewMode, setReviewMode] = useState<boolean>(false);

  // Summary RAG states
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

  const fetchQuizHistory = async () => {
    if (!token || !session?.id) return;
    setIsLoadingHistory(true);
    try {
      const history = await api.getQuizHistory(token, session.id);
      setQuizHistory(history);
    } catch (err) {
      console.error("Failed to load quiz history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "quiz" && !quizActive && session?.id) {
      fetchQuizHistory();
    }
  }, [activeTab, quizActive, session?.id, token]);

  const loadSummary = async () => {
    if (!token || !session?.id) return;
    setIsSummaryLoading(true);
    try {
      const res = await api.generateSummary(token, session.id);
      setSummaryText(res.summary);
    } catch (err) {
      console.error("Failed to load summary", err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "summary" && !summaryText && session?.id) {
      loadSummary();
    }
  }, [activeTab, session?.id, token]);

  const handleGenerateQuiz = async (customScope?: string, customDifficulty?: string, customCount?: number) => {
    if (!token || !session?.id) return;
    
    const scope = customScope !== undefined ? customScope : quizScope;
    const diff = customDifficulty !== undefined ? (customDifficulty as any) : quizDifficulty;
    const count = customCount !== undefined ? customCount : quizNumQuestions;
    
    setIsQuizLoading(true);
    setQuizActive(false);
    setQuizSubmitted(false);
    setReviewMode(false);
    setQuizResult(null);
    try {
      const res = await api.generateQuiz(token, {
        session_id: session.id,
        chunk_id: scope === "all" ? undefined : scope,
        difficulty: diff,
        num_questions: count,
        profile_type: activeProfile
      });
      setQuizAttemptId(res.quiz_attempt_id);
      setQuizQuestions(res.questions);
      setQuizAnswers({});
      setCurrentQuestionIdx(0);
      setQuizActive(true);
    } catch (err: any) {
      console.error("Failed to generate quiz", err);
      alert("Error generating quiz: " + err.message);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleStartQuizFromChunk = async (chunkId: string) => {
    setQuizScope(chunkId);
    setActiveTab("quiz");
    setQuizDifficulty("medium");
    setQuizNumQuestions(5);
    await handleGenerateQuiz(chunkId, "medium", 5);
  };

  const handleSubmitQuiz = async () => {
    if (!token || !quizAttemptId) return;
    setIsSubmittingQuiz(true);
    try {
      const answersList = Object.keys(quizAnswers).map(qid => ({
        question_id: qid,
        user_answer: quizAnswers[qid]
      }));
      const res = await api.submitQuiz(token, {
        quiz_attempt_id: quizAttemptId,
        answers: answersList
      });
      setQuizResult(res);
      setQuizSubmitted(true);
      await fetchQuizHistory(); // Refresh history immediately
      router.refresh(); // Invalidate dashboard cache for XP/goals updates
    } catch (err: any) {
      console.error("Failed to submit quiz", err);
      alert("Error submitting quiz: " + err.message);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleReviewAttempt = async (attemptId: string) => {
    if (!token) return;
    setIsQuizLoading(true);
    try {
      const res = await api.getQuizAttempt(token, attemptId);
      // Reconstruct questions structure from evaluations
      const reconstructedQuestions = res.evaluations.map(ev => ({
        id: ev.question_id,
        question_text: ev.question_text,
        question_type: ev.question_type as any,
        options: ev.options
      }));
      // Map user answers
      const answersMap: Record<string, string> = {};
      res.evaluations.forEach(ev => {
        answersMap[ev.question_id] = ev.user_answer;
      });

      setQuizQuestions(reconstructedQuestions);
      setQuizAnswers(answersMap);
      setQuizResult(res);
      setCurrentQuestionIdx(0);
      setQuizAttemptId(attemptId);
      setReviewMode(true);
      setQuizActive(true);
    } catch (err: any) {
      console.error("Failed to load attempt review", err);
      alert("Error loading attempt: " + err.message);
    } finally {
      setIsQuizLoading(false);
    }
  };



  // AI Study Assistant States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatScope, setChatScope] = useState<string>("all");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadChatHistory = async (sessionId: string) => {
    if (!token) return;
    try {
      const history = await api.getChatHistory(token, sessionId);
      setChatMessages(history);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  useEffect(() => {
    if (session?.id) {
      loadChatHistory(session.id);
    } else {
      setChatMessages([]);
    }
  }, [session?.id, token]);

  useEffect(() => {
    if (activeTab === "assistant") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading, activeTab]);

  const handleSendChat = async (text: string, customScope?: string) => {
    if (!token || !session?.id || !text.trim() || isChatLoading) return;

    const targetScope = customScope !== undefined ? customScope : chatScope;
    const targetChunkId = targetScope === "all" ? undefined : targetScope;

    const newUserMessage = {
      role: "user" as const,
      content: text,
      created_at: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await api.chatChunk(token, {
        session_id: session.id,
        chunk_id: targetChunkId,
        question: text,
        mode: "CHAT"
      });

      const newAssistantMessage = {
        role: "assistant" as const,
        content: response.answer,
        created_at: new Date().toISOString(),
        sources: response.sources,
        confidence_level: response.confidence_level,
        confidence_score: response.confidence_score
      };

      setChatMessages(prev => [...prev, newAssistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, {
        role: "assistant" as const,
        content: `Sorry, there was an error processing your request: ${err.message || "Unknown error"}`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const charLimit = 5000;



  const handleSimplify = async () => {
    if (!token) return;
    setIsSimplifying(true);
    setErrorMsg(null);
    try {
      let activeSession: LearningSession;
      
      if (selectedFileObj) {
        // Handle file upload
        const formData = new FormData();
        formData.append("file", selectedFileObj);
        formData.append("title", uploadedFile || "Uploaded Document");
        formData.append("profile_type", activeProfile);
        const uploadRes = await api.uploadContent(token, formData);
        
        // Fetch session chunks
        const chunksRes = await api.getChunks(token, uploadRes.session_id);
        setChunks(chunksRes.chunks);
        setSession({
          id: uploadRes.session_id,
          content_title: uploadedFile || "Uploaded Document"
        });
        localStorage.setItem("current_session_id", uploadRes.session_id);
        router.refresh(); // Invalidate dashboard cache
      } else {
        // Handle text simplification
        activeSession = await api.createSession(token, {
          content_title: "AI Simplified Reading",
          text: inputText,
          profile_type: activeProfile
        });
        setChunks(activeSession.chunks || []);
        setSession(activeSession);
        localStorage.setItem("current_session_id", activeSession.id);
        router.refresh(); // Invalidate dashboard cache
      }
      
      setHasOutput(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to simplify content");
    } finally {
      setIsSimplifying(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file.name);
      setSelectedFileObj(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file.name);
      setSelectedFileObj(file);
    }
  };

  // Copy helper
  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(getCopyableText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Web Speech Read Aloud helper
  const handleReadAloud = () => {
    if (typeof window === "undefined") return;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;

      if (isReadAloudActive) {
        synth.cancel();
        setIsReadAloudActive(false);
        return;
      }

      setIsReadAloudActive(true);
      const textToRead = getCopyableText();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      utterance.onend = () => setIsReadAloudActive(false);
      utterance.onerror = () => setIsReadAloudActive(false);
      
      synth.speak(utterance);
    } catch {
      setIsReadAloudActive(false);
    }
  };

  const getKeyPoints = (chunk: ContentChunk) => {
    const matches = chunk.simplified_text.match(/(?:^|\n)[•\-*]\s*(.+)/g);
    if (matches) {
      return matches.map(m => m.replace(/^[\n•\-*\s]+/g, "").replace(/\*\*/g, "").replace(/\*/g, "").trim());
    }
    return chunk.simplified_text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.replace(/\*\*/g, "").replace(/\*/g, "").trim())
      .filter(s => s.length > 8)
      .slice(0, 3);
  };

  const getVocab = (chunk: ContentChunk) => {
    const matches = chunk.simplified_text.match(/\*\*(.*?)\*\*/g);
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/\*\*/g, "") + ": Key concept.");
    }
    return ["Concept: Important terminology in reading."];
  };

  const getCopyableText = (): string => {
    if (chunks.length === 0) return "";
    switch (activeTab) {
      case "simplified":
        return chunks.map(c => c.simplified_text).join("\n\n");
      case "key-points":
        return chunks.flatMap(c => getKeyPoints(c)).join("\n");
      case "vocabulary":
        return chunks.flatMap(c => getVocab(c)).join("\n");
      case "summary":
        return chunks.map(c => c.simplified_text.substring(0, 150)).join("\n");
      case "assistant":
        return chatMessages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n");
      case "quiz":
        if (quizActive && quizQuestions[currentQuestionIdx]) {
          const q = quizQuestions[currentQuestionIdx];
          const optionsText = q.options ? `. Options are: ${q.options.join(", ")}` : "";
          return `${q.question_text}${optionsText}`;
        }
        return "Quiz Generator Configuration";
      default:
        return "";
    }
  };

  const highlightText = (text: string) => {
    const keywords = [
      "Hierarchical Temporal Memory", "HTM", "neocortex", "SDRs", 
      "Sparse Distributed Representations", "neurons", "predictions", "learning", "brain",
      "patterns", "predictive", "sparsity"
    ];
    let highlighted = text;
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, "gi");
      highlighted = highlighted.replace(regex, `<span class="important-word-highlight">$1</span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-16 animate-fade-in text-[var(--text-primary)]">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">AI Simplifier</h1>
          <p className="text-[var(--text-secondary)] font-semibold text-sm mt-1">
            Transform complex readings into clear learning chunks tailored automatically to your active profile.
          </p>
        </div>

        {/* Profile indicator */}
        <div className="flex items-center gap-2 bg-[var(--bg-card)] px-3.5 py-2 rounded-xl border border-[var(--border)] shadow-sm flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
          <span className="text-xs font-bold text-[var(--text-secondary)]">Active Profile:</span>
          <span className="text-xs font-black text-[var(--accent)] uppercase tracking-wider">{activeProfile}</span>
          <Link href="/dashboard/profile" className="text-[10px] font-bold text-[var(--accent)]/80 hover:text-[var(--accent)] underline pl-1.5 border-l border-[var(--border)]">
            Edit
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* Input Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Text Area */}
        <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col min-h-[300px] space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[var(--accent)] flex items-center gap-2">
              <FileText size={16} />
              <span>Paste Content</span>
            </label>
            <span className="text-[10px] font-bold text-[var(--text-secondary)]">
              {inputText.length} / {charLimit} characters
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value.slice(0, charLimit));
              setSelectedFileObj(null); // Clear selected file when typing text
              setUploadedFile(null);
            }}
            className="flex-1 w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-secondary)]/20 text-xs font-semibold outline-none focus:bg-[var(--bg-card)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none placeholder:text-[var(--text-secondary)]/50 transition-all leading-relaxed text-[var(--text-primary)]"
            placeholder="Paste your textbook passage, article, or lecture notes here..."
          />
        </div>

        {/* Upload Card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-[var(--bg-secondary)]/20 hover:bg-[var(--bg-secondary)]/40 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed transition-all cursor-pointer relative overflow-hidden group
            ${isDragging ? "border-[var(--accent)] bg-[var(--bg-secondary)]/50" : "border-[var(--border)]"}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".pdf,.txt" 
            className="hidden" 
          />

          <div className="w-14 h-14 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <Upload size={24} />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--text-primary)]">Upload File</p>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold leading-normal">
              Drag & drop or click to browse
            </p>
            <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
              PDF, TXT (max 25MB)
            </p>
          </div>

          {uploadedFile && (
            <div className="absolute inset-0 bg-[var(--bg-card)]/95 flex flex-col items-center justify-center p-4 gap-2">
              <CheckCircle size={28} className="text-emerald-500" />
              <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-full px-4">{uploadedFile}</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setSelectedFileObj(null);
                }}
                className="text-[10px] text-[var(--text-secondary)] font-bold hover:text-[var(--text-primary)] underline mt-1"
              >
                Clear file
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Action triggers */}
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Info size={16} />
          <span className="text-xs font-semibold">Will generate chunks matching active profile: <span className="font-bold text-[var(--accent)] uppercase">{activeProfile}</span></span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimplify}
            disabled={isSimplifying || (!inputText && !selectedFileObj)}
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSimplifying ? (
              <>Simplifying...</>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Simplify Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Adaptive Output Canvas */}
      {hasOutput && chunks.length > 0 && (
        <div className="space-y-6">
          
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {/* Output Tabs Header */}
            <div className="flex border-b border-[var(--border)] px-6 overflow-x-auto bg-[var(--bg-secondary)]/20 divide-x divide-[var(--border)]">
              {[
                { id: "simplified", label: "Simplified Content" },
                { id: "key-points", label: "Key Concepts" },
                { id: "vocabulary", label: "Vocabulary Support" },
                { id: "summary", label: "Summary Notes" },
                { id: "assistant", label: "AI Study Assistant" },
                { id: "quiz", label: "Quiz" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-5 font-bold text-xs transition-all relative whitespace-nowrap
                      ${isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}
                    `}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" 
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content Canvas */}
            <div className="p-6 md:p-8 min-h-[200px]">
              
              {/* TAB 1: Simplified Content */}
              {activeTab === "simplified" && (
                <div className="space-y-6 max-w-[850px] text-left">
                  {chunks.map((chunk, idx) => (
                    <div key={chunk.id} className="space-y-2 border-b border-[var(--border)] pb-4 last:border-b-0 last:pb-0">
                      <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Segment {idx + 1}</span>
                      <div className={`transition-all duration-300 leading-loose
                        ${activeProfile === "dyslexia" ? "font-serif text-lg leading-loose tracking-wider max-w-[65ch] text-justify" : "text-[var(--text-primary)] text-sm font-semibold"}
                      `}>
                        {activeProfile === "adhd" && (
                          <div className="p-4 bg-[var(--bg-secondary)]/30 border-l-4 border-[var(--accent)] rounded-r-xl">
                            <div className="text-sm font-semibold leading-relaxed">
                              <MarkdownRenderer content={chunk.simplified_text} enableHighlighting={true} />
                            </div>
                          </div>
                        )}
                        {activeProfile === "autism" && (
                          <div className="border border-[var(--border)] rounded-xl p-5 bg-[var(--bg-card)]">
                            <div className="text-sm font-semibold leading-normal">
                              <MarkdownRenderer content={chunk.simplified_text} enableHighlighting={false} />
                            </div>
                          </div>
                        )}
                        {activeProfile === "dyslexia" && (
                          <div className="text-sm font-bold leading-loose tracking-wide">
                            <MarkdownRenderer content={chunk.simplified_text} enableHighlighting={true} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: Key Concepts */}
              {activeTab === "key-points" && (
                <ul className="space-y-3 max-w-[800px] text-left">
                  {chunks.flatMap(getKeyPoints).map((point, idx) => (
                    <li key={idx} className="flex gap-3 items-start p-3 bg-[var(--bg-secondary)]/30 border border-[var(--border)] rounded-xl">
                      <div className="w-5 h-5 rounded-full bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-secondary)] leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* TAB 3: Vocabulary Support */}
              {activeTab === "vocabulary" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[800px] text-left">
                  {chunks.flatMap(getVocab).map((item, idx) => {
                    const [word, desc] = item.split(":");
                    return (
                      <div key={idx} className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-1">
                        <span className="text-xs font-black text-[var(--text-primary)]">{word}</span>
                        <p className="text-[11px] text-[var(--text-secondary)] font-semibold leading-relaxed">{desc || "Important term"}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: Summary Notes */}
              {activeTab === "summary" && (
                <div className="max-w-[800px] text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Document Summary</h4>
                    <button
                      onClick={loadSummary}
                      disabled={isSummaryLoading}
                      className="text-[10px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      🔄 Regenerate
                    </button>
                  </div>
                  {isSummaryLoading ? (
                    <div className="flex gap-2 items-center text-[var(--text-secondary)] font-bold text-xs p-3">
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>Generating summary...</span>
                    </div>
                  ) : summaryText ? (
                    <div className={`text-xs font-semibold leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap
                      ${activeProfile === "dyslexia" ? "leading-loose tracking-wide font-bold" : ""}
                    `}>
                      <MarkdownRenderer content={summaryText} enableHighlighting={true} />
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)]">No summary generated yet.</p>
                  )}
                </div>
              )}

              {/* TAB 5: AI Study Assistant */}
              {activeTab === "assistant" && (
                <div className="flex flex-col h-[550px] text-left">
                  {/* Chat Controls / Scope Selector */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[var(--bg-secondary)]/30 border border-[var(--border)] rounded-2xl mb-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap">Focus Scope:</span>
                      <select
                        value={chatScope}
                        onChange={(e) => setChatScope(e.target.value)}
                        className="w-full sm:w-auto bg-[var(--bg-card)] border border-[var(--border)] text-xs font-bold px-3 py-1.5 rounded-xl outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                      >
                        <option value="all">Entire Document</option>
                        {chunks.map((chunk, idx) => (
                          <option key={chunk.id} value={chunk.id}>
                            Segment {idx + 1} ({chunk.simplified_text.replace(/[#*•\-]/g, "").substring(0, 30)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className="text-[10px] font-bold bg-[var(--bg-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                        Adaptation: <span className="text-[var(--accent)] uppercase">{activeProfile}</span>
                      </span>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 border border-[var(--border)] rounded-2xl bg-[var(--bg-secondary)]/10 flex flex-col gap-4 mb-4 font-sans">
                    {chatMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent)]">
                          <Brain size={22} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-[var(--text-primary)]">Your Interactive Tutor</p>
                          <p className="text-xs text-[var(--text-secondary)] font-semibold max-w-[320px] leading-relaxed">
                            Ask questions about this reading. I'll explain concepts using your cognitive adaptation rules.
                          </p>
                        </div>
                        {/* Initial Prompt Chips */}
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                          <button
                            onClick={() => handleSendChat("Summarize the main takeaways from this document")}
                            className="text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-3 py-1.5 rounded-full transition-all"
                          >
                            📋 Summarize Takeaways
                          </button>
                          <button
                            onClick={() => handleSendChat("What are the key definitions I should know?")}
                            className="text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-3 py-1.5 rounded-full transition-all"
                          >
                            🔑 Key Definitions
                          </button>
                          <button
                            onClick={() => {
                              if (chatScope !== "all") {
                                handleStartQuizFromChunk(chatScope);
                              } else {
                                setQuizScope("all");
                                setActiveTab("quiz");
                              }
                            }}
                            className="text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-3 py-1.5 rounded-full transition-all"
                          >
                            🎯 Generate Quiz
                          </button>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[85%] ${isUser ? "self-end" : "self-start"}`}
                          >
                            <div
                              className={`p-4 rounded-2xl shadow-sm text-xs leading-relaxed font-semibold text-left
                                ${isUser 
                                  ? "bg-[var(--accent)] text-white rounded-tr-none" 
                                  : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none"
                                }
                              `}
                            >
                              <MarkdownRenderer content={msg.content} enableHighlighting={!isUser} />
                            </div>
                            
                            {/* Sources and Grounding indicators */}
                            {!isUser && (msg.sources?.length > 0 || msg.confidence_level) && (
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 px-1">
                                {msg.confidence_level && (
                                  <span 
                                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wide uppercase
                                      ${msg.confidence_level === "High" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : ""}
                                      ${msg.confidence_level === "Medium" ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : ""}
                                      ${msg.confidence_level === "Low" ? "bg-rose-500/10 border-rose-500/30 text-rose-600" : ""}
                                    `}
                                  >
                                    {msg.confidence_level} Grounding
                                  </span>
                                )}
                                {msg.sources?.map((src: any, sidx: number) => (
                                  <button
                                    key={sidx}
                                    onClick={() => {
                                      // Set tab to simplified segment
                                      setActiveTab("simplified");
                                    }}
                                    className="text-[9px] font-bold bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-2 py-0.5 rounded-full transition-all"
                                    title={`Index: ${src.chunk_index}`}
                                  >
                                    📖 Segment {src.chunk_index + 1}: {src.title}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Prompt Chips */}
                            {!isUser && idx === chatMessages.length - 1 && !isChatLoading && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                <button
                                  onClick={() => handleSendChat("Could you explain this simpler?")}
                                  className="text-[9px] font-bold bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-2.5 py-1 rounded-full transition-all shadow-sm"
                                >
                                  💡 Explain Simpler
                                </button>
                                <button
                                  onClick={() => handleSendChat("Could you give me a concrete example of this concept?")}
                                  className="text-[9px] font-bold bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-2.5 py-1 rounded-full transition-all shadow-sm"
                                >
                                  📝 Give Example
                                </button>
                                <button
                                  onClick={() => handleSendChat("What is a real-world analogy for this concept?")}
                                  className="text-[9px] font-bold bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-2.5 py-1 rounded-full transition-all shadow-sm"
                                >
                                  🚀 Real-world Analogy
                                </button>
                                <button
                                  onClick={() => {
                                    if (chatScope !== "all") {
                                      handleStartQuizFromChunk(chatScope);
                                    } else {
                                      setQuizScope("all");
                                      setActiveTab("quiz");
                                    }
                                  }}
                                  className="text-[9px] font-bold bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-2.5 py-1 rounded-full transition-all shadow-sm"
                                >
                                  🎯 Generate Quiz
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    {isChatLoading && (
                      <div className="flex gap-2 items-center text-[var(--text-secondary)] font-bold text-xs p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl self-start">
                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span>Tutor is thinking...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Box */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat(chatInput)}
                      placeholder="Ask your study question..."
                      disabled={isChatLoading}
                      className="flex-1 bg-[var(--bg-secondary)]/20 border border-[var(--border)] text-xs font-semibold px-4 py-3 rounded-xl outline-none focus:bg-[var(--bg-card)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-[var(--text-primary)]"
                    />
                    <button
                      onClick={() => handleSendChat(chatInput)}
                      disabled={isChatLoading || !chatInput.trim()}
                      className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm flex-shrink-0 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: AI Quiz */}
              {activeTab === "quiz" && (
                <div className="flex flex-col min-h-[450px] text-left">
                  {/* Exit Quiz / Back button if quiz is active */}
                  {quizActive && (
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          setQuizActive(false);
                          setQuizSubmitted(false);
                          setReviewMode(false);
                          setQuizResult(null);
                          setQuizQuestions([]);
                          setQuizAnswers({});
                        }}
                        className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                      >
                        ← Back to Configuration
                      </button>
                    </div>
                  )}

                  {/* 1. Loading State */}
                  {isQuizLoading && (
                    <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
                      <div className="w-10 h-10 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[var(--text-primary)]">Generating Your Quiz...</p>
                        <p className="text-xs text-[var(--text-secondary)] font-semibold">Creating profile-adapted questions using your reading context.</p>
                      </div>
                    </div>
                  )}

                  {/* 2. Configuration Panel */}
                  {!quizActive && !isQuizLoading && (
                    <div className="space-y-6 max-w-[650px] mx-auto w-full">
                      {/* Form Panel */}
                      <div className="space-y-6 p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm text-left w-full">
                        <div className="text-center space-y-2 border-b border-[var(--border)] pb-4">
                          <h3 className="font-bold text-base text-[var(--text-primary)]">AI Quiz Generator</h3>
                          <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">
                            Test your understanding with custom-generated quizzes tailored to your cognitive profile.
                          </p>
                        </div>

                        {/* Scope Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Quiz Scope</label>
                          <select
                            value={quizScope}
                            onChange={(e) => setQuizScope(e.target.value)}
                            className="w-full bg-[var(--bg-secondary)]/30 border border-[var(--border)] text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                          >
                            <option value="all">Entire Document</option>
                            {chunks.map((chunk, idx) => (
                              <option key={chunk.id} value={chunk.id}>
                                Segment {idx + 1} ({chunk.simplified_text.replace(/[#*•\-]/g, "").substring(0, 35)}...)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Difficulty Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Difficulty Level</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["easy", "medium", "hard"].map((diff) => (
                              <button
                                key={diff}
                                onClick={() => setQuizDifficulty(diff as any)}
                                className={`py-2 px-4 rounded-xl border text-xs font-bold text-center capitalize transition-all
                                  ${quizDifficulty === diff 
                                    ? "bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)] shadow-sm" 
                                    : "bg-[var(--bg-secondary)]/30 border border-[var(--border)] hover:bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)]"
                                  }
                                `}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Question Count Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Number of Questions</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[5, 10, 15].map((num) => (
                              <button
                                key={num}
                                onClick={() => setQuizNumQuestions(num)}
                                className={`py-2 px-4 rounded-xl border text-xs font-bold text-center transition-all
                                  ${quizNumQuestions === num 
                                    ? "bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)] shadow-sm" 
                                    : "bg-[var(--bg-secondary)]/30 border border-[var(--border)] hover:bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)]"
                                  }
                                `}
                              >
                                {num} Questions
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Start Button */}
                        <button
                          onClick={() => handleGenerateQuiz()}
                          disabled={isQuizLoading}
                          className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-transform active:scale-95 text-center mt-2"
                        >
                          🚀 Start Quiz
                        </button>
                      </div>

                      {/* Quiz History Panel */}
                      <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm text-left w-full space-y-4">
                        <h4 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                          <span>📋 Previous Quiz Attempts</span>
                          {isLoadingHistory && <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin inline-block animate-pulse" />}
                        </h4>
                        
                        {isLoadingHistory && quizHistory.length === 0 ? (
                          <p className="text-xs text-[var(--text-secondary)] font-semibold">Loading history...</p>
                        ) : quizHistory.length === 0 ? (
                          <p className="text-xs text-[var(--text-secondary)] font-semibold">No quiz attempts recorded yet for this session.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] font-bold">
                                  <th className="py-2.5">Attempt</th>
                                  <th className="py-2.5">Difficulty</th>
                                  <th className="py-2.5 text-center">Score</th>
                                  <th className="py-2.5 text-center">Accuracy</th>
                                  <th className="py-2.5 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]/60 font-semibold text-[var(--text-primary)]">
                                {quizHistory.map((item) => {
                                  const dateStrStr = item.created_at.endsWith("Z") || item.created_at.includes("+") ? item.created_at : item.created_at + "Z";
                                  const dateStr = new Date(dateStrStr.replace(" ", "T")).toLocaleDateString();
                                  return (
                                    <tr key={item.quiz_attempt_id} className="hover:bg-[var(--bg-secondary)]/10">
                                      <td className="py-3">
                                        <div>#{item.attempt_number}</div>
                                        <div className="text-[10px] text-[var(--text-secondary)]">{dateStr}</div>
                                      </td>
                                      <td className="py-3 capitalize">{item.difficulty}</td>
                                      <td className="py-3 text-center font-bold text-[var(--accent)]">{Math.round(item.score)}%</td>
                                      <td className="py-3 text-center">{Math.round(item.accuracy)}%</td>
                                      <td className="py-3 text-right">
                                        <button
                                          onClick={() => handleReviewAttempt(item.quiz_attempt_id)}
                                          className="text-[10px] font-bold bg-[var(--accent-glow)] border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-white px-2.5 py-1 rounded-lg transition-all"
                                        >
                                          Open Review
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Interactive Quiz Canvas */}
                  {quizActive && !isQuizLoading && quizQuestions.length > 0 && (() => {
                    const q = quizQuestions[currentQuestionIdx];
                    const isFirst = currentQuestionIdx === 0;
                    const isLast = currentQuestionIdx === quizQuestions.length - 1;
                    const currentAnswer = quizAnswers[q.id] || "";
                    const isGradedMode = quizSubmitted || reviewMode;

                    const handleAnswerSelect = (val: string) => {
                      if (isGradedMode) return;
                      setQuizAnswers(prev => ({ ...prev, [q.id]: val }));
                    };

                    return (
                      <div className="space-y-6 max-w-[600px] mx-auto w-full">
                        
                        {/* A. Graded Result Dashboard (rendered at the top of the canvas when graded) */}
                        {isGradedMode && currentQuestionIdx === 0 && quizResult && (
                          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full border-4 border-[var(--accent)] flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-black text-[var(--accent)]">{Math.round(quizResult.score)}%</span>
                              </div>
                              <div className="space-y-0.5 text-left">
                                <h4 className="font-bold text-sm text-[var(--text-primary)]">Quiz Completed!</h4>
                                <p className="text-xs text-[var(--text-secondary)] font-semibold">
                                  Accuracy: {Math.round(quizResult.accuracy)}% • {quizResult.correct_count}/{quizResult.total_questions} Correct
                                </p>
                              </div>
                            </div>
                            
                            {quizResult.xp_earned > 0 && (
                              <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-xl flex items-center gap-2 flex-shrink-0">
                                <Zap size={18} className="text-amber-500 fill-amber-500" />
                                <div className="text-left">
                                  <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">XP Earned</div>
                                  <div className="text-sm font-black text-amber-700">+{quizResult.xp_earned} XP</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* B. Active Question Canvas */}
                        <div className="space-y-6 p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm text-left w-full">
                          {/* Progress Header */}
                          <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
                            <span className="text-xs font-bold text-[var(--text-secondary)]">
                              Question {currentQuestionIdx + 1} of {quizQuestions.length}
                            </span>
                            <span className="text-[10px] font-black bg-[var(--accent-glow)] border border-[var(--accent)]/30 text-[var(--accent)] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {q.question_type.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* Question Text */}
                          <div className="space-y-2">
                            <p className={`text-sm font-bold text-[var(--text-primary)] leading-relaxed
                              ${activeProfile === "dyslexia" ? "tracking-wide font-bold" : ""}
                            `}>
                              {q.question_text}
                            </p>
                          </div>

                          {/* Options / Answer Input Box */}
                          <div className="space-y-3 pt-2">
                            {q.question_type === "multiple_choice" || q.question_type === "true_false" || q.question_type === "fill_in_the_blank" ? (
                              <div className="grid grid-cols-1 gap-2">
                                {q.options?.map((opt: string, oidx: number) => {
                                  const isSelected = currentAnswer === opt;
                                  
                                  // Evaluation highlights
                                  let buttonStyle = "bg-[var(--bg-secondary)]/10 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/20";
                                  let indicator = null;
                                  
                                  if (isGradedMode) {
                                    const evalItem = quizResult?.evaluations.find((e: any) => e.question_id === q.id);
                                    const isCorrectOpt = evalItem?.correct_answer === opt;
                                    const isUserWrongOpt = isSelected && !evalItem?.is_correct;
                                    
                                    if (isCorrectOpt) {
                                      buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 font-bold";
                                      indicator = <span className="text-[10px] font-bold text-emerald-600 ml-2">✓ Correct</span>;
                                    } else if (isUserWrongOpt) {
                                      buttonStyle = "bg-rose-500/10 border-rose-500 text-rose-700 font-bold";
                                      indicator = <span className="text-[10px] font-bold text-rose-600 ml-2">✗ Your Answer</span>;
                                    } else if (isSelected) {
                                      buttonStyle = "bg-[var(--border)] border-[var(--text-secondary)] text-[var(--text-secondary)]";
                                    }
                                  } else if (isSelected) {
                                    buttonStyle = "bg-[var(--accent)]/5 border-[var(--accent)] text-[var(--accent)] shadow-sm font-bold";
                                    indicator = <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0 ml-2" />;
                                  }

                                  return (
                                    <button
                                      key={oidx}
                                      onClick={() => handleAnswerSelect(opt)}
                                      disabled={isGradedMode}
                                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${buttonStyle}`}
                                    >
                                      <span>{opt}</span>
                                      {indicator}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : q.question_type === "short_answer" ? (
                              <div className="space-y-3">
                                <textarea
                                  value={currentAnswer}
                                  onChange={(e) => handleAnswerSelect(e.target.value)}
                                  disabled={isGradedMode}
                                  placeholder="Write your answer here..."
                                  className="w-full min-h-[120px] p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-secondary)]/10 text-xs font-semibold outline-none focus:bg-[var(--bg-card)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-[var(--text-primary)] leading-relaxed resize-none disabled:opacity-80"
                                />
                                {isGradedMode && (() => {
                                  const evalItem = quizResult?.evaluations.find((e: any) => e.question_id === q.id);
                                  return evalItem ? (
                                    <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 space-y-1.5">
                                      <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="text-slate-500">Grading Status</span>
                                        <span className={evalItem.is_correct ? "text-emerald-600" : "text-rose-600"}>
                                          {evalItem.is_correct ? "✓ Correct / Accepted" : "✗ Needs Improvement"}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-700 leading-normal font-semibold">
                                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Correct Criteria Keyword Guidance:</span>
                                        {evalItem.correct_answer}
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            ) : null}
                          </div>

                          {/* AI Explanation details */}
                          {isGradedMode && (() => {
                            const evalItem = quizResult?.evaluations.find((e: any) => e.question_id === q.id);
                            return evalItem?.explanation ? (
                              <div className="pt-4 border-t border-[var(--border)] space-y-1 text-left">
                                <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                                  <Lightbulb size={12} />
                                  <span>Tutor Explanation</span>
                                </span>
                                <div className={`text-xs text-[var(--text-secondary)] font-semibold leading-relaxed
                                  ${activeProfile === "dyslexia" ? "leading-loose tracking-wide font-bold" : ""}
                                `}>
                                  <MarkdownRenderer content={evalItem.explanation} enableHighlighting={true} />
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* Navigation Footer */}
                          <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                            <button
                              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                              disabled={isFirst}
                              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] disabled:opacity-50 text-[var(--text-primary)] font-bold text-xs rounded-xl hover:bg-[var(--bg-secondary)]/80 transition-all active:scale-95"
                            >
                              Previous
                            </button>
                            
                            <div className="flex gap-2">
                              {!isLast ? (
                                <button
                                  onClick={() => setCurrentQuestionIdx(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                                  className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95"
                                >
                                  Next
                                </button>
                              ) : !isGradedMode ? (
                                <button
                                  onClick={handleSubmitQuiz}
                                  disabled={isSubmittingQuiz}
                                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                                >
                                  {isSubmittingQuiz ? "Submitting..." : "Submit Quiz"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setQuizActive(false);
                                    setQuizSubmitted(false);
                                    setReviewMode(false);
                                    setQuizResult(null);
                                    setQuizQuestions([]);
                                    setQuizAnswers({});
                                  }}
                                  className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95"
                                >
                                  Close Review
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* C. Quick navigation bar at the bottom in results/review mode */}
                        {isGradedMode && (
                          <div className="flex flex-wrap items-center justify-center gap-1.5 p-3 bg-[var(--bg-secondary)]/20 border border-[var(--border)] rounded-xl">
                            {quizQuestions.map((ques, index) => {
                              const evalItem = quizResult?.evaluations.find((e: any) => e.question_id === ques.id);
                              const isCorrect = evalItem?.is_correct;
                              const isActive = index === currentQuestionIdx;
                              return (
                                <button
                                  key={ques.id}
                                  onClick={() => setCurrentQuestionIdx(index)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all
                                    ${isActive ? "ring-2 ring-[var(--accent)] ring-offset-1" : ""}
                                    ${isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}
                                  `}
                                >
                                  {index + 1}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-[var(--bg-secondary)]/30 border-t border-[var(--border)] flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-colors shadow-sm relative flex items-center justify-center"
                  title="Copy to Clipboard"
                >
                  {isCopied ? <span className="text-xs font-bold text-emerald-600 px-1">Copied!</span> : <Copy size={15} />}
                </button>
              </div>

               <button
                onClick={handleReadAloud}
                className={`flex items-center justify-center gap-1.5 w-28 px-4 py-2 rounded-xl text-[11px] font-bold transition-all border shadow-sm
                  ${isReadAloudActive 
                    ? "bg-rose-500 border-rose-500 text-white" 
                    : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--accent)] hover:border-[var(--accent)]"
                  }
                `}
              >
                <Volume2 size={14} />
                <span>{isReadAloudActive ? "Stop" : "Read Aloud"}</span>
              </button>
            </div>
          </div>

          {/* Generated Learning Chunks Section */}
          <section className="space-y-4">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-base">Generated Learning Chunks</h3>
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Divided micro-sections sized optimal for your focus profile.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chunks.map((chunk, idx) => {
                const words = chunk.word_count;
                const readingTime = Math.max(1, Math.round(words / 150));
                return (
                  <div key={chunk.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[200px] text-left">
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Chunk {idx + 1}</span>
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/50 px-2 py-0.5 rounded border border-[var(--border)] uppercase">
                          {chunk.level}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-normal font-semibold line-clamp-3">
                        {chunk.simplified_text.replace(/[•\-*]/g, "")}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-secondary)]">
                        <span>{words} words</span>
                        <span>{readingTime} min read</span>
                      </div>

                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={() => {
                              setChatScope(chunk.id);
                              setActiveTab("assistant");
                            }}
                            className="flex-1 bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] font-bold text-[9px] py-1.5 rounded-lg transition-all active:scale-95 text-center whitespace-nowrap"
                          >
                            💬 Ask AI
                          </button>
                          <button
                            onClick={() => {
                              setChatScope(chunk.id);
                              setActiveTab("assistant");
                              handleSendChat("Could you explain this segment again in a different way?", chunk.id);
                            }}
                            className="flex-1 bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] font-bold text-[9px] py-1.5 rounded-lg transition-all active:scale-95 text-center whitespace-nowrap"
                          >
                            🔄 Explain Again
                          </button>
                        </div>
                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={() => handleStartQuizFromChunk(chunk.id)}
                            className="flex-1 bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] font-bold text-[9px] py-1.5 rounded-lg transition-all active:scale-95 text-center whitespace-nowrap"
                          >
                            🎯 Take Quiz
                          </button>
                          <Link href={`/dashboard/focus?session_id=${session?.id}&chunk=${idx + 1}`} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-[9px] py-1.5 rounded-lg shadow-sm transition-transform active:scale-95 h-full">
                              <span>Focus</span>
                              <ArrowRight size={8} />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
