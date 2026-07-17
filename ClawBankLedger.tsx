import React, { useState, useEffect } from "react";
import { ClawBankBalance } from "../types";
import { Coins, ArrowRight, History, CreditCard, ShieldCheck } from "lucide-react";

export default function ClawBankLedger() {
  const [balances, setBalances] = useState<ClawBankBalance[]>(() => {
    const saved = localStorage.getItem("clawbank_balances");
    return saved ? JSON.parse(saved) : [
      { token: "USDC", amount: 24500.00, valueUsd: 24500.00, logoColor: "bg-blue-600" },
      { token: "XRP", amount: 45000.00, valueUsd: 49500.00, logoColor: "bg-indigo-600" },
      { token: "RLUSD", amount: 10000.00, valueUsd: 10000.00, logoColor: "bg-teal-600" },
      { token: "CLAW", amount: 150000.00, valueUsd: 15000.00, logoColor: "bg-emerald-600" }
    ];
  });

  const [sendAmount, setSendAmount] = useState("");
  const [sendToken, setSendToken] = useState("USDC");
  const [destination, setDestination] = useState("0x0C7f37Ec2F2aE089911AF2056BD7b6785246b22a");
  const [isSending, setIsSending] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("clawbank_tx_history");
    return saved ? JSON.parse(saved) : [
      { id: "tx-init", token: "USDC", amount: 500, type: "deposit", desc: "ClawBank Vault Top-up", timestamp: "2026-07-15 15:45" }
    ];
  });

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("clawbank_balances", JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    localStorage.setItem("clawbank_tx_history", JSON.stringify(txHistory));
  }, [txHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(sendAmount);
    if (!sendAmount || isNaN(amountNum) || amountNum <= 0) return;

    // Check if enough balance
    const balanceItem = balances.find((b) => b.token === sendToken);
    if (!balanceItem || balanceItem.amount < amountNum) {
      setNotification("Error: Insufficient assets in vault ledger.");
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setIsSending(true);
    setNotification(null);

    // Simulate block consensus
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update balances
    setBalances((prev) =>
      prev.map((b) => {
        if (b.token === sendToken) {
          const newAmount = b.amount - amountNum;
          return {
            ...b,
            amount: newAmount,
            valueUsd: sendToken === "CLAW" ? newAmount * 0.10 : sendToken === "XRP" ? newAmount * 1.10 : newAmount
          };
        }
        return b;
      })
    );

    // Add to history
    const newTx = {
      id: `tx-${Date.now()}`,
      token: sendToken,
      amount: amountNum,
      type: "withdrawal",
      desc: `Transfer to ${destination.slice(0, 6)}...${destination.slice(-4)}`,
      timestamp: new Date().toLocaleString()
    };

    setTxHistory((prev) => [newTx, ...prev]);
    setIsSending(false);
    setSendAmount("");
    setNotification(`Successfully moved ${amountNum} ${sendToken} to ${destination.slice(0, 10)}...`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApplePayTopup = async () => {
    const topupAmount = 1000;
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Credit USDC balance
    setBalances((prev) =>
      prev.map((b) => {
        if (b.token === "USDC") {
          return { ...b, amount: b.amount + topupAmount, valueUsd: b.amount + topupAmount };
        }
        return b;
      })
    );

    const newTx = {
      id: `tx-${Date.now()}`,
      token: "USDC",
      amount: topupAmount,
      type: "deposit",
      desc: "Apple Pay Debit top-up",
      timestamp: new Date().toLocaleString()
    };

    setTxHistory((prev) => [newTx, ...prev]);
    setIsSending(false);
    setNotification("Successfully topped up 1,000.00 USDC via Apple Pay debit!");
    setTimeout(() => setNotification(null), 4000);
  };

  const totalVaultValue = balances.reduce((sum, b) => sum + b.valueUsd, 0);

  return (
    <div className="bg-[#0F0F0F] border border-white/10 rounded-none overflow-hidden shadow-none" id="clawbank-ledger">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-white/5 border border-white/15 flex items-center justify-center text-[#C8FF00] shadow-none">
            <Coins size={16} />
          </div>
          <div>
            <h3 className="font-serif italic font-bold text-sm text-white">ClawBank Asset Ledger</h3>
            <p className="text-[9px] text-white/40 font-mono">Managed Vault</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] text-white/40 font-mono block uppercase tracking-wider">TOTAL VALUE</span>
          <span className="text-sm font-mono font-bold text-[#C8FF00]">
            ${totalVaultValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {notification && (
          <div className={`p-3 rounded-none text-xs leading-relaxed border ${
            notification.includes("Error")
              ? "bg-red-950/20 border-red-900/35 text-red-300"
              : "bg-emerald-950/20 border-emerald-900/35 text-emerald-300"
          }`}>
            {notification}
          </div>
        )}

        {/* Balance Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {balances.map((bal) => (
            <div key={bal.token} className="bg-[#0A0A0A] border border-white/5 p-3.5 rounded-none space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-none ${bal.token === "CLAW" ? "bg-[#C8FF00]" : "bg-white/40"}`} />
                <span className="font-mono text-xs font-bold text-white/90">{bal.token}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-sm font-mono font-bold text-white block">
                  {bal.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] font-mono text-white/40 block uppercase tracking-wide">
                  ${bal.valueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Transfer and Top-up Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Send Capital */}
          <form onSubmit={handleSend} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-none space-y-4 font-sans text-xs">
            <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono">OUTBOUND CAPITAL TRANSFERS</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">ASSET</label>
                <select
                  value={sendToken}
                  onChange={(e) => setSendToken(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#0F0F0F] border border-white/10 text-white font-mono rounded-none"
                >
                  {balances.map((b) => (
                    <option key={b.token} value={b.token}>
                      {b.token}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">AMOUNT</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white/[0.02] border border-white/10 text-white focus:outline-none focus:border-[#C8FF00] font-mono rounded-none placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-white/40 font-mono mb-1 uppercase tracking-wider">DESTINATION ADDRESS</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#C8FF00] rounded-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2 bg-white hover:bg-[#C8FF00] text-black font-mono text-[9px] font-bold tracking-widest uppercase transition-colors rounded-none flex items-center justify-center gap-1.5"
            >
              <ArrowRight size={11} />
              <span>{isSending ? "Validating Block..." : "Transfer Funds"}</span>
            </button>
          </form>

          {/* Apple Pay & Quick Functions */}
          <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-none space-y-4 flex flex-col justify-between font-sans text-xs">
            <div>
              <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono mb-2">QUICK VAULT ACTIONS</h4>
              <p className="text-white/60 leading-relaxed font-light">
                Generate instant top-up links or debit your verified accounts. Transactions are audited and cryptographically locked.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleApplePayTopup}
                disabled={isSending}
                className="w-full py-2.5 bg-[#C8FF00] hover:bg-[#bce600] disabled:bg-white/5 text-black font-mono text-[9px] font-bold tracking-widest uppercase transition-colors rounded-none flex items-center justify-center gap-1.5"
              >
                <CreditCard size={12} />
                <span>Top-up $1,000 via Apple Pay</span>
              </button>

              <div className="text-[9px] font-mono text-white/40 text-center flex items-center justify-center gap-1.5 bg-white/[0.02] p-2 rounded-none border border-white/5">
                <ShieldCheck size={11} className="text-[#C8FF00]" />
                <span className="uppercase tracking-wider">Audited reserves: 100% On-Chain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="space-y-3">
          <h4 className="text-[9px] uppercase tracking-wider text-white/40 font-bold font-mono flex items-center gap-1.5">
            <History size={11} />
            <span>Consensus Vault Log ({txHistory.length})</span>
          </h4>

          <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
            {txHistory.map((tx) => (
              <div key={tx.id} className="bg-[#0A0A0A] border border-white/5 p-3 rounded-none text-[11px] font-mono flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-white/80 font-sans font-light">{tx.desc}</span>
                  <span className="text-[9px] text-white/30 block">{tx.timestamp}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${tx.type === "withdrawal" ? "text-red-400" : "text-[#C8FF00]"}`}>
                    {tx.type === "withdrawal" ? "−" : "+"}
                    {tx.amount.toLocaleString()} {tx.token}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
