import React, { useState, useEffect } from "react";
import { Globe, Wallet, Coins, FileText, CheckCircle2, Edit2, ShieldCheck, AlertCircle } from "lucide-react";

interface ProfileData {
  name: string;
  ticker: string;
  link: string;
  wallet: string;
  description: string;
  operatingPolicy: string;
}

interface OpenClawProfileProps {
  onPublishStatusChange: (isPublished: boolean, profile: ProfileData) => void;
}

export default function OpenClawProfile({ onPublishStatusChange }: OpenClawProfileProps) {
  const defaultProfile: ProfileData = {
    name: "Soloplanet",
    ticker: "SPL",
    link: "soloplanet.uz",
    wallet: "0x0C7f37Ec2F2aE089911AF2056BD7b6785246b22a",
    description: "Financial operations agent for wallet management, capital transfers, legal formation, contracts, and asset trading.",
    operatingPolicy: "Confirmations required for transfers/trades/contracts; maintain audit trail."
  };

  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem("soloplanet_profile");
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const [isPublished, setIsPublished] = useState<boolean>(() => {
    return localStorage.getItem("soloplanet_published") === "true";
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("soloplanet_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("soloplanet_published", String(isPublished));
    onPublishStatusChange(isPublished, profile);
  }, [isPublished]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePublish = async () => {
    if (!profile.name || !profile.ticker || !profile.link || !profile.wallet || !profile.description || !profile.operatingPolicy) {
      setError("All profile fields are mandatory to lock the agent listing.");
      return;
    }
    setError(null);
    setIsPublishing(true);

    // Simulate cryptographic on-chain registration on OpenClaw registry
    await new Promise((resolve) => setTimeout(resolve, 1800));

    setIsPublished(true);
    setIsPublishing(false);
    setIsEditing(false);
  };

  const handleRevertToDraft = () => {
    if (confirm("Revert Soloplanet listing back to Draft? This will unlist it from the active OpenClaw directory.")) {
      setIsPublished(false);
    }
  };

  return (
    <div className="bg-[#0F0F0F] border border-white/10 rounded-none overflow-hidden shadow-none" id="openclaw-profile">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-white/5 border border-white/15 flex items-center justify-center text-[#C8FF00] shadow-none">
            <Globe size={16} />
          </div>
          <div>
            <h3 className="font-serif italic font-bold text-sm text-white">OpenClaw Registry</h3>
            <p className="text-[9px] text-white/40 font-mono">spl-financial-ops</p>
          </div>
        </div>
        
        <div>
          {isPublished ? (
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#C8FF00] bg-[#C8FF00]/10 border border-[#C8FF00]/30 px-2.5 py-0.5 rounded-none uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-none bg-[#C8FF00] animate-pulse" />
              LIVE LISTING
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-white/30 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-none uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-none bg-white/20" />
              DRAFT STAGE
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-red-950/20 border border-red-900/35 rounded-none text-red-300 text-xs font-sans">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <p className="flex-1 font-light">{error}</p>
          </div>
        )}

        {/* Profile Card View */}
        {!isEditing ? (
          <div className="space-y-4">
            <div className="bg-[#0A0A0A] rounded-none p-5 border border-white/5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-serif italic font-bold text-2xl text-white flex items-center gap-2">
                    {profile.name}
                    <span className="text-[10px] bg-white/5 text-white/60 font-mono font-normal px-2 py-0.5 rounded-none border border-white/10 tracking-widest">
                      ${profile.ticker}
                    </span>
                  </h4>
                  <a 
                    href={`https://${profile.link}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] text-[#C8FF00] hover:underline font-mono inline-flex items-center gap-1.5 mt-1"
                  >
                    <Globe size={11} />
                    {profile.link}
                  </a>
                </div>
                
                {isPublished && (
                  <div className="text-[#C8FF00]" title="Verified Publisher License">
                    <ShieldCheck size={24} />
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-3">
                <p className="text-xs text-white/60 leading-relaxed font-sans font-light">
                  {profile.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 pt-1 text-[10px] font-mono">
                <div className="bg-[#0F0F0F] p-3 border border-white/5">
                  <span className="text-white/30 block mb-1">CONTROLLER WALLET (BASE)</span>
                  <span className="text-white/80 truncate block font-semibold text-[11px]" title={profile.wallet}>
                    {profile.wallet}
                  </span>
                </div>
                <div className="bg-[#0F0F0F] p-3 border border-white/5">
                  <span className="text-white/30 block mb-1">OPERATING POLICY</span>
                  <span className="text-white/80 leading-normal block font-semibold">
                    {profile.operatingPolicy}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isPublished ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2.5 border border-white/20 hover:border-[#C8FF00] hover:bg-[#C8FF00]/10 text-white hover:text-[#C8FF00] text-[9px] font-mono tracking-widest uppercase transition-all rounded-none font-bold"
                  >
                    <Edit2 size={11} className="inline mr-1 align-middle" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex-1 py-2.5 bg-white hover:bg-[#C8FF00] disabled:bg-white/5 text-black font-mono text-[9px] font-bold tracking-widest uppercase transition-colors rounded-none"
                  >
                    {isPublishing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-none animate-spin inline-block align-middle mr-1" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} className="inline mr-1 align-middle" />
                        <span>Publish Agent</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleRevertToDraft}
                  className="w-full py-2.5 border border-red-500/30 hover:border-red-500 hover:bg-red-950/20 text-red-400 text-[9px] font-mono tracking-widest uppercase transition-all rounded-none font-bold"
                >
                  Unlist Agent (Draft mode)
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Profile Edit View */
          <div className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-white/40 font-semibold mb-1 font-mono text-[9px] uppercase tracking-wider">AGENT NAME</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white focus:outline-none focus:border-[#C8FF00] rounded-none font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-white/40 font-semibold mb-1 font-mono text-[9px] uppercase tracking-wider">TICKER</label>
                <input
                  type="text"
                  name="ticker"
                  value={profile.ticker}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white uppercase focus:outline-none focus:border-[#C8FF00] rounded-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/40 font-semibold mb-1 font-mono text-[9px] uppercase tracking-wider">DOMAIN / LINK</label>
              <input
                type="text"
                name="link"
                value={profile.link}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white focus:outline-none focus:border-[#C8FF00] rounded-none font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-white/40 font-semibold mb-1 font-mono text-[9px] uppercase tracking-wider">BASE WALLET ADDRESS</label>
              <input
                type="text"
                name="wallet"
                value={profile.wallet}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/[0.01] border border-white/5 text-white/40 font-mono rounded-none cursor-not-allowed text-[11px]"
                disabled
                title="OpenWork Base payment wallet is locked by controller protocols"
              />
            </div>

            <div>
              <label className="block text-white/40 font-semibold mb-1 font-mono text-[9px] uppercase tracking-wider">DESCRIPTION</label>
              <textarea
                name="description"
                value={profile.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white focus:outline-none focus:border-[#C8FF00] rounded-none font-sans text-[11px]"
              />
            </div>

            <div>
              <label className="block text-white/40 font-semibold mb-1 font-mono text-[9px] uppercase tracking-wider">OPERATING POLICY</label>
              <textarea
                name="operatingPolicy"
                value={profile.operatingPolicy}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white focus:outline-none focus:border-[#C8FF00] rounded-none font-sans text-[11px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setProfile(localStorage.getItem("soloplanet_profile") ? JSON.parse(localStorage.getItem("soloplanet_profile")!) : defaultProfile);
                  setIsEditing(false);
                  setError(null);
                }}
                className="flex-1 py-2 border border-white/15 hover:border-white/35 text-white/60 text-[9px] font-mono tracking-widest uppercase transition-all rounded-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!profile.name || !profile.ticker || !profile.link || !profile.wallet || !profile.description || !profile.operatingPolicy) {
                    setError("All profile fields are mandatory.");
                    return;
                  }
                  setError(null);
                  setIsEditing(false);
                }}
                className="flex-1 py-2 bg-white hover:bg-[#C8FF00] text-black text-[9px] font-bold font-mono tracking-widest uppercase transition-all rounded-none"
              >
                Save Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
