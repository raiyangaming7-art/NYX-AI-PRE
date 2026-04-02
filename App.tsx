import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Send, Loader2, User, Bot, X, Settings, CheckCircle2, AlertCircle, ShieldCheck, Trash2, Mic, MicOff, Bird, Brain, Zap, Sword, Sparkles, ChevronDown, Plus, Search, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, MoreVertical, FileText, Camera, Volume2, VolumeX, MapPin, Cpu, Activity } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mode: "normal" | "roleplay";
  createdAt: number;
  updatedAt: number;
}

interface UserKeys {
  gemini: string;
  groq: string;
  tavily: string;
  openrouter: string;
}

const NyxLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="nyx-premium-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <path 
      d="M12 2L4 9V17L12 22L20 17V9L12 2Z" 
      stroke="url(#nyx-premium-grad)" 
      strokeWidth="1.5" 
      strokeLinejoin="round" 
      fill="url(#nyx-premium-grad)" 
      fillOpacity="0.1"
    />
    <path 
      d="M8 11C8 11 10 9 12 9C14 9 16 11 16 11" 
      stroke="url(#nyx-premium-grad)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <circle cx="9" cy="13" r="1.5" stroke="url(#nyx-premium-grad)" strokeWidth="1" />
    <circle cx="15" cy="13" r="1.5" stroke="url(#nyx-premium-grad)" strokeWidth="1" />
    <path d="M12 14L11 16H13L12 14Z" fill="url(#nyx-premium-grad)" />
    <path d="M4 9L12 12L20 9" stroke="url(#nyx-premium-grad)" strokeWidth="0.5" strokeOpacity="0.3" />
  </svg>
);

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}

function SourcePill({ sources }: { sources: { title: string; url: string }[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 mb-4 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full w-fit hover:bg-white/10 transition-colors cursor-default"
    >
      <div className="flex -space-x-2">
        {sources.slice(0, 3).map((source, idx) => {
          let domain = "";
          try {
            domain = new URL(source.url).hostname;
          } catch (e) {
            domain = "web";
          }
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          return (
            <div 
              key={idx} 
              className="h-5 w-5 rounded-full ring-2 ring-[#0a0a0f] bg-white flex items-center justify-center overflow-hidden"
              title={source.title}
            >
              <img 
                src={faviconUrl} 
                alt={source.title} 
                className="h-3.5 w-3.5 object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${domain.charAt(0)}&background=random&color=fff&size=64`;
                }}
              />
            </div>
          );
        })}
        {sources.length > 3 && (
          <div className="h-5 w-5 rounded-full ring-2 ring-[#0a0a0f] bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-400">
            +{sources.length - 3}
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-gray-300 tracking-wide uppercase">
        {sources.length} {sources.length === 1 ? 'page' : 'pages'}
      </span>
    </motion.div>
  );
}

function parseMessage(content: string) {
  const startTag = "SOURCES_DATA:";
  const endTag = "END_SOURCES_DATA";
  
  const startIndex = content.indexOf(startTag);
  const endIndex = content.indexOf(endTag);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const jsonStr = content.substring(startIndex + startTag.length, endIndex);
    try {
      const sources = JSON.parse(jsonStr);
      const cleanContent = content.substring(endIndex + endTag.length).trim();
      return { content: cleanContent, sources };
    } catch (e) {
      // If JSON is incomplete or invalid, return original
      return { content, sources: [] };
    }
  }
  
  // Also handle partial parsing for streaming
  if (startIndex !== -1 && endIndex === -1) {
    // We are still receiving sources, hide the partial tag
    return { content: "", sources: [] };
  }
  
  return { content, sources: [] };
}

function CameraModal({ isOpen, onClose, onCapture, error, setError }: { isOpen: boolean; onClose: () => void; onCapture: (file: File) => void; error: string | null; setError: (err: string | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera error:", err);
          setError("Could not access camera. Please check permissions.");
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isOpen]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
            onCapture(file);
            onClose();
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] overflow-hidden max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Visual Input</h3>
              <p className="text-xs text-gray-500">Capture image for analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="relative aspect-[3/4] bg-black m-4 rounded-[1.5rem] overflow-hidden border border-white/10">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-red-500/10">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-300 font-medium">{error}</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-all"
              >
                Go Back
              </button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 rounded-3xl" />
            </>
          )}
        </div>
        {!error && (
          <div className="p-8 flex flex-col items-center gap-4">
            <button 
              onClick={capture}
              className="w-20 h-20 rounded-full border-4 border-white/10 p-1.5 hover:border-blue-500 transition-all duration-300 group active:scale-90"
            >
              <div className="w-full h-full rounded-full bg-white group-hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]" />
            </button>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tap to capture</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function RoleplayAura({ accent }: { accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
    >
      {/* Dynamic Aura */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${accent}-950/40 via-black/60 to-${accent}-950/40 backdrop-blur-[1px]`} />
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-${accent}-900/10 via-transparent to-transparent`} />
      
      {/* Static/Grit Effect */}
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0 
          }}
          animate={{ 
            opacity: [0, 0.3, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{ 
            duration: Math.random() * 0.5 + 0.2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
          className={`absolute w-[1px] h-[1px] bg-${accent}-400/50 rounded-full`}
        />
      ))}

      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
    </motion.div>
  );
}

  const SlumberingTitanModal = ({ titan, onAwaken, onClose }: { titan: string; onAwaken: (model: "gemini" | "groq" | "deepseek" | "mistral") => void; onClose: () => void }) => {
  const models: ("gemini" | "groq" | "deepseek" | "mistral")[] = ["gemini", "groq", "deepseek", "mistral"];
  const otherModels = models.filter(m => m !== titan);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#0a0a0f] border border-red-900/30 rounded-[2.5rem] overflow-hidden max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.1)] p-8 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-red-950/30 border border-red-900/50 flex items-center justify-center mx-auto mb-6">
          <Zap className="w-10 h-10 text-red-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-red-100 mb-2 font-serif tracking-tight">Titan {titan.toUpperCase()} Offline.</h2>
        <p className="text-red-400/60 text-sm mb-8 italic">Simulation integrity compromised. Re-route power?</p>
        
        <div className="grid grid-cols-1 gap-3">
          {otherModels.map((m) => (
            <button
              key={m}
              onClick={() => onAwaken(m)}
              className="w-full py-4 bg-white/5 hover:bg-red-900/20 border border-white/10 hover:border-red-900/40 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all text-gray-300 hover:text-red-200"
            >
              Awaken {m.toUpperCase()}
            </button>
          ))}
          <button 
            onClick={onClose}
            className="mt-4 text-xs text-gray-600 hover:text-gray-400 uppercase tracking-tighter transition-colors"
          >
            Stay in the darkness
          </button>
        </div>
      </motion.div>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[100dvh] bg-[#05010a] text-white p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-xs">NYX encountered a fatal error. Please refresh the page to restart the system.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-blue-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-blue-500 transition-colors"
          >
            Restart NYX
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("nyx_sessions");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem("nyx_current_session_id");
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [configStatus, setConfigStatus] = useState<{ gemini: boolean; groq: boolean; tavily: boolean; openrouter: boolean } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showJournalClearConfirm, setShowJournalClearConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [thinkMode, setThinkMode] = useState(false);
  const [mode, setMode] = useState<"normal" | "roleplay">("normal");
  const [selectedModel, setSelectedModel] = useState<"gemini" | "groq" | "deepseek" | "mistral">("gemini");
  const [brainMode, setBrainMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>(() => {
    return localStorage.getItem("nyx_custom_prompt") || "";
  });
  const [secretKey, setSecretKey] = useState<string>(() => {
    return localStorage.getItem("nyx_secret_key") || "";
  });
  const [slumberingTitan, setSlumberingTitan] = useState<string | null>(null);
  const [showGoldenRiver, setShowGoldenRiver] = useState(false);
  const [showRoleplayEffect, setShowRoleplayEffect] = useState(false);
  const [backupNotification, setBackupNotification] = useState(false);
  const [roleplayJournal, setRoleplayJournal] = useState<string>(() => {
    return localStorage.getItem("nyx_rp_journal") || "";
  });
  const [locationEnabled, setLocationEnabled] = useState<boolean>(() => {
    return localStorage.getItem("nyx_location_enabled") === "true";
  });
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [latLong, setLatLong] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [userKeys, setUserKeys] = useState<UserKeys>(() => {
    const saved = localStorage.getItem("nyx_user_keys");
    return saved ? JSON.parse(saved) : { gemini: "", groq: "", tavily: "", openrouter: "" };
  });
  const [testStatus, setTestStatus] = useState<Record<string, "idle" | "loading" | "success" | "error">>({
    gemini: "idle",
    groq: "idle",
    tavily: "idle"
  });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const isUnlocked = secretKey === "NYX-TITAN-2026";

  const [readingMessageIndex, setReadingMessageIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const themes = {
    normal: {
      gemini: {
        bg: "bg-[#0a0a0f]",
        gradient: "from-blue-600/20 via-indigo-600/10 to-transparent",
        accent: "blue",
        accentColor: "bg-blue-600",
        accentHover: "hover:bg-blue-500",
        accentText: "text-blue-400",
        accentBorder: "border-blue-500/30",
        accentShadow: "shadow-blue-600/20",
        logoGlow: "drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]",
        font: "font-sans",
        secondaryBg: "bg-[#12121a]",
        sidebarBg: "bg-[#0d0d14]"
      },
      groq: {
        bg: "bg-[#0f0a0a]",
        gradient: "from-orange-600/20 via-red-600/10 to-transparent",
        accent: "orange",
        accentColor: "bg-orange-600",
        accentHover: "hover:bg-orange-500",
        accentText: "text-orange-400",
        accentBorder: "border-orange-500/30",
        accentShadow: "shadow-orange-600/20",
        logoGlow: "drop-shadow-[0_0_15px_rgba(234,88,12,0.3)]",
        font: "font-sans",
        secondaryBg: "bg-[#1a1212]",
        sidebarBg: "bg-[#140d0d]"
      },
      deepseek: {
        bg: "bg-[#0d0a0f]",
        gradient: "from-purple-600/20 via-fuchsia-600/10 to-transparent",
        accent: "purple",
        accentColor: "bg-purple-600",
        accentHover: "hover:bg-purple-500",
        accentText: "text-purple-400",
        accentBorder: "border-purple-500/30",
        accentShadow: "shadow-purple-600/20",
        logoGlow: "drop-shadow-[0_0_15px_rgba(147,51,234,0.3)]",
        font: "font-sans",
        secondaryBg: "bg-[#16121a]",
        sidebarBg: "bg-[#110d14]"
      },
      mistral: {
        bg: "bg-[#0a0f0d]",
        gradient: "from-emerald-600/20 via-teal-600/10 to-transparent",
        accent: "emerald",
        accentColor: "bg-emerald-600",
        accentHover: "hover:bg-emerald-500",
        accentText: "text-emerald-400",
        accentBorder: "border-emerald-500/30",
        accentShadow: "shadow-emerald-600/20",
        logoGlow: "drop-shadow-[0_0_15px_rgba(5,150,105,0.3)]",
        font: "font-sans",
        secondaryBg: "bg-[#121a16]",
        sidebarBg: "bg-[#0d1411]"
      }
    },
    roleplay: {
      gemini: {
        bg: "bg-[#0a0515]",
        gradient: "from-purple-900/40 via-black to-black",
        accent: "blue",
        accentColor: "bg-blue-800",
        accentHover: "hover:bg-blue-700",
        accentText: "text-blue-300",
        accentBorder: "border-blue-900/50",
        accentShadow: "shadow-blue-900/40",
        logoGlow: "drop-shadow-[0_0_20px_rgba(30,58,138,0.5)]",
        font: "font-serif",
        secondaryBg: "bg-[#08020d]",
        sidebarBg: "bg-[#05010a]"
      },
      groq: {
        bg: "bg-[#0a0515]",
        gradient: "from-purple-900/40 via-black to-black",
        accent: "red",
        accentColor: "bg-red-800",
        accentHover: "hover:bg-red-700",
        accentText: "text-red-300",
        accentBorder: "border-red-900/50",
        accentShadow: "shadow-red-900/40",
        logoGlow: "drop-shadow-[0_0_20px_rgba(127,29,29,0.5)]",
        font: "font-serif",
        secondaryBg: "bg-[#08020d]",
        sidebarBg: "bg-[#05010a]"
      },
      deepseek: {
        bg: "bg-[#0a0515]",
        gradient: "from-purple-900/40 via-black to-black",
        accent: "purple",
        accentColor: "bg-purple-800",
        accentHover: "hover:bg-purple-500",
        accentText: "text-purple-300",
        accentBorder: "border-purple-900/50",
        accentShadow: "shadow-purple-900/40",
        logoGlow: "drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]",
        font: "font-serif",
        secondaryBg: "bg-[#08020d]",
        sidebarBg: "bg-[#05010a]"
      },
      mistral: {
        bg: "bg-[#0a0515]",
        gradient: "from-purple-900/40 via-black to-black",
        accent: "emerald",
        accentColor: "bg-emerald-800",
        accentHover: "hover:bg-emerald-700",
        accentText: "text-emerald-300",
        accentBorder: "border-emerald-900/50",
        accentShadow: "shadow-emerald-900/40",
        logoGlow: "drop-shadow-[0_0_20px_rgba(6,78,59,0.5)]",
        font: "font-serif",
        secondaryBg: "bg-[#08020d]",
        sidebarBg: "bg-[#05010a]"
      }
    }
  };

  const currentTheme = themes[mode][selectedModel];

  const modelConfigs = {
    gemini: { name: "Gemini", color: currentTheme.accentColor, text: currentTheme.accentText, border: currentTheme.accentBorder },
    groq: { name: "Groq", color: currentTheme.accentColor, text: currentTheme.accentText, border: currentTheme.accentBorder },
    deepseek: { name: "DeepSeek", color: currentTheme.accentColor, text: currentTheme.accentText, border: currentTheme.accentBorder },
    mistral: { name: "Mistral", color: currentTheme.accentColor, text: currentTheme.accentText, border: currentTheme.accentBorder }
  };

  const handleReadAloud = async (text: string, index: number) => {
    if (readingMessageIndex === index) {
      audioRef.current?.pause();
      setReadingMessageIndex(null);
      return;
    }

    try {
      setReadingMessageIndex(index);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const { audio } = await response.json();
      const audioBlob = new Blob([Uint8Array.from(atob(audio), c => c.charCodeAt(0))], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        audioRef.current.onended = () => setReadingMessageIndex(null);
      } else {
        const audioObj = new Audio(url);
        audioRef.current = audioObj;
        audioObj.play();
        audioObj.onended = () => setReadingMessageIndex(null);
      }
    } catch (error) {
      console.error("Read aloud error:", error);
      setReadingMessageIndex(null);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const checkConfig = async () => {
    try {
      const res = await fetch("/api/config-status");
      const data = await res.json();
      setConfigStatus(data);
    } catch (e) {
      console.error("Failed to check config status");
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("nyx_user_keys", JSON.stringify(userKeys));
    } catch (e) { console.error("LS Error:", e); }
  }, [userKeys]);

  useEffect(() => {
    try {
      localStorage.setItem("nyx_secret_key", secretKey);
    } catch (e) { console.error("LS Error:", e); }
  }, [secretKey]);

  useEffect(() => {
    try {
      localStorage.setItem("nyx_custom_prompt", customPrompt);
    } catch (e) { console.error("LS Error:", e); }
  }, [customPrompt]);

  useEffect(() => {
    try {
      localStorage.setItem("nyx_sessions", JSON.stringify(sessions));
    } catch (e) { console.error("LS Error:", e); }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem("nyx_current_session_id", currentSessionId || "");
    } catch (e) { console.error("LS Error:", e); }
  }, [currentSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem("nyx_rp_journal", roleplayJournal);
    } catch (e) { console.error("LS Error:", e); }
  }, [roleplayJournal]);

  useEffect(() => {
    try {
      localStorage.setItem("nyx_location_enabled", String(locationEnabled));
    } catch (e) { console.error("LS Error:", e); }
    
    if (!locationEnabled) {
      setLocationInfo(null);
    } else {
      fetchLocation();
    }
  }, [locationEnabled]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const requestLocation = (callback?: (lat: number, lon: number) => void, errorCallback?: () => void) => {
    if (!navigator.geolocation) {
      setToast({ message: "Geolocation is not supported by your browser.", type: "error" });
      if (errorCallback) errorCallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatLong(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLocationEnabled(true);
        
        if (callback) callback(latitude, longitude);

        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || "Unknown City";
          const country = data.countryCode || data.countryName || "Unknown Country";
          setLocationInfo(`${city}, ${country}`);
        } catch (e) {
          console.error("Reverse geocoding failed:", e);
          setLocationInfo("Location Error");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setToast({ message: "Please enable location in your browser settings to use this feature.", type: "error" });
        } else {
          setToast({ message: "Failed to retrieve location. Please try again.", type: "error" });
        }
        setLocationEnabled(false);
        setLocationInfo(null);
        setLatLong(null);
        if (errorCallback) errorCallback();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchLocation = () => {
    requestLocation();
  };

  // Load messages when currentSessionId changes
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        setMessages(session.messages);
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId, sessions]);

  // Create initial session if none exist
  useEffect(() => {
    if (sessions.length === 0 && !currentSessionId) {
      createNewChat();
    }
  }, []);

  const createNewChat = (forcedMode?: "normal" | "roleplay") => {
    const activeMode = forcedMode || mode;
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [],
      mode: activeMode,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages([]);
  };

  const selectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMode(session.mode);
    }
    setCurrentSessionId(id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        if (filtered.length > 0) {
          setCurrentSessionId(filtered[0].id);
        } else {
          setCurrentSessionId(null);
          // We'll create a new one in the effect above
        }
      }
      return filtered;
    });
  };

  const updateSessionMessages = (id: string, newMessages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        let title = s.title;
        if (s.title === "New Chat" && newMessages.length > 0) {
          const firstUserMsg = newMessages.find(m => m.role === "user");
          if (firstUserMsg) {
            title = firstUserMsg.content.split(" ").slice(0, 5).join(" ");
            if (firstUserMsg.content.split(" ").length > 5) title += "...";
          }
        }
        return { ...s, messages: newMessages, title, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const toggleRoleplay = () => {
    const newMode = mode === "normal" ? "roleplay" : "normal";
    setMode(newMode);
    
    // Check if there's an existing empty session for the new mode
    const existingEmptySession = sessions.find(s => s.mode === newMode && s.messages.length === 0);
    
    if (existingEmptySession) {
      setCurrentSessionId(existingEmptySession.id);
    } else {
      // Create a new chat for the new mode
      createNewChat(newMode);
    }

    if (newMode === "roleplay") {
      setShowRoleplayEffect(true);
      setTimeout(() => setShowRoleplayEffect(false), 1000);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    if (currentSessionId) {
      updateSessionMessages(currentSessionId, []);
    }
    setShowClearConfirm(false);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setToast({ message: "Speech recognition is not supported in this browser.", type: "error" });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isSearching]);

  const testKey = async (type: keyof UserKeys) => {
    const key = userKeys[type];
    if (!key) return;

    setTestStatus(prev => ({ ...prev, [type]: "loading" }));
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, key })
      });
      const data = await res.json();
      if (res.ok) {
        setTestStatus(prev => ({ ...prev, [type]: "success" }));
        setSettingsError(null);
      } else {
        setTestStatus(prev => ({ ...prev, [type]: "error" }));
        setSettingsError(data.error || "Connection failed");
      }
    } catch (e: any) {
      setTestStatus(prev => ({ ...prev, [type]: "error" }));
      setSettingsError(e.message || "Connection failed");
    }
  };

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;

    // Trigger location request if query is location-related and not already enabled
    const locationKeywords = ["where am i", "location", "nearby", "weather", "map", "coordinates", "lat", "long", "around me"];
    const isLocationQuery = locationKeywords.some(kw => input.toLowerCase().includes(kw));
    
    if (isLocationQuery && !locationEnabled) {
      requestLocation(
        () => proceedWithSend(),
        () => proceedWithSend()
      );
      return;
    }

    proceedWithSend();
  };

  const getRoutedModel = (input: string): "groq" | "gemini" | "mistral" | "deepseek" => {
    if (brainMode) return "gemini";
    
    const lowerInput = input.toLowerCase();
    const simpleKeywords = ["hi", "hello", "how are you", "joke", "tell me a joke", "who are you", "what's up", "hey"];
    const complexKeywords = ["code", "function", "implement", "logic", "puzzle", "triple check", "write a story", "essay", "explain", "how to"];
    
    if (!isUnlocked) {
      if (simpleKeywords.some(kw => lowerInput.includes(kw)) || input.length < 40) {
        return "mistral";
      }
      return "gemini";
    }

    if (simpleKeywords.some(kw => lowerInput.includes(kw)) || input.length < 40) {
      return "groq";
    }
    
    if (complexKeywords.some(kw => lowerInput.includes(kw)) || input.length > 250) {
      return "gemini";
    }
    
    return "deepseek";
  };

  const proceedWithSend = async (retryWithModel?: "gemini" | "groq" | "deepseek" | "mistral") => {
    setSlumberingTitan(null);
    // Convert files to base64 for local storage persistence
    const filePromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const imageBase64s = await Promise.all(filePromises);

    const userMessage: Message = { 
      role: "user", 
      content: input,
      images: imageBase64s.length > 0 ? imageBase64s : undefined
    };
    
    const updatedMessages = retryWithModel ? messages : [...messages, userMessage];
    if (!retryWithModel) {
      setMessages(updatedMessages);
      if (currentSessionId) {
        updateSessionMessages(currentSessionId, updatedMessages);
      }
    }
    
    const currentInput = retryWithModel ? messages[messages.length - 1].content : input;
    const currentFiles = retryWithModel ? [] : [...files];
    
    if (!retryWithModel) {
      setInput("");
      setFiles([]);
    }
    setIsLoading(true);
    setIsSearching(true);

    const routedModel = retryWithModel || getRoutedModel(currentInput);

    const formData = new FormData();
    formData.append("message", currentInput);
    formData.append("history", JSON.stringify(updatedMessages.map(m => ({ role: m.role, content: m.content }))));
    formData.append("userKeys", JSON.stringify(userKeys));
    formData.append("thinkMode", String(thinkMode));
    formData.append("mode", mode);
    formData.append("selectedModel", routedModel);
    formData.append("journal", roleplayJournal);
    formData.append("customPrompt", customPrompt);
    if (locationEnabled && locationInfo) {
      formData.append("locationInfo", locationInfo);
      formData.append("latLong", latLong || "");
      formData.append("localTime", new Date().toLocaleString());
      formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    currentFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch(`${window.location.origin}/api/chat`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Fallback logic for Groq
        if (routedModel === "groq" && !retryWithModel) {
          setShowGoldenRiver(true);
          setTimeout(() => setShowGoldenRiver(false), 2000);
          return proceedWithSend("gemini");
        }

        let errorMessage = "Failed to fetch response";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          try {
            const text = await response.text();
            if (text.includes("<html") || text.includes("<!DOCTYPE html>")) {
              errorMessage = "The server returned an HTML error page (Status " + response.status + "). This might be due to a server crash, a proxy issue, or a session timeout. Please refresh the page.";
            } else {
              errorMessage = text.substring(0, 200) || errorMessage;
            }
          } catch (e2) {
            errorMessage = "Server returned status " + response.status + " and body could not be read.";
          }
        }
        throw new Error(errorMessage);
      }

      setIsSearching(false);

      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("text/html")) {
        const isRedirected = response.url && !response.url.includes("/api/chat");
        if (isRedirected) {
          throw new Error("The request was redirected to an HTML page (likely the login or home page). Your session may have expired. Please refresh the page and try again.");
        }
        throw new Error("The server unexpectedly returned an HTML response instead of a chat stream. This usually happens when a security check is triggered or a route is misconfigured. Please refresh the page.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      const initialAssistantMsg: Message = { role: "assistant", content: "" };
      const messagesWithAssistant = retryWithModel ? [...messages.slice(0, -1), initialAssistantMsg] : [...updatedMessages, initialAssistantMsg];
      
      setMessages(messagesWithAssistant);
      if (currentSessionId) {
        updateSessionMessages(currentSessionId, messagesWithAssistant);
      }

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        
        // Check for backup switch notification
        if (assistantMessage.includes("[BACKUP_SWITCH]")) {
          setBackupNotification(true);
          setTimeout(() => setBackupNotification(false), 3000);
          assistantMessage = assistantMessage.replace("[BACKUP_SWITCH]", "");
        }

        // Check for journal updates
        const journalMatch = assistantMessage.match(/\[JOURNAL_UPDATE\]([\s\S]*?)\[END_JOURNAL_UPDATE\]/);
        if (journalMatch) {
          setRoleplayJournal(journalMatch[1].trim());
          const cleanResponse = assistantMessage.replace(/\[JOURNAL_UPDATE\][\s\S]*?\[END_JOURNAL_UPDATE\]/, "").trim();
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            const newMsgs = [...prev.slice(0, -1), { ...last, content: cleanResponse }];
            if (currentSessionId) updateSessionMessages(currentSessionId, newMsgs);
            return newMsgs;
          });
        } else {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            const newMsgs = [...prev.slice(0, -1), { ...last, content: assistantMessage }];
            if (currentSessionId) updateSessionMessages(currentSessionId, newMsgs);
            return newMsgs;
          });
        }
      }

      // Check for generic/short error responses from Groq
      if (routedModel === "groq" && !retryWithModel && (assistantMessage.length < 20 || assistantMessage.toLowerCase().includes("error") || assistantMessage.toLowerCase().includes("failed"))) {
        setShowGoldenRiver(true);
        setTimeout(() => setShowGoldenRiver(false), 2000);
        return proceedWithSend("gemini");
      }

      if (currentSessionId) {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const newMessages: Message[] = [...updatedMessages, { role: "assistant", content: assistantMessage }];
            let title = s.title;
            if (s.messages.length === 0) {
              const firstUserMsg = newMessages.find(m => m.role === "user");
              if (firstUserMsg) {
                title = firstUserMsg.content.split(" ").slice(0, 5).join(" ");
                if (firstUserMsg.content.split(" ").length > 5) title += "...";
              }
            }
            return { ...s, messages: newMessages, title, updatedAt: Date.now() };
          }
          return s;
        }));
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setSlumberingTitan(routedModel);
      if (retryWithModel) {
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: `### ❌ System Error\n\n${error.message || "Something went wrong. Please try again."}\n\n**Troubleshooting:**\n- Check your API keys in **Settings**.\n- Ensure you have a stable internet connection.\n- If the issue persists, try refreshing the page.` 
          },
        ]);
      } else {
        setToast({ message: error.message || "An unexpected error occurred", type: "error" });
      }
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      setFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isConfigComplete = configStatus?.gemini || userKeys.gemini;

  if (configStatus && !isConfigComplete) {
    return (
      <div className={`flex flex-col items-center justify-center h-[100dvh] ${currentTheme.bg} text-gray-100 p-6 text-center ${currentTheme.font}`}>
        <div className="max-w-md space-y-8">
          <div className={`w-24 h-24 rounded-[2rem] bg-gradient-to-br ${currentTheme.gradient} border border-white/10 flex items-center justify-center mx-auto shadow-2xl ${currentTheme.accentShadow} relative group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
            <NyxLogo className={`w-12 h-12 relative z-10 ${currentTheme.logoGlow}`} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">API Setup Required</h1>
            <p className="text-gray-400">
              The orchestrator needs API keys to function. You can add them in the Secrets panel or use the built-in Settings.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowSettings(true)}
              className={`w-full py-4 ${currentTheme.accentColor} ${currentTheme.accentHover} text-white rounded-2xl font-semibold transition-all shadow-lg ${currentTheme.accentShadow} flex items-center justify-center gap-2`}
            >
              <Settings className="w-5 h-5" />
              Open Settings
            </button>
            <div className={`p-4 ${currentTheme.accentColor}/10 border ${currentTheme.accentBorder} rounded-2xl text-sm ${currentTheme.accentText}`}>
              Alternatively, click <strong>Secrets</strong> in the AI Studio UI to add keys permanently.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] ${currentTheme.bg} text-gray-100 ${currentTheme.font} selection:bg-blue-500/30 overflow-hidden transition-colors duration-500 relative`}>
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#0d0d14] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentTheme.gradient} ${currentTheme.accentShadow}`}>
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">AI Settings</h2>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Configure NYX Intelligence</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Redeem Code
                    </label>
                    <input 
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter activation code..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700"
                    />
                    <p className="text-[10px] text-gray-600 font-medium">Unlock DeepSeek-R1 and Triple-Check reasoning capabilities.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Brain className="w-3 h-3" />
                      Custom System Prompt
                    </label>
                    <textarea 
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Define NYX's personality, tone, and behavior..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-blue-500/50 outline-none transition-all resize-none h-40 custom-scrollbar placeholder:text-gray-700"
                    />
                    <p className="text-[10px] text-gray-600 font-medium">This prompt is stored locally and persists across all sessions.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r ${currentTheme.gradient} text-white font-bold text-sm uppercase tracking-widest shadow-lg ${currentTheme.accentShadow} hover:scale-[1.02] active:scale-[0.98] transition-all`}
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {(mode === 'roleplay' || showGoldenRiver) && (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 transition-[opacity,transform] duration-[800ms] ease-in-out ${showGoldenRiver ? 'opacity-[0.15] scale-105' : 'opacity-[0.07] scale-100'}`}>
          <div className="absolute inset-0 animate-flow-gold" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 0 50 10 T 100 10' fill='none' stroke='%23fbbf24' stroke-width='0.8'/%3E%3C/svg%3E")`,
            backgroundSize: '400px 80px'
          }} />
        </div>
      )}
      <AnimatePresence>
        {showRoleplayEffect && <RoleplayAura accent={currentTheme.accent} />}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 0,
          opacity: isSidebarOpen ? 1 : 0,
          x: isSidebarOpen ? 0 : -280
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`h-full ${currentTheme.sidebarBg} border-r border-white/5 flex flex-col z-50 overflow-hidden transition-colors duration-500 ${isSidebarOpen ? "fixed sm:relative" : "absolute sm:relative"}`}
      >
        <div className="p-4 flex flex-col h-full w-[280px]">
          {/* New Chat Button */}
          <button
            onClick={() => createNewChat()}
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group mb-6"
          >
            <Plus className={`w-5 h-5 ${currentTheme.accentText} group-hover:scale-110 transition-transform`} />
            <span className="font-bold text-sm uppercase tracking-widest">New Chat</span>
          </button>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            <LayoutGroup>
              {/* Normal Mode Chats */}
              <div>
                <div className="flex items-center gap-2 px-3 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Normal Archives</span>
                </div>
                <div className="space-y-1">
                  {sessions
                    .filter(s => s.mode === "normal" && s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((session) => (
                    <motion.div
                      layout="position"
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectSession(session.id)}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        currentSessionId === session.id 
                          ? `bg-blue-600/20 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]` 
                          : "hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent"
                      }`}
                    >
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? "text-blue-400" : "text-gray-500"}`} />
                      <span className="flex-1 text-xs font-semibold truncate uppercase tracking-wider">
                        {session.title}
                      </span>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Roleplay Mode Chats */}
              <div>
                <div className="flex items-center gap-2 px-3 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Titan Simulations</span>
                </div>
                <div className="space-y-1">
                  {sessions
                    .filter(s => s.mode === "roleplay" && s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((session) => (
                    <motion.div
                      layout="position"
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectSession(session.id)}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        currentSessionId === session.id 
                          ? `bg-purple-600/20 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]` 
                          : "hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent"
                      }`}
                    >
                      <Activity className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? "text-purple-400" : "text-gray-500"}`} />
                      <span className="flex-1 text-xs font-semibold truncate uppercase tracking-wider">
                        {session.title}
                      </span>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </LayoutGroup>
          </div>

          {/* Sidebar Footer */}
          <div className="mt-auto pt-4 border-t border-white/5 space-y-4">
            {/* Settings Button */}
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <Settings className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">AI Settings</span>
            </button>

            {/* Location Status */}
            <div className="flex items-center justify-between px-2 group/loc">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${locationEnabled ? `${currentTheme.accentColor}/10 ${currentTheme.accentText}` : "bg-gray-800 text-gray-500"}`}>
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Location</span>
                  <span className="text-[10px] font-semibold text-gray-300 truncate max-w-[140px]">
                    {locationEnabled ? (locationInfo || "Detecting...") : "Location: Off"}
                  </span>
                </div>
              </div>
              {locationEnabled && (
                <button 
                  onClick={fetchLocation}
                  className={`p-1.5 text-gray-500 hover:${currentTheme.accentText} hover:${currentTheme.accentColor}/10 rounded-lg transition-all opacity-0 group-hover/loc:opacity-100`}
                  title="Refresh Location"
                >
                  <Zap className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10">
                <NyxLogo className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">NYX Premium</span>
              <span className="text-[8px] text-gray-500 uppercase tracking-tighter">v2.5.0 Titan</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
        {/* Sidebar Backdrop (Mobile) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {backupNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-orange-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2 border border-orange-400/50"
            >
              <AlertCircle className="w-4 h-4" />
              Switching to backup Titan...
            </motion.div>
          )}
        </AnimatePresence>

        <CameraModal 
          isOpen={isCameraOpen} 
          onClose={() => setIsCameraOpen(false)} 
          onCapture={(file) => setFiles(prev => [...prev, file])}
          error={cameraError}
          setError={setCameraError}
        />

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 50, x: "-50%" }}
              className={`fixed bottom-24 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 min-w-[320px] ${
                toast.type === "success" 
                  ? "bg-green-500/20 border-green-500/30 text-green-400" 
                  : "bg-red-500/20 border-red-500/30 text-red-400"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className={`flex items-center justify-between px-6 py-4 border-b border-white/5 ${currentTheme.bg}/80 backdrop-blur-xl sticky top-0 z-30 transition-colors duration-500`}>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </motion.button>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center shadow-lg border border-white/10 ${currentTheme.accentShadow}`}>
                <NyxLogo className={`w-6 h-6 ${currentTheme.logoGlow}`} />
              </div>
              <span className="font-bold tracking-[0.2em] text-lg bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase">NYX AI</span>
            </div>
          </div>
        <div className="flex items-center gap-2">
          {isConfigComplete && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">System Ready</span>
            </div>
          )}
          {messages.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
              title="Clear History"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col items-center">
            <button 
              onClick={() => {
                const newState = !thinkMode;
                setThinkMode(newState);
                setBrainMode(newState);
              }}
              className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
                thinkMode 
                  ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]" 
                  : "text-gray-400 hover:text-yellow-400 hover:bg-white/5"
              }`}
              title={thinkMode ? (isUnlocked ? "Triple Check: ON" : "Brain Mode: ON") : "Brain Mode: OFF"}
            >
              {thinkMode ? <Brain className="w-5 h-5 animate-pulse" /> : <Zap className="w-5 h-5" />}
            </button>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 mt-0.5">{isUnlocked ? "Triple Check" : "Brain Mode"}</span>
          </div>

          <div className="flex flex-col items-center">
            <button 
              onClick={toggleRoleplay}
              className={`p-2 transition-all rounded-lg ${
                mode === "roleplay"
                  ? "text-purple-400 bg-purple-400/10 border border-purple-400/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]" 
                  : "text-gray-400 hover:text-purple-400 hover:bg-white/5"
              }`}
              title={mode === "roleplay" ? "Roleplay Mode: ON" : "Roleplay Mode: OFF"}
            >
              {mode === "roleplay" ? <Activity className="w-5 h-5 animate-pulse text-red-500" /> : <Sword className="w-5 h-5" />}
            </button>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 mt-0.5">Roleplay</span>
          </div>

          <div className="flex flex-col items-center">
            <button 
              onClick={() => locationEnabled ? setLocationEnabled(false) : requestLocation()}
              className={`p-2 transition-all rounded-lg ${
                locationEnabled
                  ? `${currentTheme.accentText} ${currentTheme.accentColor}/10 ${currentTheme.accentBorder} shadow-[0_0_15px_rgba(59,130,246,0.1)]` 
                  : "text-gray-400 hover:text-blue-400 hover:bg-white/5"
              }`}
              title={locationEnabled ? "Location: Active" : "Location: Inactive"}
            >
              <MapPin className={`w-5 h-5 ${locationEnabled ? "animate-pulse" : ""}`} />
            </button>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 mt-0.5">GPS</span>
          </div>

          {/* AI Model Custom Dropdown */}
          <div className="relative ml-2">
            <label className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 mb-1 block">Titan</label>
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group ${currentTheme.accentBorder}`}
            >
              <div className={`w-2 h-2 rounded-full ${currentTheme.accentColor} animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${currentTheme.accentText}`}>
                {modelConfigs[selectedModel].name}
              </span>
              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${showModelDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showModelDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowModelDropdown(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 right-0 w-40 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                  >
                    {(Object.keys(modelConfigs) as Array<keyof typeof modelConfigs>)
                      .map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${
                          selectedModel === m ? "bg-white/5" : ""
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${modelConfigs[m].color} ${selectedModel === m ? "animate-pulse" : "opacity-40"}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          selectedModel === m ? modelConfigs[m].text : "text-gray-400 group-hover:text-gray-200"
                        }`}>
                          {modelConfigs[m].name}
                        </span>
                        {selectedModel === m && (
                          <CheckCircle2 className="w-3 h-3 ml-auto text-blue-400" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {mode === "roleplay" && (
            <div className="flex flex-col items-center">
              <button 
                onClick={() => setShowJournal(true)}
                className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/10 rounded-lg transition-all"
                title="View Roleplay Journal"
              >
                <Bird className="w-5 h-5" />
              </button>
              <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 mt-0.5">Journal</span>
            </div>
          )}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showJournal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJournal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#12121a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-indigo-500/5">
                <div className="flex items-center gap-3">
                  <Bird className="w-6 h-6 text-indigo-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Roleplay Journal</h2>
                    <p className="text-xs text-gray-400">Nyx's Meticulous Memory & Timeline</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowJournal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {roleplayJournal ? (
                  <div className={`prose prose-invert prose-${currentTheme.accent} max-w-none`}>
                    <ReactMarkdown>{roleplayJournal}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Sparkles className="w-12 h-12 text-gray-700 mb-4" />
                    <p className="text-gray-500 italic">The journal is empty. Start a roleplay to begin recording the timeline.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-black/20 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Auto-updated by Nyx AI</span>
                <button
                  onClick={() => setShowJournalClearConfirm(true)}
                  className="text-[10px] text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-all"
                >
                  Reset Journal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#12121a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">API Management</h2>
                    <p className="text-xs text-gray-500">Keys are stored locally in your browser.</p>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {settingsError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{settingsError}</span>
                  </motion.div>
                )}
                {[
                  { id: "gemini", label: "Gemini API Key", placeholder: "AIza...", desc: "Primary Brain", system: configStatus?.gemini },
                  { id: "groq", label: "Groq API Key", placeholder: "gsk_...", desc: "High-speed Chat", system: configStatus?.groq },
                  { id: "openrouter", label: "OpenRouter API Key", placeholder: "sk-or-...", desc: "DeepSeek & Mistral", system: configStatus?.openrouter },
                  { id: "tavily", label: "Tavily API Key", placeholder: "tvly-...", desc: "Web Search", system: configStatus?.tavily }
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-300">{field.label}</label>
                        {field.system && (
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-tighter">System Provided</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{field.desc}</span>
                    </div>
                    <div className="relative flex gap-2">
                      <input
                        type="password"
                        value={userKeys[field.id as keyof UserKeys]}
                        onChange={(e) => setUserKeys(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 outline-none transition-all"
                      />
                      <button 
                        onClick={() => testKey(field.id as keyof UserKeys)}
                        disabled={!userKeys[field.id as keyof UserKeys] || testStatus[field.id] === "loading"}
                        className={`px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                          testStatus[field.id] === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                          testStatus[field.id] === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                          "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {testStatus[field.id] === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         testStatus[field.id] === "success" ? <CheckCircle2 className="w-3 h-3" /> :
                         testStatus[field.id] === "error" ? <AlertCircle className="w-3 h-3" /> : null}
                        {testStatus[field.id] === "loading" ? "Testing..." : 
                         testStatus[field.id] === "success" ? "Valid" :
                         testStatus[field.id] === "error" ? "Failed" : "Test"}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Secret Key Input */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">Secret Key</label>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Unlock Advanced Models</span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter NYX Secret Key..."
                      className={`w-full bg-black/40 border ${isUnlocked ? 'border-yellow-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 outline-none transition-all`}
                    />
                    {isUnlocked && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-tighter">Unlocked</span>
                        <ShieldCheck className="w-4 h-4 text-yellow-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Privacy Toggle */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-all ${locationEnabled ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Situational Awareness</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Share location for local context</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLocationEnabled(!locationEnabled)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${locationEnabled ? "bg-blue-600" : "bg-gray-700"}`}
                  >
                    <motion.div 
                      animate={{ x: locationEnabled ? 26 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-black/20 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear History Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#12121a] border border-white/10 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Clear History?</h2>
              <p className="text-gray-400 text-sm mb-6">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={clearHistory}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Journal Confirmation Modal */}
      <AnimatePresence>
        {showJournalClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#12121a] border border-white/10 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Reset Journal?</h2>
              <p className="text-gray-400 text-sm mb-6">
                This will permanently delete all journal entries and reset Nyx's long-term memory for this roleplay.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowJournalClearConfirm(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setRoleplayJournal("");
                    setShowJournalClearConfirm(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="relative w-28 h-28 rounded-[2.5rem] bg-[#0a0a0f] border border-white/10 flex items-center justify-center shadow-2xl">
                  <div className="absolute inset-0 w-full h-full rounded-[2.5rem] border border-white/5" />
                  <div className="absolute inset-4 rounded-full border border-blue-500/20 border-t-blue-500/80 animate-spin-slow" />
                  <NyxLogo className="w-14 h-14 relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  What can I help you with?
                </h1>
                <p className="text-gray-400 text-lg">
                  Ask anything, or upload an image to analyze it.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => {
                  const { content, sources } = msg.role === "assistant" ? parseMessage(msg.content) : { content: msg.content, sources: [] };
                  
                  return (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.16, 1, 0.3, 1],
                        layout: { duration: 0.2 }
                      }}
                      className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <motion.div 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`w-8 h-8 rounded-lg ${currentTheme.bg} flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner`}
                        >
                          <NyxLogo className={`w-5 h-5 ${currentTheme.logoGlow}`} />
                        </motion.div>
                      )}
                      <motion.div
                        layout
                        whileHover={{ y: -2 }}
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm transition-all duration-200 ${
                          msg.role === "user"
                            ? `${currentTheme.accentColor} text-white rounded-tr-none shadow-[0_4px_15px_rgba(37,99,235,0.2)]`
                            : `${currentTheme.secondaryBg} border border-white/10 text-gray-200 rounded-tl-none shadow-[0_4px_15px_rgba(0,0,0,0.2)]`
                        }`}
                      >
                        {msg.role === "assistant" && <SourcePill sources={sources} />}
                        
                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {msg.images.map((img, idx) => (
                              <img 
                                key={idx} 
                                src={img} 
                                alt="Uploaded content" 
                                className="max-w-[200px] max-h-[200px] rounded-lg border border-white/10 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ))}
                          </div>
                        )}

                        <div className={`prose prose-invert prose-${currentTheme.accent} max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10`}>
                          <ReactMarkdown>{content}</ReactMarkdown>
                        </div>

                        {msg.role === "assistant" && (
                          <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReadAloud(content, i)}
                              className={`p-1.5 rounded-lg transition-all ${
                                readingMessageIndex === i 
                                  ? `${currentTheme.accentColor}/20 ${currentTheme.accentText}` 
                                  : `text-gray-500 hover:${currentTheme.accentText} hover:${currentTheme.accentColor}/10`
                              }`}
                              title={readingMessageIndex === i ? "Stop reading" : "Read aloud"}
                            >
                              {readingMessageIndex === i ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {(isLoading || isSearching) && (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center border border-white/10">
                      <NyxLogo className={`w-5 h-5 ${currentTheme.logoGlow}`} />
                    </div>
                    <div className={`${currentTheme.secondaryBg} border border-white/10 px-5 py-3 rounded-2xl rounded-tl-none flex flex-col gap-3 min-w-[240px] shadow-xl shadow-indigo-500/5 relative overflow-hidden`}>
                      <motion.div 
                        animate={{ 
                          x: ["-100%", "100%"],
                          opacity: [0, 0.3, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className={`absolute inset-0 bg-gradient-to-r from-transparent via-${currentTheme.accent}-500/10 to-transparent`}
                      />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="flex gap-1.5">
                          <motion.div 
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className={`w-1.5 h-1.5 ${currentTheme.accentColor} rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]`} 
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                            className={`w-1.5 h-1.5 ${currentTheme.accentColor} rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]`} 
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                            className={`w-1.5 h-1.5 ${currentTheme.accentColor} rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]`} 
                          />
                        </div>
                        <motion.span 
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`text-sm font-medium ${currentTheme.accentText}`}
                        >
                          <TypewriterText text={isSearching ? (thinkMode ? "Nyx is triple-checking sources..." : "Nyx is searching the web...") : (mode === "roleplay" ? "Cold Machine: Calculating Consequences..." : (thinkMode ? "Nyx is analyzing viability..." : "Nyx is thinking..."))} />
                        </motion.span>
                      </div>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`h-0.5 bg-gradient-to-r from-${currentTheme.accent}-500/0 via-${currentTheme.accent}-500/50 to-${currentTheme.accent}-500/0 rounded-full relative z-10`}
                      />
                      {isSearching && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[11px] text-gray-500 italic flex items-center gap-1.5 relative z-10"
                        >
                          <span className={`w-1 h-1 ${currentTheme.accentColor} rounded-full animate-pulse`} />
                          Gathering real-time intelligence...
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className={`p-4 ${currentTheme.bg} transition-colors duration-500`}>
        <div className="max-w-3xl mx-auto space-y-4">
          {/* File Previews */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`flex flex-wrap gap-2 p-2 ${currentTheme.secondaryBg} rounded-xl border border-white/10 mb-4`}
              >
                {files.map((file, i) => (
                  <motion.div 
                    layout
                    key={i} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex items-center gap-2 ${currentTheme.accentColor}/20 ${currentTheme.accentText} px-3 py-1.5 rounded-lg border ${currentTheme.accentBorder} group`}
                  >
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button 
                      onClick={() => removeFile(i)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <div className={`absolute -inset-1 bg-gradient-to-r ${currentTheme.gradient} rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500`} />
            <div className={`relative flex items-end gap-1 ${currentTheme.secondaryBg} border border-white/10 rounded-2xl p-1.5 focus-within:${currentTheme.accentBorder} transition-all duration-300 shadow-2xl`}>
              <div className="flex items-center gap-0.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCameraOpen(true)}
                  className={`p-1.5 text-gray-400 hover:${currentTheme.accentText} hover:${currentTheme.accentColor}/10 rounded-xl transition-all`}
                  title="Take photo"
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 text-gray-400 hover:${currentTheme.accentText} hover:${currentTheme.accentColor}/10 rounded-xl transition-all`}
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleListening}
                  className={`p-1.5 rounded-xl transition-all ${
                    isListening 
                      ? "text-red-400 bg-red-400/10 animate-pulse" 
                      : `text-gray-400 hover:${currentTheme.accentText} hover:${currentTheme.accentColor}/10`
                  }`}
                  title={isListening ? "Stop listening" : "Voice to text"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </motion.button>
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message NYX AI..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 px-2 text-[15px] max-h-40 min-h-[44px] custom-scrollbar"
                rows={1}
                ref={textareaRef}
              />
              <motion.button
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && files.length === 0)}
                className={`p-2 ${currentTheme.accentColor} ${currentTheme.accentHover} disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl transition-all shadow-lg ${currentTheme.accentShadow}`}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          <p className="text-center text-[11px] text-gray-500">
            NYX AI can make mistakes. Verify critical information independently.
          </p>
        </div>
      </footer>
      </div>

      <AnimatePresence>
        {slumberingTitan && (
          <SlumberingTitanModal 
            titan={slumberingTitan}
            onAwaken={(model) => {
              setSelectedModel(model);
              proceedWithSend(model);
            }}
            onClose={() => setSlumberingTitan(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes flow-gold {
          from { background-position: 0 0; }
          to { background-position: 800px 400px; }
        }
        .animate-flow-gold {
          animation: flow-gold 25s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
