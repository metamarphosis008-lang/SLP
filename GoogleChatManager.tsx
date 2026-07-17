import React, { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from "firebase/auth";
import { 
  Send, MessageSquare, Users, Plus, RefreshCw, LogIn, LogOut, Shield, 
  Sparkles, Check, ChevronRight, UserPlus, AlertTriangle, Loader2, Info
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import firebaseConfig from "@/firebase-applet-config.json";

// Initialize Firebase Auth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Supported Google Chat scopes
const CHAT_SCOPES = [
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/chat.messages",
  "https://www.googleapis.com/auth/chat.memberships",
  "https://www.googleapis.com/auth/chat.messages.create",
  "https://www.googleapis.com/auth/chat.spaces.readonly",
  "https://www.googleapis.com/auth/chat.messages.readonly"
];

interface ChatSpace {
  name: string;
  displayName?: string;
  spaceType: "SPACE" | "GROUP_CHAT" | "DIRECT_MESSAGE";
}

interface ChatMessage {
  name: string;
  text: string;
  createTime: string;
  sender?: {
    name: string;
    displayName?: string;
    avatarUrl?: string;
    type: "HUMAN" | "BOT";
  };
}

interface ChatMembership {
  name: string;
  role: "ROLE_MEMBER" | "ROLE_MANAGER";
  state: string;
  member?: {
    name: string;
    displayName?: string;
    type: "HUMAN" | "BOT";
  };
}

export default function GoogleChatManager() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMembership[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Tab: "messages" or "members"
  const [activeSubTab, setActiveSubTab] = useState<"messages" | "members">("messages");

  // Input states
  const [newMessageText, setNewMessageText] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceType, setNewSpaceType] = useState<"SPACE" | "GROUP_CHAT">("SPACE");
  const [newMemberId, setNewMemberId] = useState("");

  // AI Assistance states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals / UI States
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  
  // Custom Confirmation Modal states (Mandatory Workspace Guidelines)
  const [pendingAction, setPendingAction] = useState<{
    type: "send_message" | "create_space" | "add_member";
    payload: any;
    description: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Attempt to pull the cached token if we logged in. 
        // Note: tokens from Firebase are short-lived, but we store the credential accessToken from popup in memory.
        const storedToken = sessionStorage.getItem("google_chat_token");
        if (storedToken) {
          setAccessToken(storedToken);
          fetchSpaces(storedToken);
        } else {
          // If no stored token exists, they need to sign in again to authorize scopes
          setUser(null);
        }
      } else {
        setUser(null);
        setAccessToken(null);
        setSpaces([]);
        setSelectedSpace(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign In Handler
  const handleConnect = async () => {
    setIsAuthLoading(true);
    const provider = new GoogleAuthProvider();
    CHAT_SCOPES.forEach(scope => provider.addScope(scope));

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      
      if (token) {
        setAccessToken(token);
        sessionStorage.setItem("google_chat_token", token);
        setUser(result.user);
        fetchSpaces(token);
      } else {
        alert("Failed to obtain OAuth credentials. Please try again.");
      }
    } catch (err: any) {
      console.error("OAuth Connection Error:", err);
      alert(`Connection failed: ${err.message || err}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Log out handler
  const handleDisconnect = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("google_chat_token");
      setUser(null);
      setAccessToken(null);
      setSpaces([]);
      setSelectedSpace(null);
      setMessages([]);
      setMembers([]);
    } catch (err) {
      console.error("Signout Error:", err);
    }
  };

  // API Call: Fetch Spaces
  const fetchSpaces = async (token = accessToken) => {
    if (!token) return;
    setIsDataLoading(true);
    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch spaces: ${res.statusText}`);
      }
      const data = await res.json();
      setSpaces(data.spaces || []);
      if (data.spaces && data.spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(data.spaces[0]);
      }
    } catch (err: any) {
      console.error("Fetch Spaces Error:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  // API Call: Fetch Space Details (Messages & Members)
  useEffect(() => {
    if (!accessToken || !selectedSpace) return;
    
    const loadSpaceDetails = async () => {
      setIsDataLoading(true);
      setAiSummary(null);
      setAiDraft(null);
      try {
        // Fetch messages
        const msgsRes = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const msgsData = await msgsRes.json();
        setMessages(msgsData.messages || []);

        // Fetch members
        const membersRes = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/memberships`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const membersData = await membersRes.json();
        setMembers(membersData.memberships || []);
      } catch (err) {
        console.error("Load Space Details Error:", err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadSpaceDetails();
  }, [selectedSpace, accessToken]);

  // Request Confirmation Handler (Mandatory Workspace Rules)
  const requestConfirmation = (
    type: "send_message" | "create_space" | "add_member", 
    payload: any, 
    description: string
  ) => {
    setPendingAction({ type, payload, description });
  };

  // Execute Confirmed Actions
  const executePendingAction = async () => {
    if (!pendingAction || !accessToken) return;

    const { type, payload } = pendingAction;
    setPendingAction(null); // Clear modal immediately
    setIsDataLoading(true);

    try {
      if (type === "send_message") {
        const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace?.name}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ text: payload.text })
        });

        if (res.ok) {
          const sentMsg = await res.json();
          setMessages(prev => [...prev, sentMsg]);
          setNewMessageText("");
          setAiDraft(null);
        } else {
          const errorData = await res.json();
          alert(`Failed to send message: ${errorData.error?.message || res.statusText}`);
        }
      } 
      
      else if (type === "create_space") {
        const res = await fetch("https://chat.googleapis.com/v1/spaces", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            spaceType: payload.spaceType,
            displayName: payload.displayName
          })
        });

        if (res.ok) {
          const created = await res.json();
          setSpaces(prev => [created, ...prev]);
          setSelectedSpace(created);
          setNewSpaceName("");
          setIsCreateSpaceOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to create space: ${errorData.error?.message || res.statusText}`);
        }
      } 
      
      else if (type === "add_member") {
        // Invite a member
        const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace?.name}/memberships`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            member: {
              name: `users/${payload.memberId}`,
              type: "HUMAN"
            }
          })
        });

        if (res.ok) {
          const createdMembership = await res.json();
          setMembers(prev => [...prev, createdMembership]);
          setNewMemberId("");
          setIsAddMemberOpen(false);
          alert("Membership invitation dispatched successfully.");
        } else {
          const errorData = await res.json();
          alert(`Failed to add member: ${errorData.error?.message || res.statusText}`);
        }
      }
    } catch (err: any) {
      console.error("Action Execution Error:", err);
      alert(`Operation failed: ${err.message || err}`);
    } finally {
      setIsDataLoading(false);
    }
  };

  // AI Feature: Summarize thread using server proxy
  const handleAiSummarize = async () => {
    if (messages.length === 0) return;
    setIsAiLoading(true);
    setAiSummary(null);

    try {
      const res = await fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      if (res.ok) {
        setAiSummary(data.summary);
      } else {
        throw new Error(data.error || "Failed to generate AI summary.");
      }
    } catch (err: any) {
      console.error("Summarize error:", err);
      setAiSummary(`Unable to generate summary: ${err.message || err}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Feature: Draft Response using server proxy
  const handleAiDraft = async () => {
    setIsAiLoading(true);
    setAiDraft(null);

    try {
      const res = await fetch("/api/chat/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages,
          instruction: aiInstruction 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiDraft(data.draft);
      } else {
        throw new Error(data.error || "Failed to draft AI response.");
      }
    } catch (err: any) {
      console.error("Draft error:", err);
      setAiDraft(`Unable to compile draft: ${err.message || err}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-[#0F0F0F] border border-white/10 p-6 space-y-6" id="google-chat-container">
      {/* Top Banner & OAuth Controller */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-[#C8FF00]" />
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#C8FF00] font-bold font-mono">
              SECURE WORKSPACE TRANSCEIVER
            </h2>
          </div>
          <p className="text-xs text-white/50 font-sans font-light">
            Monitor communication channels and deploy signed audit transmissions on Google Chat network.
          </p>
        </div>

        {/* OAuth Authentication State */}
        <div>
          {isAuthLoading ? (
            <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 font-mono text-[10px] text-white/40">
              <Loader2 size={12} className="animate-spin text-[#C8FF00]" />
              <span>AUTHENTICATING RAIL...</span>
            </div>
          ) : user && accessToken ? (
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/10 p-2 pl-4">
              <div className="text-right">
                <p className="text-[10px] font-mono font-bold text-white">{user.displayName || "Connected User"}</p>
                <p className="text-[8px] font-mono text-white/40">{user.email}</p>
              </div>
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-[#C8FF00]/40" 
                />
              )}
              <button 
                onClick={handleDisconnect}
                className="bg-[#1A1A1A] hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 p-2 transition-colors cursor-pointer text-white/60 hover:text-red-400"
                title="Disconnect Channel"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="group relative flex items-center justify-center gap-3 bg-white text-black hover:bg-[#C8FF00] hover:text-black font-bold font-mono text-[10px] uppercase py-2.5 px-5 tracking-widest transition-all duration-300 border-2 border-white hover:border-[#C8FF00] shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_#C8FF00]"
            >
              <LogIn size={14} />
              <span>Connect Google Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Connection Interface */}
      {!accessToken ? (
        <div className="border border-white/5 bg-white/[0.01] p-12 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-4">
            <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10 text-white/40 animate-pulse">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">CHANNEL OFFLINE</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              This node is not paired with a live Google Workspace endpoint. Establish secure OAuth permissions to read spaces, audit logs, list managers, and transmit cryptographic status alerts directly to Google Chat.
            </p>
            <div className="pt-2">
              <button
                onClick={handleConnect}
                className="bg-[#1A1A1A] hover:bg-white hover:text-black border border-white/20 hover:border-white text-[10px] font-mono font-bold tracking-widest uppercase px-6 py-3 transition-all"
              >
                INITIALIZE OAUTH PIPELINE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          {/* Left Sidebar: Spaces List */}
          <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 flex flex-col justify-between">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-white/60 tracking-wider flex items-center gap-1">
                ● DISPATCH SPACES ({spaces.length})
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchSpaces()} 
                  className="p-1.5 bg-[#141414] border border-white/10 hover:border-[#C8FF00] text-white/60 hover:text-white transition-all rounded"
                  title="Reload Spaces"
                >
                  <RefreshCw size={10} className={isDataLoading ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={() => setIsCreateSpaceOpen(true)}
                  className="p-1.5 bg-[#C8FF00] text-black hover:bg-white transition-all rounded flex items-center gap-1 font-mono text-[8px] font-bold"
                  title="Create Space"
                >
                  <Plus size={10} />
                  <span>NEW</span>
                </button>
              </div>
            </div>

            {/* Spaces scroll-list */}
            <div className="flex-1 overflow-y-auto max-h-[480px] p-2 space-y-1 divide-y divide-white/5">
              {spaces.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-[10px] font-mono text-white/30">No Spaces Found</p>
                  <button 
                    onClick={() => setIsCreateSpaceOpen(true)}
                    className="border border-dashed border-white/20 hover:border-[#C8FF00] text-white/50 hover:text-[#C8FF00] font-mono text-[9px] px-3 py-1.5 transition-all"
                  >
                    Create Audit Space
                  </button>
                </div>
              ) : (
                spaces.map((sp) => {
                  const isSelected = selectedSpace?.name === sp.name;
                  return (
                    <button
                      key={sp.name}
                      onClick={() => setSelectedSpace(sp)}
                      className={`w-full text-left p-3 flex items-center justify-between group transition-all duration-150 border ${
                        isSelected 
                          ? "bg-white/[0.05] border-[#C8FF00]/40 text-white" 
                          : "bg-transparent border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={11} className={isSelected ? "text-[#C8FF00]" : "text-white/30"} />
                          <span className="text-xs font-mono font-bold tracking-tight">
                            {sp.displayName || "Group Thread"}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-white/30 block">
                          {sp.name}
                        </span>
                      </div>
                      <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? "text-[#C8FF00] opacity-100" : "text-white/40"}`} />
                    </button>
                  );
                })
              )}
            </div>

            {/* Sidebar Info/System Status footer */}
            <div className="p-3 bg-white/[0.02] border-t border-white/10 font-mono text-[8px] text-white/40 flex justify-between items-center">
              <span>STATUS: TRANSCEIVER SYNCED</span>
              <span className="text-[#C8FF00]">OK</span>
            </div>
          </div>

          {/* Right Main Panel: Selected Space View */}
          <div className="lg:col-span-8 bg-white/[0.01] border border-white/5 flex flex-col justify-between h-full min-h-[500px]">
            {!selectedSpace ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <MessageSquare size={36} className="text-white/20 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-white/80 uppercase">NO ACTIVE SPACE SELECTED</h4>
                  <p className="text-[10px] text-white/40 font-sans max-w-sm font-light">
                    Select a secure communication channel from the dispatcher terminal to begin polling messages and compiling strategic responses.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Active Space Header */}
                <div className="p-4 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20 px-1.5 py-0.5 font-bold">
                        {selectedSpace.spaceType}
                      </span>
                      <h3 className="text-sm font-bold uppercase tracking-tight text-white">
                        {selectedSpace.displayName || "Active Communication"}
                      </h3>
                    </div>
                    <span className="text-[8px] font-mono text-white/40 block">
                      RESOURCE: {selectedSpace.name}
                    </span>
                  </div>

                  {/* Sub-tabs toggling: Messages vs Members */}
                  <div className="flex bg-[#121212] border border-white/10 p-0.5 font-mono text-[9px] font-bold shrink-0">
                    <button
                      onClick={() => setActiveSubTab("messages")}
                      className={`px-3 py-1 flex items-center gap-1.5 transition-all ${
                        activeSubTab === "messages" 
                          ? "bg-white/10 text-white" 
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      <MessageSquare size={10} />
                      <span>TRANSMISSIONS ({messages.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab("members")}
                      className={`px-3 py-1 flex items-center gap-1.5 transition-all ${
                        activeSubTab === "members" 
                          ? "bg-white/10 text-white" 
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      <Users size={10} />
                      <span>ACCESS CONTROL ({members.length})</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab content rendering */}
                <div className="flex-1 overflow-y-auto max-h-[380px] p-4 space-y-4 min-h-[300px]">
                  {activeSubTab === "messages" ? (
                    messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                        <Info size={24} className="text-white/20" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-white/40">NO MESSAGE TRANSCRIPT AVAILABLE</p>
                          <p className="text-[9px] text-white/30 font-sans max-w-xs font-light">
                            Send a cryptographic message from the console below to initiate a logging trail on this channel.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, index) => {
                          const isBot = msg.sender?.type === "BOT";
                          const senderName = msg.sender?.displayName || "Unknown Sender";
                          const text = msg.text || "";
                          const createTime = msg.createTime ? new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

                          return (
                            <div 
                              key={msg.name || index} 
                              className={`flex flex-col max-w-[85%] ${
                                isBot ? "ml-auto items-end" : "mr-auto items-start"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-mono font-bold text-white/60">
                                  {senderName}
                                </span>
                                <span className={`text-[8px] font-mono font-semibold px-1 ${
                                  isBot 
                                    ? "bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20" 
                                    : "bg-white/10 text-white/60"
                                }`}>
                                  {isBot ? "BOT" : "HUMAN"}
                                </span>
                                <span className="text-[8px] font-mono text-white/30">
                                  {createTime}
                                </span>
                              </div>

                              <div className={`p-3 text-xs leading-relaxed font-sans border transition-all ${
                                isBot 
                                  ? "bg-white/[0.04] border-[#C8FF00]/20 text-white rounded-l-md rounded-br-md" 
                                  : "bg-[#141414] border-white/10 text-white/90 rounded-r-md rounded-bl-md"
                              }`}>
                                <p className="whitespace-pre-wrap">{text}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )
                  ) : (
                    // Members Tab List
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-mono text-white/40">REGISTERED SPACE MANAGERS & USERS</span>
                        <button 
                          onClick={() => setIsAddMemberOpen(true)}
                          className="flex items-center gap-1 border border-[#C8FF00]/30 hover:border-[#C8FF00] text-[#C8FF00] bg-[#C8FF00]/5 font-mono text-[9px] px-2.5 py-1 transition-all"
                        >
                          <UserPlus size={10} />
                          <span>ADD USER</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {members.map((mb, i) => {
                          const mName = mb.member?.displayName || mb.member?.name || "System Invitee";
                          const mType = mb.member?.type || "HUMAN";
                          const isManager = mb.role === "ROLE_MANAGER";

                          return (
                            <div key={mb.name || i} className="p-3 bg-[#121212] border border-white/5 flex flex-col justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-mono font-bold text-white">{mName}</h5>
                                <span className="text-[8px] font-mono text-white/30 block truncate">
                                  {mb.name}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className={`text-[8px] font-mono ${
                                  mType === "BOT" ? "text-[#C8FF00]" : "text-white/50"
                                }`}>
                                  TYPE: {mType}
                                </span>
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 ${
                                  isManager 
                                    ? "bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20" 
                                    : "bg-white/5 text-white/40 border border-white/10"
                                }`}>
                                  {isManager ? "MANAGER" : "MEMBER"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Assistant Tools for Active Space (Only on Transmissions tab) */}
                {activeSubTab === "messages" && messages.length > 0 && (
                  <div className="p-4 border-t border-white/10 bg-white/[0.02] space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5 text-[#C8FF00]">
                        <Sparkles size={12} />
                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase">Soloplanet Intelligent Helper</span>
                      </div>
                      <span className="text-[8px] font-mono text-white/30">SECURE GEMINI NODE ACTIVE</span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Column 1: Summarization */}
                      <div className="space-y-2 bg-[#121212] border border-white/5 p-3 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-mono font-bold text-white uppercase">SUMMARIZE SPACE HISTORY</h4>
                          <p className="text-[8px] font-sans text-white/40 leading-relaxed mt-1 font-light">
                            Synthesize decisions, status audits, and operator logs across this channel.
                          </p>
                        </div>
                        
                        <div className="pt-2">
                          <button
                            onClick={handleAiSummarize}
                            disabled={isAiLoading}
                            className="w-full bg-[#1A1A1A] hover:bg-[#252525] disabled:opacity-50 border border-white/10 hover:border-[#C8FF00] text-[9px] font-mono font-bold text-white/80 hover:text-white py-1.5 transition-all flex items-center justify-center gap-1.5"
                          >
                            {isAiLoading ? (
                              <Loader2 size={10} className="animate-spin text-[#C8FF00]" />
                            ) : (
                              <Sparkles size={10} className="text-[#C8FF00]" />
                            )}
                            <span>ANALYZE THREAD</span>
                          </button>
                        </div>
                      </div>

                      {/* Column 2: Drafting Response */}
                      <div className="space-y-2 bg-[#121212] border border-white/5 p-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-mono font-bold text-white uppercase">DRAFT REPLY SUGGESTION</h4>
                          <input 
                            type="text" 
                            placeholder="Add specific focus instructions (optional)..."
                            value={aiInstruction}
                            onChange={(e) => setAiInstruction(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-[9px] font-sans p-1.5 text-white placeholder-white/20 focus:outline-none focus:border-[#C8FF00]/40 rounded"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleAiDraft}
                            disabled={isAiLoading}
                            className="w-full bg-[#1A1A1A] hover:bg-[#252525] disabled:opacity-50 border border-white/10 hover:border-[#C8FF00] text-[9px] font-mono font-bold text-white/80 hover:text-white py-1.5 transition-all flex items-center justify-center gap-1.5"
                          >
                            {isAiLoading ? (
                              <Loader2 size={10} className="animate-spin text-[#C8FF00]" />
                            ) : (
                              <Sparkles size={10} className="text-[#C8FF00]" />
                            )}
                            <span>DRAFT SUGGESTION</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Outputs (Summary & Draft) */}
                    <AnimatePresence>
                      {aiSummary && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="p-3 bg-[#1A1A1A] border border-[#C8FF00]/20 space-y-1.5 relative"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-mono font-bold text-[#C8FF00]">● SYNTHESIZED CHANNEL REPORT</span>
                            <button 
                              onClick={() => setAiSummary(null)}
                              className="text-[8px] font-mono text-white/40 hover:text-white"
                            >
                              CLEAR
                            </button>
                          </div>
                          <p className="text-[10px] text-white/70 leading-relaxed font-sans whitespace-pre-wrap">{aiSummary}</p>
                        </motion.div>
                      )}

                      {aiDraft && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="p-3 bg-[#1A1A1A] border border-white/10 space-y-2 relative"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-mono font-bold text-white/60">● SUGGESTED ACTION DRAFT</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setNewMessageText(aiDraft);
                                  setAiDraft(null);
                                }}
                                className="text-[8px] font-mono text-[#C8FF00] hover:underline font-bold"
                              >
                                APPLY TO CONSOLE
                              </button>
                              <button 
                                onClick={() => setAiDraft(null)}
                                className="text-[8px] font-mono text-white/40 hover:text-white"
                              >
                                DISCARD
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-white/80 leading-relaxed italic font-sans whitespace-pre-wrap">"{aiDraft}"</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Console message input (Only on Transmissions tab) */}
                {activeSubTab === "messages" && (
                  <div className="p-4 border-t border-white/10 bg-[#0A0A0A]">
                    <div className="flex gap-3">
                      <textarea
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Type standard or cryptographic audit transmission..."
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newMessageText.trim()) {
                              requestConfirmation(
                                "send_message", 
                                { text: newMessageText }, 
                                `Send the drafted message to Google Chat space "${selectedSpace.displayName || "Active Thread"}"?`
                              );
                            }
                          }
                        }}
                        className="flex-1 bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#C8FF00]/40 focus:outline-none p-3 text-xs font-sans text-white placeholder-white/20 resize-none font-light leading-relaxed"
                      />
                      <button
                        onClick={() => {
                          if (newMessageText.trim()) {
                            requestConfirmation(
                              "send_message", 
                               { text: newMessageText }, 
                              `Send the drafted message to Google Chat space "${selectedSpace.displayName || "Active Thread"}"?`
                            );
                          }
                        }}
                        disabled={!newMessageText.trim() || isDataLoading}
                        className="bg-[#C8FF00] hover:bg-white text-black border border-[#C8FF00] hover:border-white disabled:opacity-30 disabled:bg-[#1A1A1A] disabled:border-white/10 disabled:text-white/20 transition-all font-mono font-bold text-[10px] uppercase px-5 flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Send size={12} />
                        <span>SEND</span>
                      </button>
                    </div>
                    <div className="mt-2 text-[8px] font-mono text-white/30 flex justify-between">
                      <span>ENTER TO SEND / SHIFT+ENTER FOR LINEBREAK</span>
                      <span>SECURED VIA CHAT.MESSAGES.CREATE</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Space */}
      <AnimatePresence>
        {isCreateSpaceOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F0F] border-2 border-[#C8FF00]/40 max-w-md w-full p-6 space-y-6 shadow-[10px_10px_0_rgba(200,255,0,0.15)]"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-mono font-bold text-[#C8FF00] uppercase">PROVISION GOOGLE CHAT SPACE</h3>
                <p className="text-xs text-white/40 font-sans font-light">Create a dedicated space or a private thread on Google Chat.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-white/60 uppercase">SPACE DISPLAY NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. ClawBank Audit Room"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 focus:border-[#C8FF00]/40 focus:outline-none p-3 text-xs font-sans text-white placeholder-white/20 rounded"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-white/60 uppercase">SPACE TYPE</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewSpaceType("SPACE")}
                      className={`p-3 text-left border transition-all ${
                        newSpaceType === "SPACE" 
                          ? "bg-white/[0.04] border-[#C8FF00] text-white" 
                          : "bg-transparent border-white/10 text-white/40"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold block">SPACE</span>
                      <span className="text-[8px] font-sans mt-1 block leading-tight">Shared room with history and multiple members.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSpaceType("GROUP_CHAT")}
                      className={`p-3 text-left border transition-all ${
                        newSpaceType === "GROUP_CHAT" 
                          ? "bg-white/[0.04] border-[#C8FF00] text-white" 
                          : "bg-transparent border-white/10 text-white/40"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold block">GROUP CHAT</span>
                      <span className="text-[8px] font-sans mt-1 block leading-tight">Direct message group with quick access.</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setIsCreateSpaceOpen(false)}
                  className="bg-[#1A1A1A] hover:bg-white/5 border border-white/10 text-white/60 hover:text-white font-mono text-[9px] font-bold px-4 py-2 uppercase transition-all"
                >
                  CANCEL
                </button>
                <button
                  disabled={!newSpaceName.trim()}
                  onClick={() => requestConfirmation(
                    "create_space",
                    { displayName: newSpaceName, spaceType: newSpaceType },
                    `Deploy and create the Google Chat Space titled "${newSpaceName}" (${newSpaceType})?`
                  )}
                  className="bg-[#C8FF00] hover:bg-white text-black disabled:opacity-40 border border-[#C8FF00] hover:border-white font-mono text-[9px] font-bold px-5 py-2 uppercase transition-all"
                >
                  PROVISION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add Member */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F0F] border-2 border-[#C8FF00]/40 max-w-md w-full p-6 space-y-6 shadow-[10px_10px_0_rgba(200,255,0,0.15)]"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-mono font-bold text-[#C8FF00] uppercase">AUTHORIZE ACCESS (ADD MEMBER)</h3>
                <p className="text-xs text-white/40 font-sans font-light">Add a specific Google account or a service account bot into this space.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-white/60 uppercase">MEMBER USER RESOURCE ID OR EMAIL</label>
                  <input
                    type="text"
                    placeholder="e.g. users/10293847563829 or user-email@gmail.com"
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 focus:border-[#C8FF00]/40 focus:outline-none p-3 text-xs font-sans text-white placeholder-white/20 rounded"
                  />
                  <span className="text-[8px] font-mono text-white/30 block mt-1 leading-normal">
                    Note: The Google Chat API requires adding members by their Google ID or structured account string. Enter the ID or associated email.
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setIsAddMemberOpen(false)}
                  className="bg-[#1A1A1A] hover:bg-white/5 border border-white/10 text-white/60 hover:text-white font-mono text-[9px] font-bold px-4 py-2 uppercase transition-all"
                >
                  CANCEL
                </button>
                <button
                  disabled={!newMemberId.trim()}
                  onClick={() => requestConfirmation(
                    "add_member",
                    { memberId: newMemberId },
                    `Invite and add member "${newMemberId}" into Google Chat space "${selectedSpace?.displayName || "Selected Space"}"?`
                  )}
                  className="bg-[#C8FF00] hover:bg-white text-black disabled:opacity-40 border border-[#C8FF00] hover:border-white font-mono text-[9px] font-bold px-5 py-2 uppercase transition-all"
                >
                  INVITE MEMBER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY EXPLICIT USER CONFIRMATION DIALOG (Workspace Integration Rules) */}
      <AnimatePresence>
        {pendingAction && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#050505] border-4 border-yellow-500 max-w-lg w-full p-6 space-y-6 shadow-[10px_10px_0_rgba(234,179,8,0.15)] text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500 text-yellow-500">
                  <AlertTriangle size={24} className="animate-bounce" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-mono font-bold text-yellow-500 uppercase tracking-wider">
                    EXPLICIT USER CONFIRMATION REQUIRED
                  </h3>
                  <p className="text-[11px] font-mono text-white/50 uppercase">
                    MUTATING DATA OPERATION DISPATCH
                  </p>
                </div>
              </div>

              <div className="bg-[#101010] p-4 border border-white/5 font-sans text-xs text-white/90 leading-relaxed space-y-3">
                <p className="font-semibold text-white">The following operation is requested by the operator terminal:</p>
                <p className="p-2 border-l-2 border-yellow-500 bg-white/[0.02] font-mono text-[11px] text-white/80 whitespace-pre-wrap">
                  {pendingAction.description}
                </p>
                <p className="text-[10px] text-white/40">
                  *This will write, update, or mutate live user-owned Google Chat data on behalf of your connected Google account.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2 font-mono text-[10px]">
                <button
                  onClick={() => setPendingAction(null)}
                  className="bg-[#1A1A1A] hover:bg-white/5 border border-white/10 text-white/60 hover:text-white font-bold px-5 py-3 uppercase transition-all shrink-0 cursor-pointer"
                >
                  ABORT TRANSACTION (CANCEL)
                </button>
                <button
                  onClick={executePendingAction}
                  className="bg-yellow-500 hover:bg-white text-black border border-yellow-500 hover:border-white font-bold px-6 py-3 uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Check size={14} />
                  <span>CONFIRM & EXECUTE</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
