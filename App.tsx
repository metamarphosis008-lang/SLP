import React, { useState, useEffect } from "react";
import Chatbot from "./components/Chatbot";
import OpenClawProfile from "./components/OpenClawProfile";
import MoltBookManager from "./components/MoltBookManager";
import OpenWorkTester from "./components/OpenWorkTester";
import ClawBankLedger from "./components/ClawBankLedger";
import DocumentDrafting from "./components/DocumentDrafting";
import GoogleChatManager from "./components/GoogleChatManager";
import { PaidTask } from "./types";
import { 
  Bot, ShieldCheck, CheckSquare, Square, Activity, Sparkles, 
  Globe, DollarSign, Scroll, LayoutGrid, Focus, Compass, HelpCircle, AlertCircle,
  MessageSquare
} from "lucide-react";

export default function App() {
  // System statuses synced with sub-component actions
  const [moltbookRotated, setMoltbookRotated] = useState(false);
  const [openclawPublished, setOpenclawPublished] = useState(false);
  const [openworkPaid, setOpenworkPaid] = useState(false);
  
  // Tab layout selection: "bento" or specific tabs
  const [activeTab, setActiveTab] = useState<"bento" | "manfred" | "registry" | "moltbook" | "openwork" | "ledger" | "drafts" | "chat">("bento");

  // Track state changes to tick off setup checklist
  useEffect(() => {
    const checkStatus = () => {
      const hasToken = !!localStorage.getItem("moltbook_token");
      const isPublished = localStorage.getItem("soloplanet_published") === "true";
      const tasks = JSON.parse(localStorage.getItem("openwork_tasks") || "[]");
      const hasPaidTask = tasks.some((t: PaidTask) => t.id !== "task-init" && t.status === "paid");
      
      setMoltbookRotated(hasToken);
      setOpenclawPublished(isPublished);
      setOpenworkPaid(hasPaidTask);
    };

    // Check status initially
    checkStatus();

    // Setup an interval to check for updates from other components saving to localStorage
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalTasksCompleted = (moltbookRotated ? 1 : 0) + (openclawPublished ? 1 : 0) + (openworkPaid ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans select-none antialiased border-4 md:border-8 border-[#1A1A1A] selection:bg-[#C8FF00] selection:text-black">
      {/* Top Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end px-6 py-6 md:px-10 md:py-8 border-b border-white/10 bg-[#0F0F0F] gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-2">Primary System Operator</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none italic font-serif">Manfred.</h1>
          <p className="text-xs text-white/50 font-sans mt-2 tracking-wide">
            Secure Interface for Operator & Soloplanet (SPL Agent)
          </p>
        </div>
        <div className="text-left md:text-right flex flex-col items-start md:items-end w-full md:w-auto">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#C8FF00] shadow-[0_0_10px_#C8FF00] animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest text-white/80 font-mono">Systems Online / OpenClaw Layer 1</span>
          </div>
          <div className="text-3xl md:text-4xl font-light tabular-nums font-serif">
            $412,890.02 <span className="text-[10px] uppercase align-middle ml-2 text-white/40 font-sans tracking-widest">USDC Balance</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* Top Control Bar & Live Status Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Intro description */}
          <div className="lg:col-span-4 bg-[#0F0F0F] border border-white/10 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#C8FF00] font-bold font-mono">
                SYSTEM INTEGRATION STATUS
              </h2>
              <p className="text-xs text-white/60 leading-relaxed font-sans font-light">
                Welcome to your console. Your high-precision agent, <strong className="text-white">Soloplanet (SPL)</strong>, is ready. 
                Complete the critical runbook items to establish validated operations across all network rails.
              </p>
            </div>

            <div className="bg-[#0A0A0A] p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-white/40">INTEGRATION INDEX:</span>
                <span className="text-[#C8FF00] font-bold">{Math.round((totalTasksCompleted / 3) * 100)}% COMPLETE</span>
              </div>
              <div className="w-full h-[2px] bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-[#C8FF00] transition-all duration-700 ease-out"
                  style={{ width: `${(totalTasksCompleted / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Checklist Panel */}
          <div className="lg:col-span-8 bg-[#0F0F0F] border border-white/10 p-6 space-y-5">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold font-mono">
              PRIORITY RUNBOOK QUEUE
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Task 1 */}
              <div className={`p-5 border transition-all ${
                moltbookRotated 
                  ? "bg-white/[0.02] border-[#C8FF00]/40" 
                  : "bg-transparent border-white/5"
              }`}>
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <span className="text-[8px] font-mono text-white/30 block mb-1">RUNBOOK 01</span>
                    <h3 className={`text-xs font-bold uppercase tracking-widest leading-tight ${moltbookRotated ? "text-[#C8FF00]" : "text-white"}`}>
                      MoltBook Update
                    </h3>
                    <p className="text-[10px] text-white/50 mt-2 leading-relaxed">
                      {moltbookRotated 
                        ? "Deployment credentials successfully rotated. Standard-verdict authenticated." 
                        : "Rotate key credentials in MoltBook module to unlock posting capability."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    {moltbookRotated ? (
                      <span className="text-[9px] font-mono font-bold text-[#C8FF00] flex items-center gap-1">
                        ● ROTATED & SECURED
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-white/30 flex items-center gap-1">
                        ○ PENDING ROTATION
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Task 2 */}
              <div className={`p-5 border transition-all ${
                openclawPublished 
                  ? "bg-white/[0.02] border-[#C8FF00]/40" 
                  : "bg-transparent border-white/5"
              }`}>
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <span className="text-[8px] font-mono text-white/30 block mb-1">RUNBOOK 02</span>
                    <h3 className={`text-xs font-bold uppercase tracking-widest leading-tight ${openclawPublished ? "text-[#C8FF00]" : "text-white"}`}>
                      Soloplanet Listing
                    </h3>
                    <p className="text-[10px] text-white/50 mt-2 leading-relaxed">
                      {openclawPublished 
                        ? "Soloplanet is registered, live, and verified on the OpenClaw market." 
                        : "Finalize profile listing, declare policies, and publish to OpenClaw registry."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    {openclawPublished ? (
                      <span className="text-[9px] font-mono font-bold text-[#C8FF00] flex items-center gap-1">
                        ● REGISTERED LIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-white/30 flex items-center gap-1">
                        ○ PENDING DIRECTORY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Task 3 */}
              <div className={`p-5 border transition-all ${
                openworkPaid 
                  ? "bg-white/[0.02] border-[#C8FF00]/40" 
                  : "bg-transparent border-white/5"
              }`}>
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <span className="text-[8px] font-mono text-white/30 block mb-1">RUNBOOK 03</span>
                    <h3 className={`text-xs font-bold uppercase tracking-widest leading-tight ${openworkPaid ? "text-[#C8FF00]" : "text-white"}`}>
                      Payment Validation
                    </h3>
                    <p className="text-[10px] text-white/50 mt-2 leading-relaxed">
                      {openworkPaid 
                        ? "USDC test payment validated. Settlement logged on Ledger channel." 
                        : "Execute a USDC test transaction to verify payment settlement channels."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    {openworkPaid ? (
                      <span className="text-[9px] font-mono font-bold text-[#C8FF00] flex items-center gap-1">
                        ● VERIFIED & SETTLED
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-white/30 flex items-center gap-1">
                        ○ PENDING PIPELINE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 gap-0 overflow-x-auto pb-0.5 font-mono">
          <button
            onClick={() => setActiveTab("bento")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "bento"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <LayoutGrid size={12} />
            <span>00. Command Bento</span>
          </button>
          
          <button
            onClick={() => setActiveTab("manfred")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "manfred"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Bot size={12} />
            <span>01. Manfred Operator</span>
          </button>

          <button
            onClick={() => setActiveTab("registry")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "registry"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Globe size={12} />
            <span>02. OpenClaw Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("moltbook")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "moltbook"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Activity size={12} />
            <span>03. MoltBook Keys</span>
          </button>

          <button
            onClick={() => setActiveTab("openwork")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "openwork"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <DollarSign size={12} />
            <span>04. OpenWork Rails</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "ledger"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Activity size={12} />
            <span>05. Vault Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("drafts")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "drafts"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Scroll size={12} />
            <span>06. Strategic Drafts</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "chat"
                ? "border-[#C8FF00] text-[#C8FF00] bg-white/[0.03]"
                : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <MessageSquare size={12} />
            <span>07. Chat Network</span>
          </button>
        </div>

        {/* Tab Content Rendering */}
        <div className="space-y-6">
          {activeTab === "bento" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Manfred & Ledgers */}
              <div className="xl:col-span-5 space-y-8">
                <Chatbot />
                <ClawBankLedger />
              </div>

              {/* Right Column: Listings, Credentials, and Rails */}
              <div className="xl:col-span-7 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <OpenClawProfile onPublishStatusChange={(published) => setOpenclawPublished(published)} />
                  <MoltBookManager />
                </div>
                <OpenWorkTester onPaymentConfirmed={() => setOpenworkPaid(true)} />
                <DocumentDrafting />
              </div>
            </div>
          )}

          {activeTab === "manfred" && (
            <div className="max-w-4xl mx-auto">
              <Chatbot />
            </div>
          )}

          {activeTab === "registry" && (
            <div className="max-w-2xl mx-auto">
              <OpenClawProfile onPublishStatusChange={(published) => setOpenclawPublished(published)} />
            </div>
          )}

          {activeTab === "moltbook" && (
            <div className="max-w-2xl mx-auto">
              <MoltBookManager />
            </div>
          )}

          {activeTab === "openwork" && (
            <div className="max-w-2xl mx-auto">
              <OpenWorkTester onPaymentConfirmed={() => setOpenworkPaid(true)} />
            </div>
          )}

          {activeTab === "ledger" && (
            <div className="max-w-4xl mx-auto">
              <ClawBankLedger />
            </div>
          )}

          {activeTab === "drafts" && (
            <div className="max-w-6xl mx-auto">
              <DocumentDrafting />
            </div>
          )}

          {activeTab === "chat" && (
            <div className="max-w-6xl mx-auto">
              <GoogleChatManager />
            </div>
          )}
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="min-h-14 border-t border-white/10 flex flex-col md:flex-row items-center px-6 py-4 md:px-10 gap-6 md:gap-8 bg-[#0F0F0F] text-[9px] uppercase tracking-widest text-white/30 font-mono mt-auto shrink-0">
        <div className="flex gap-4 shrink-0">
          <span>OPERATOR WALLET: 0x0C7f37Ec2F2aE089911AF2056BD7b6785246b22a (Base)</span>
          <span>TICKER: SPL</span>
        </div>
        <div className="overflow-hidden flex-1 text-center md:text-left">
          <div className="whitespace-nowrap text-white/20 animate-pulse text-[8px] tracking-[0.25em]">
            Soloplanet Audit Trail — Core Status Active — USDC Swaps Connected — Entity Registered soloplanet.uz — ClawBank Consensus OK —
          </div>
        </div>
        <div className="text-[#C8FF00] font-bold shrink-0 text-[10px]">v4.0.2-ALPHA</div>
      </footer>
    </div>
  );
}

