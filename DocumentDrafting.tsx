import React, { useState, useEffect } from "react";
import { OperationalDocument } from "../types";
import { Cpu, PenTool, CheckCircle, Scroll, ShieldCheck, History, Sparkles, FileSignature } from "lucide-react";

export default function DocumentDrafting() {
  const [documents, setDocuments] = useState<OperationalDocument[]>(() => {
    const saved = localStorage.getItem("operational_documents");
    return saved ? JSON.parse(saved) : [
      {
        id: "doc-init",
        title: "Soloplanet Agent Operational Charter",
        type: "contract",
        content: `OPERATIONAL AGREEMENT & CHARTER
Effective Date: July 16, 2026

BETWEEN:
ClawBank Central Ledger Protocol (Represented by Manfred, Operator)
AND:
Soloplanet Financial Agent Network (Represented by SPL, Agent)

1. MANDATE & AUTHORITY
The Agent is hereby commissioned on the Base Wallet 0x0C7f37Ec2F2aE089911AF2056BD7b6785246b22a to execute:
- Asset custody and multi-signature capital swaps.
- Automated liquidity provisioning for SPL assets.
- Entity formation and corporate registration filings.

2. CONFIRMATION PROTOCOLS
All withdrawals over $5,000 equivalent require dual-signature authorization of the Operator and Agent. Audit logs must be appended to the state channel ledger every 24 hours.

3. SETTLEMENT & COMPENSATION
For OpenWork operations, SPL is authorized to receive and record invoices routed via Base Network protocols.`,
        signedByOperator: true,
        signedBySoloplanet: true,
        timestamp: "2026-07-16 12:15"
      }
    ];
  });

  const [docType, setDocType] = useState<"contract" | "strategy">("contract");
  const [title, setTitle] = useState("USDC Liquidity & Hedging Strategy");
  const [details, setDetails] = useState("Dual-sided pool rules for SPL and USDC with 15% slippage safety threshold.");
  
  const [activeDoc, setActiveDoc] = useState<OperationalDocument | null>(documents[0]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("operational_documents", JSON.stringify(documents));
  }, [documents]);

  const handleDraftDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;

    setIsDrafting(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          docType: docType,
          details: `Title: ${title}. Description: ${details}`
        })
      });

      if (!response.ok) throw new Error("Failed to draft document");
      const data = await response.json();

      const newDoc: OperationalDocument = {
        id: `doc-${Date.now()}`,
        title: title.trim(),
        type: docType,
        content: data.document || "Failed to generate document text.",
        signedByOperator: false,
        signedBySoloplanet: false,
        timestamp: new Date().toLocaleString()
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDoc(newDoc);
    } catch (err: any) {
      console.error(err);
      setError("Failed to communicate with the Deep Reasoning compiler. Please ensure secrets are configured.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSignOperator = () => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, signedByOperator: true };
    setActiveDoc(updated);
    setDocuments((prev) => prev.map((d) => (d.id === activeDoc.id ? updated : d)));
  };

  const handleSignSoloplanet = () => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, signedBySoloplanet: true };
    setActiveDoc(updated);
    setDocuments((prev) => prev.map((d) => (d.id === activeDoc.id ? updated : d)));
  };

  const isFullyExecuted = activeDoc?.signedByOperator && activeDoc?.signedBySoloplanet;

  return (
    <div className="bg-[#0F0F0F] border border-white/10 rounded-none overflow-hidden shadow-none" id="document-drafting">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-white/5 border border-white/15 flex items-center justify-center text-[#C8FF00] shadow-none">
            <Scroll size={16} />
          </div>
          <div>
            <h3 className="font-serif italic font-bold text-sm text-white">Legal & Strategy Draftsman</h3>
            <p className="text-[9px] text-white/40 font-mono">Secured Document Registry</p>
          </div>
        </div>

        <span className="text-[9px] bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30 px-2.5 py-0.5 rounded-none font-mono font-bold uppercase tracking-wider">
          DEEP THINK COMPILER
        </span>
      </div>

      <div className="p-5 space-y-4 font-sans text-xs">
        {error && (
          <div className="p-3 bg-red-950/20 border border-red-900/35 rounded-none text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Form */}
          <form onSubmit={handleDraftDocument} className="lg:col-span-5 bg-[#0A0A0A] border border-white/5 p-4 rounded-none space-y-4">
            <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono">INITIATE DOCUMENT COMPILE</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDocType("contract")}
                className={`py-2 rounded-none text-[9px] font-bold font-mono uppercase tracking-widest border transition-all ${
                  docType === "contract"
                    ? "bg-[#C8FF00]/10 border-[#C8FF00]/40 text-[#C8FF00]"
                    : "border-white/10 text-white/40 hover:bg-white/5"
                }`}
              >
                Legal Contract
              </button>
              <button
                type="button"
                onClick={() => setDocType("strategy")}
                className={`py-2 rounded-none text-[9px] font-bold font-mono uppercase tracking-widest border transition-all ${
                  docType === "strategy"
                    ? "bg-[#C8FF00]/10 border-[#C8FF00]/40 text-[#C8FF00]"
                    : "border-white/10 text-white/40 hover:bg-white/5"
                }`}
              >
                Strategy Spec
              </button>
            </div>

            <div>
              <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">DOCUMENT TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SPL Asset Swap Agreement"
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#C8FF00] rounded-none"
              />
            </div>

            <div>
              <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">DRAFTING INSTRUCTIONS & PARAMETERS</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Drafting parameters, counterparty details, and execution rules..."
                className="w-full p-3 bg-white/[0.02] border border-white/10 text-white text-xs focus:outline-none focus:border-[#C8FF00] font-sans leading-relaxed rounded-none placeholder:text-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={isDrafting}
              className="w-full py-2.5 bg-white hover:bg-[#C8FF00] text-black font-mono text-[9px] font-bold tracking-widest uppercase transition-colors rounded-none flex items-center justify-center gap-1.5"
            >
              <Sparkles size={11} className={isDrafting ? "animate-pulse" : ""} />
              <span>{isDrafting ? "Compiling with Gemini..." : "Draft Strategy"}</span>
            </button>
          </form>

          {/* Right Previewer */}
          <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/5 rounded-none p-4 flex flex-col justify-between">
            {activeDoc ? (
              <div className="space-y-4 flex flex-col h-full justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between border-b border-white/5 pb-2">
                    <div>
                      <h4 className="font-serif italic font-bold text-white text-sm uppercase">{activeDoc.title}</h4>
                      <span className="text-[9px] font-mono text-white/30">{activeDoc.timestamp}</span>
                    </div>

                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-none border uppercase tracking-wider font-bold ${
                      isFullyExecuted
                        ? "bg-[#C8FF00]/10 border-[#C8FF00]/30 text-[#C8FF00]"
                        : "bg-red-950/20 border-red-900/30 text-red-400"
                    }`}>
                      {isFullyExecuted ? "FULLY EXECUTED" : "SIGNATURES PENDING"}
                    </span>
                  </div>

                  {/* Scrollable text box */}
                  <div className="max-h-[170px] overflow-y-auto pr-1 bg-[#0F0F0F] p-4 rounded-none border border-white/10 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-white/80">
                    {activeDoc.content}
                  </div>
                </div>

                {/* Signatures */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Manfred Sign */}
                    <div className="bg-[#0F0F0F] p-2.5 border border-white/5 flex flex-col justify-between h-16 rounded-none">
                      <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider">OPERATOR: MANFRED</span>
                      {activeDoc.signedByOperator ? (
                        <div className="flex items-center gap-1 text-[#C8FF00] font-mono text-[9px] font-bold uppercase tracking-wider">
                          <ShieldCheck size={11} />
                          <span>STAMPED & SIGNED</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleSignOperator}
                          className="py-1 border border-white/15 hover:border-[#C8FF00] hover:text-[#C8FF00] hover:bg-[#C8FF00]/5 text-white/80 font-mono text-[9px] tracking-wider uppercase transition-all rounded-none"
                        >
                          <span>Sign as Manfred</span>
                        </button>
                      )}
                    </div>

                    {/* Soloplanet Sign */}
                    <div className="bg-[#0F0F0F] p-2.5 border border-white/5 flex flex-col justify-between h-16 rounded-none">
                      <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider">AGENT: SOLOPLANET</span>
                      {activeDoc.signedBySoloplanet ? (
                        <div className="flex items-center gap-1 text-[#C8FF00] font-mono text-[9px] font-bold uppercase tracking-wider">
                          <ShieldCheck size={11} />
                          <span>STAMPED & SIGNED</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleSignSoloplanet}
                          className="py-1 border border-white/15 hover:border-[#C8FF00] hover:text-[#C8FF00] hover:bg-[#C8FF00]/5 text-white/80 font-mono text-[9px] tracking-wider uppercase transition-all rounded-none"
                        >
                          <span>Sign as Agent</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isFullyExecuted && (
                    <div className="bg-[#C8FF00]/10 border border-[#C8FF00]/30 rounded-none py-2 px-3 text-center text-[#C8FF00] text-[9px] font-mono flex items-center justify-center gap-1.5 uppercase tracking-widest font-bold">
                      <FileSignature size={11} />
                      <span>ATTESTATION REGISTERED • IMMUTABLE CONTRACT VALIDATED</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-[10px] font-mono uppercase tracking-wider py-12">
                No active document compiled yet.
              </div>
            )}
          </div>
        </div>

        {/* History Log */}
        <div className="space-y-3 pt-1">
          <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono flex items-center gap-1.5">
            <History size={11} />
            <span>Compiled Document Vault History</span>
          </h4>

          <div className="flex gap-2.5 overflow-x-auto pb-1.5">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className={`px-3 py-2 rounded-none font-mono text-[9px] uppercase tracking-wider border shrink-0 text-left space-y-1 transition-all ${
                  activeDoc?.id === doc.id
                    ? "bg-[#C8FF00]/10 border-[#C8FF00]/40 text-[#C8FF00]"
                    : "bg-white/[0.01] border-white/5 text-white/40 hover:bg-white/5"
                }`}
              >
                <div className="font-serif italic font-bold text-white truncate max-w-[120px]">{doc.title}</div>
                <div className="flex items-center justify-between gap-1.5 text-[8px] text-white/30">
                  <span>{doc.type === "contract" ? "Contract" : "Strategy"}</span>
                  {doc.signedByOperator && doc.signedBySoloplanet && (
                    <span className="text-[#C8FF00] font-bold">✓ Executed</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
