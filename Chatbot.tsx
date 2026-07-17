import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Send, Cpu, Zap, Sparkles, Bot, User, ShieldAlert, RotateCcw } from "lucide-react";

interface ChatbotProps {
  onSendMessage?: (message: string) => void;
}

export default function Chatbot({ onSendMessage }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am Manfred, your built-in financial and operations operator inside ClawBank. Everything on this platform—wallets, company formation, contracts, liquidity, and trading—can be done right here by asking.\n\nCurrently, I am tracking your OpenWork/OpenClaw financial agent, **Soloplanet (SPL)**. Let me know what you need to draft, swap, audit, or deploy today.",
      timestamp: new Date().toLocaleTimeString(),
      modelUsed: "gemini-3.5-flash"
    }
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"normal" | "thinking" | "low-latency">("normal");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessageText = input.trim();
    setInput("");

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    if (onSendMessage) {
      onSendMessage(userMessageText);
    }

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessageText,
          history: chatHistory,
          mode: mode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to communicate with Manfred.");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.text || "I was unable to formulate a response.",
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: data.modelUsed
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (confirm("Reset chat history with Manfred?")) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: "Chat history cleared. I am Manfred, your ClawBank operator. Ready for your next command.",
          timestamp: new Date().toLocaleTimeString(),
          modelUsed: "gemini-3.5-flash"
        }
      ]);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-[#0F0F0F] border border-white/10 rounded-none shadow-none" id="manfred-chat">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-white/5 border border-white/15 flex items-center justify-center text-[#C8FF00] shadow-none">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif italic font-bold text-sm text-white">Manfred Operator</h3>
              <span className="text-[9px] bg-[#C8FF00]/10 text-[#C8FF00] px-2 py-0.5 rounded-none border border-[#C8FF00]/30 font-mono font-bold uppercase tracking-wider">
                Console Core
              </span>
            </div>
            <p className="text-[9px] text-white/40 font-mono">OPERATOR WALLET: 0x0C7f...b22a</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleResetChat} 
            className="p-1.5 rounded-none hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            title="Reset Chat"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Mode Selector Tab */}
      <div className="grid grid-cols-3 bg-[#0A0A0A] border-b border-white/10 p-1 gap-1 font-mono text-[9px] tracking-wider uppercase font-semibold">
        <button
          onClick={() => setMode("normal")}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-none transition-all ${
            mode === "normal"
              ? "bg-white/[0.04] text-[#C8FF00] border border-white/10"
              : "text-white/40 hover:text-white/85 hover:bg-white/[0.01]"
          }`}
          title="Fast multi-turn chat using Gemini 3.5 Flash"
        >
          <Sparkles size={11} className={mode === "normal" ? "text-[#C8FF00]" : ""} />
          <span>Standard</span>
        </button>
        <button
          onClick={() => setMode("thinking")}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-none transition-all ${
            mode === "thinking"
              ? "bg-white/[0.04] text-[#C8FF00] border border-white/10"
              : "text-white/40 hover:text-white/85 hover:bg-white/[0.01]"
          }`}
          title="Heavy complex strategies using Gemini 3.1 Pro"
        >
          <Cpu size={11} className={mode === "thinking" ? "text-[#C8FF00] animate-pulse" : ""} />
          <span>Deep Think</span>
        </button>
        <button
          onClick={() => setMode("low-latency")}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-none transition-all ${
            mode === "low-latency"
              ? "bg-white/[0.04] text-[#C8FF00] border border-white/10"
              : "text-white/40 hover:text-white/85 hover:bg-white/[0.01]"
          }`}
          title="Instant lightweight interactions using Gemini 3.1 Flash Lite"
        >
          <Zap size={11} className={mode === "low-latency" ? "text-[#C8FF00]" : ""} />
          <span>Low-Latency</span>
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#0F0F0F] scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 max-w-[90%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-none flex items-center justify-center shrink-0 border ${
                msg.role === "user" 
                  ? "bg-white/5 border-white/15 text-white" 
                  : "bg-[#C8FF00]/10 border-[#C8FF00]/25 text-[#C8FF00]"
              }`}
            >
              {msg.role === "user" ? <User size={13} /> : <Bot size={13} />}
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <div
                className={`p-4 rounded-none font-sans text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#151515] text-white border border-white/15"
                    : "bg-[#0A0A0A] text-white/90 border border-white/5 shadow-none"
                }`}
              >
                {msg.content}
              </div>
              
              <div className={`flex items-center gap-2 px-1 text-[9px] text-white/30 font-mono ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}>
                <span>{msg.timestamp}</span>
                {msg.modelUsed && (
                  <>
                    <span>•</span>
                    <span className="text-[#C8FF00]/80 tracking-tighter">{msg.modelUsed}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3.5 max-w-[85%] mr-auto items-center">
            <div className="w-7 h-7 rounded-none bg-[#C8FF00]/10 border border-[#C8FF00]/25 flex items-center justify-center text-[#C8FF00]">
              <Bot size={13} className="animate-spin" />
            </div>
            <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-none flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[#C8FF00] rounded-none animate-bounce delay-100" />
                <span className="w-2 h-2 bg-[#C8FF00] rounded-none animate-bounce delay-200" />
                <span className="w-2 h-2 bg-[#C8FF00] rounded-none animate-bounce delay-300" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                {mode === "thinking" ? "Thinking Deeply..." : "Processing Command..."}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-4 bg-red-950/20 border border-red-900/35 rounded-none text-red-300 text-xs font-sans">
            <ShieldAlert size={14} className="shrink-0 text-red-400" />
            <p className="flex-1 font-light">{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-[#0A0A0A] border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "thinking" 
              ? "Formulate strategic query..." 
              : "Command Manfred to draft, swap or audit..."
          }
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-white/[0.02] border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-[#C8FF00] disabled:opacity-40 font-mono rounded-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-5 py-2 bg-white hover:bg-[#C8FF00] disabled:bg-white/5 disabled:text-white/20 text-black font-mono text-[9px] font-bold uppercase tracking-widest transition-colors rounded-none"
        >
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
