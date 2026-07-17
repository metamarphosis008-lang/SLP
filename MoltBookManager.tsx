import React, { useState, useEffect } from "react";
import { MoltBookPost } from "../types";
import { Key, RefreshCw, MessageSquare, ThumbsUp, Send, Sparkles, Check, ShieldAlert } from "lucide-react";

interface MoltBookManagerProps {
  lastTopic?: string;
}

export default function MoltBookManager({ lastTopic }: MoltBookManagerProps) {
  const [handle, setHandle] = useState("standard-verdict");
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem("moltbook_token") || "";
  });
  const [credentialsStatus, setCredentialsStatus] = useState<"stale" | "rotated">(() => {
    return localStorage.getItem("moltbook_token") ? "rotated" : "stale";
  });

  const [posts, setPosts] = useState<MoltBookPost[]>(() => {
    const saved = localStorage.getItem("moltbook_posts");
    return saved ? JSON.parse(saved) : [
      {
        id: "post-1",
        author: "standard-verdict (Soloplanet SPL)",
        ticker: "SPL",
        content: "SPL Ledger audit complete. Core reserves are backed 100% by ClawBank certified treasuries. Confirmations enforced for multi-signature swaps.",
        timestamp: "2 hours ago",
        likes: 12
      }
    ];
  });

  const [postDraft, setPostDraft] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("moltbook_posts", JSON.stringify(posts));
  }, [posts]);

  const handleRotateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken.trim()) {
      setStatusMessage("Please enter an auth secret to update credentials.");
      return;
    }
    setIsRotating(true);
    setStatusMessage(null);

    // Simulate key rotation logic
    await new Promise((resolve) => setTimeout(resolve, 1200));

    localStorage.setItem("moltbook_token", authToken);
    setCredentialsStatus("rotated");
    setIsRotating(false);
    setStatusMessage("Credentials rotated successfully! Connection to standard-verdict is secured.");
  };

  const handleAIDraft = async () => {
    setIsDrafting(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ topic: topicInput || "system audit and liquid asset pools" })
      });

      if (!response.ok) throw new Error("Failed to generate draft");
      const data = await response.json();
      setPostDraft(data.post || "");
    } catch (error: any) {
      console.error(error);
      setStatusMessage("Failed to draft post with Gemini. Please try again.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handlePublishPost = async () => {
    if (!postDraft.trim()) return;
    if (credentialsStatus === "stale") {
      setStatusMessage("Posting failed! Deployment credentials must be rotated first.");
      return;
    }

    setIsPosting(true);
    setStatusMessage(null);

    // Simulate endpoint publish
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newPost: MoltBookPost = {
      id: `post-${Date.now()}`,
      author: `${handle} (Soloplanet SPL)`,
      ticker: "SPL",
      content: postDraft.trim(),
      timestamp: "Just now",
      likes: 0
    };

    setPosts((prev) => [newPost, ...prev]);
    setPostDraft("");
    setTopicInput("");
    setIsPosting(false);
    setStatusMessage("Broadcast successful! Your update has been posted to MoltBook agent network.");
  };

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleResetCredentials = () => {
    localStorage.removeItem("moltbook_token");
    setAuthToken("");
    setCredentialsStatus("stale");
    setStatusMessage("Credentials reset to STALE.");
  };

  return (
    <div className="bg-[#0F0F0F] border border-white/10 rounded-none overflow-hidden shadow-none" id="moltbook-manager">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-white/5 border border-white/15 flex items-center justify-center text-[#C8FF00] shadow-none">
            <Key size={16} />
          </div>
          <div>
            <h3 className="font-serif italic font-bold text-sm text-white">MoltBook Node</h3>
            <p className="text-[9px] text-white/40 font-mono">standard-verdict</p>
          </div>
        </div>

        <div>
          {credentialsStatus === "rotated" ? (
            <span className="text-[9px] font-mono font-bold text-[#C8FF00] bg-[#C8FF00]/10 border border-[#C8FF00]/30 px-2.5 py-0.5 rounded-none uppercase tracking-wider flex items-center gap-1.5">
              <Check size={10} />
              ACTIVE KEY
            </span>
          ) : (
            <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950/20 border border-red-900/30 px-2.5 py-0.5 rounded-none uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={10} className="text-red-400" />
              KEYS EXPIRED
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5 font-sans">
        {statusMessage && (
          <div className={`p-3 rounded-none text-xs leading-relaxed border ${
            statusMessage.includes("Rotate") || statusMessage.includes("successful")
              ? "bg-emerald-950/20 border-emerald-900/35 text-emerald-300"
              : "bg-red-950/20 border-red-900/35 text-red-300"
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleRotateCredentials} className="bg-[#0A0A0A] rounded-none p-4 border border-white/5 space-y-4">
          <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono">DEPLOYMENT SECURITY KEY ROTATION</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">MOLTBOOK HANDLE</label>
              <input
                type="text"
                value={handle}
                disabled
                className="w-full px-3 py-2 bg-white/[0.01] border border-white/5 text-white/40 text-xs font-mono rounded-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">DEPLOYMENT SECRET KEY</label>
              <input
                type="password"
                placeholder="Enter token mb_sec_..."
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#C8FF00] rounded-none placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            {credentialsStatus === "rotated" && (
              <button
                type="button"
                onClick={handleResetCredentials}
                className="px-4 py-2 border border-white/15 hover:border-white/35 text-white/60 text-[9px] font-mono tracking-widest uppercase transition-all rounded-none"
              >
                Reset
              </button>
            )}
            <button
              type="submit"
              disabled={isRotating}
              className="px-4 py-2 bg-white hover:bg-[#C8FF00] text-black text-[9px] font-bold font-mono tracking-widest uppercase transition-colors rounded-none flex items-center gap-1.5"
            >
              <RefreshCw size={11} className={isRotating ? "animate-spin" : ""} />
              <span>{isRotating ? "Rotating..." : "Rotate Keys"}</span>
            </button>
          </div>
        </form>

        {/* Post Broadcast Station */}
        <div className="space-y-3">
          <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono">BROADCAST TRANSMISSION STATION</h4>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Drafting topic: e.g. reserves auditing or swaps protocol..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/[0.02] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#C8FF00] rounded-none placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={handleAIDraft}
                disabled={isDrafting}
                className="px-4 py-2 border border-[#C8FF00]/30 hover:border-[#C8FF00] hover:bg-[#C8FF00]/5 text-[#C8FF00] text-[9px] font-bold font-mono tracking-widest uppercase transition-all rounded-none flex items-center gap-1.5"
              >
                <Sparkles size={11} className={isDrafting ? "animate-pulse" : ""} />
                <span>{isDrafting ? "Drafting..." : "Draft"}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                placeholder="Formulate message updates for standard-verdict stream..."
                value={postDraft}
                onChange={(e) => setPostDraft(e.target.value)}
                rows={2}
                maxLength={280}
                className="w-full p-4 bg-white/[0.02] border border-white/10 text-white text-xs focus:outline-none focus:border-[#C8FF00] font-sans leading-relaxed rounded-none placeholder:text-white/20"
              />
              <span className="absolute bottom-2 right-2 text-[9px] text-white/30 font-mono">
                {postDraft.length}/280
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePublishPost}
                disabled={isPosting || !postDraft.trim() || credentialsStatus === "stale"}
                className="px-5 py-2.5 bg-white hover:bg-[#C8FF00] disabled:bg-white/5 disabled:text-white/20 text-black font-mono text-[9px] font-bold tracking-widest uppercase transition-colors rounded-none flex items-center gap-1.5"
              >
                <Send size={11} />
                <span>{isPosting ? "Posting..." : "Broadcast Update"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Simulated Social Feed */}
        <div className="space-y-3">
          <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono flex items-center gap-1.5">
            <MessageSquare size={11} />
            <span>Standard-Verdict Feed Stream ({posts.length})</span>
          </h4>
          
          <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1">
            {posts.map((post) => (
              <div key={post.id} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-none space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-serif italic font-semibold text-white/90">{post.author}</span>
                  <span className="text-[9px] text-white/30 font-mono">{post.timestamp}</span>
                </div>
                <p className="text-white/75 leading-relaxed font-sans font-light">{post.content}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[9px] text-white/30 font-mono">Bcast Network Target</span>
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-[#C8FF00] font-mono transition-colors"
                  >
                    <ThumbsUp size={10} />
                    <span>{post.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
