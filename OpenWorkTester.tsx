import React, { useState, useEffect } from "react";
import { PaidTask } from "../types";
import { DollarSign, Layers, CheckCircle, ArrowRightLeft, FileCheck } from "lucide-react";

interface OpenWorkTesterProps {
  onPaymentConfirmed?: (task: PaidTask) => void;
}

export default function OpenWorkTester({ onPaymentConfirmed }: OpenWorkTesterProps) {
  const baseWallet = "0x0C7f37Ec2F2aE089911AF2056BD7b6785246b22a";
  
  const [tasks, setTasks] = useState<PaidTask[]>(() => {
    const saved = localStorage.getItem("openwork_tasks");
    const initialList: PaidTask[] = [
      {
        id: "task-init",
        taskReference: "OW-REF-098",
        title: "Initial Soloplanet Setup & Wallet Verification",
        amount: 1.00,
        currency: "USDC",
        recipientWallet: baseWallet,
        status: "paid",
        txHash: "0x3ab8e08d6d5392e21b16ee979b93952ba5cbe3a7b6222b9f36f32fa1d5ee98cf",
        timestamp: "2026-07-16 11:24:12"
      },
      {
        id: "task-test-audit",
        taskReference: "OW-REF-502",
        title: "OpenWork Paid System Verification Test",
        amount: 0.10,
        currency: "USDC",
        recipientWallet: baseWallet,
        status: "paid",
        txHash: "0x1a8f9d0c2e3a4b5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
        timestamp: "2026-07-16 15:48:43"
      }
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.some((t: any) => t.id === "task-test-audit")) {
          return [initialList[1], ...parsed];
        }
        return parsed;
      } catch (e) {
        return initialList;
      }
    }
    return initialList;
  });

  const [title, setTitle] = useState("Draft ClawBank Liquidity Rule V1");
  const [amount, setAmount] = useState(5.00);
  const [currency, setCurrency] = useState("USDC");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTask, setActiveTask] = useState<PaidTask | null>(null);
  const [step, setStep] = useState<"setup" | "invoice" | "completed">("setup");

  useEffect(() => {
    localStorage.setItem("openwork_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    const ref = `OW-REF-${Math.floor(100 + Math.random() * 900)}`;
    const newTask: PaidTask = {
      id: `task-${Date.now()}`,
      taskReference: ref,
      title: title.trim(),
      amount: amount,
      currency: currency,
      recipientWallet: baseWallet,
      status: "pending",
      timestamp: new Date().toLocaleString()
    };

    setActiveTask(newTask);
    setStep("invoice");
  };

  const handleSimulatePayment = async () => {
    if (!activeTask) return;
    setIsProcessing(true);

    // Simulate cryptographic on-chain routing on Base Network L2
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate simulated Base transaction hash
    const hex = "0123456789abcdef";
    let hash = "0x";
    for (let i = 0; i < 64; i++) {
      hash += hex[Math.floor(Math.random() * 16)];
    }

    const paidTask: PaidTask = {
      ...activeTask,
      status: "paid",
      txHash: hash,
      timestamp: new Date().toLocaleString()
    };

    setTasks((prev) => [paidTask, ...prev]);
    setActiveTask(paidTask);
    setStep("completed");
    setIsProcessing(false);

    if (onPaymentConfirmed) {
      onPaymentConfirmed(paidTask);
    }
  };

  const handleResetForm = () => {
    setTitle("Draft ClawBank Liquidity Rule V1");
    setAmount(5.00);
    setStep("setup");
    setActiveTask(null);
  };

  return (
    <div className="bg-[#0F0F0F] border border-white/10 rounded-none overflow-hidden shadow-none" id="openwork-tester">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-white/5 border border-white/15 flex items-center justify-center text-[#C8FF00] shadow-none">
            <DollarSign size={16} />
          </div>
          <div>
            <h3 className="font-serif italic font-bold text-sm text-white">OpenWork Payment Rail</h3>
            <p className="text-[9px] text-white/40 font-mono">Routing: Base Network L2</p>
          </div>
        </div>

        <span className="text-[9px] bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30 px-2.5 py-0.5 rounded-none font-mono font-bold uppercase tracking-wider">
          TEST STATION
        </span>
      </div>

      <div className="p-5 space-y-4">
        {step === "setup" && (
          <form onSubmit={handleCreateInvoice} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">TASK BRIEF TITLE / WORK COMPLETED</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Describe work completed..."
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white text-xs focus:outline-none focus:border-[#C8FF00] font-sans rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">INVOICE AMOUNT</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white text-xs focus:outline-none focus:border-[#C8FF00] font-mono rounded-none"
                />
              </div>

              <div>
                <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">SETTLEMENT TOKEN</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 text-white text-xs focus:outline-none focus:border-[#C8FF00] font-mono rounded-none"
                >
                  <option value="USDC">USDC (USD Coin)</option>
                  <option value="XRP">XRP (Ripple)</option>
                  <option value="RLUSD">RLUSD (Ripple USD)</option>
                  <option value="CLAW">CLAW (ClawBank)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">TARGET WALLET PROTOCOL</label>
              <input
                type="text"
                value={baseWallet}
                disabled
                className="w-full px-3 py-2 bg-white/[0.01] border border-white/5 text-white/40 text-xs font-mono rounded-none cursor-not-allowed"
                title="L2 Routing Wallet Lock"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-white hover:bg-[#C8FF00] text-black text-[9px] font-mono font-bold tracking-widest uppercase transition-colors rounded-none flex items-center justify-center gap-2"
            >
              <FileCheck size={12} />
              <span>Generate Payment Invoice Request</span>
            </button>
          </form>
        )}

        {step === "invoice" && activeTask && (
          <div className="bg-[#0A0A0A] border border-white/5 rounded-none p-5 space-y-4 font-mono text-xs text-white/70">
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div>
                <h4 className="text-white font-bold font-serif italic text-sm">INVOICE: {activeTask.taskReference}</h4>
                <span className="text-[9px] text-white/30">{activeTask.timestamp}</span>
              </div>
              <span className="bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30 px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider">
                WAITING FOR ROUTER
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">TASK BRIEF:</span>
                <span className="text-white/90 font-sans truncate max-w-[200px]">{activeTask.title}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">AMOUNT DUE:</span>
                <span className="text-[#C8FF00] font-bold">{activeTask.amount.toFixed(2)} {activeTask.currency}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">ROUTE PATH:</span>
                <span className="text-white/50 truncate max-w-[200px]">{activeTask.recipientWallet}</span>
              </div>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full py-2.5 bg-[#C8FF00] hover:bg-[#bce600] disabled:bg-white/5 disabled:text-white/20 text-black text-[10px] font-mono font-bold tracking-widest uppercase transition-colors rounded-none flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-none animate-spin" />
                  <span>Routing funds on Base Network...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft size={12} />
                  <span>Execute Simulated Payment Routing</span>
                </>
              )}
            </button>
          </div>
        )}

        {step === "completed" && activeTask && (
          <div className="bg-[#C8FF00]/5 border border-[#C8FF00]/25 rounded-none p-5 space-y-4 font-mono text-xs text-white/70">
            <div className="flex justify-between items-start border-b border-[#C8FF00]/10 pb-3">
              <div>
                <h4 className="text-white font-bold font-serif italic text-sm flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#C8FF00]" />
                  RECEIPT CONFIRMED
                </h4>
                <span className="text-[9px] text-[#C8FF00]/80 font-mono">Invoice: {activeTask.taskReference}</span>
              </div>
              <span className="bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30 px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider">
                AUDITED & SETTLED
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/30">SETTLED VALUE:</span>
                <span className="text-[#C8FF00] font-bold">{activeTask.amount.toFixed(2)} {activeTask.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">RECIPIENT:</span>
                <span className="text-white/60 truncate max-w-[180px]">{activeTask.recipientWallet}</span>
              </div>
              <div className="flex flex-col pt-2 gap-1 border-t border-white/5 mt-2">
                <span className="text-white/30 text-[9px]">TRANSACTION HASH (BASE L2):</span>
                <span className="text-[#C8FF00] text-[9px] select-all truncate bg-[#0A0A0A] px-2.5 py-2 rounded-none border border-white/5" title={activeTask.txHash}>
                  {activeTask.txHash}
                </span>
              </div>
            </div>

            <button
              onClick={handleResetForm}
              className="w-full py-2 border border-white/15 hover:border-[#C8FF00] hover:text-[#C8FF00] hover:bg-[#C8FF00]/5 text-white/80 text-[9px] font-mono tracking-widest uppercase transition-all rounded-none font-bold"
            >
              Run Another Paid-Work Test
            </button>
          </div>
        )}

        {/* Payment History Log */}
        <div className="space-y-2.5">
          <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono flex items-center gap-1.5">
            <Layers size={11} />
            <span>Operational Payment Ledger ({tasks.length})</span>
          </h4>
          
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div key={task.id} className="bg-[#0A0A0A] border border-white/5 p-3 rounded-none text-[11px] font-mono flex justify-between items-center">
                <div className="space-y-1 max-w-[70%]">
                  <span className="text-white/80 font-serif italic truncate block leading-tight font-semibold">{task.title}</span>
                  <span className="text-[9px] text-white/30 block truncate" title={task.txHash}>
                    Ref: {task.taskReference} • {task.txHash ? `Tx: ${task.txHash.slice(0, 10)}...${task.txHash.slice(-8)}` : "No Hash"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#C8FF00] font-bold block">+{task.amount.toFixed(2)} {task.currency}</span>
                  <span className="text-[9px] text-white/30 block">{task.timestamp.split(",")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
