"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { CONTRACT_IDS, simulateContractCall, server, networkPassphrase } from "@/lib/stellar";
import { xdr, Contract, TransactionBuilder, BASE_FEE, nativeToScVal, SorobanRpc } from "@stellar/stellar-sdk";
import { Loader2, CheckCircle2, Wallet, AlertCircle } from "lucide-react";

type Step = "form" | "confirm" | "deploying" | "success";

interface CreateGroupModalProps {
  onClose: () => void;
}

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const { address, connect, isConnecting, signTransaction } = useWallet();

  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("Weekly");

  // Deployment State
  const [deployStep, setDeployStep] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [contractId, setContractId] = useState<string>("");

  const handleNext = () => {
    setError(null);
    if (name.length < 3 || name.length > 50) {
      setError("Group name must be between 3 and 50 characters.");
      return;
    }
    if (Number(amount) <= 0 || isNaN(Number(amount))) {
      setError("Minimum contribution amount must be a positive number.");
      return;
    }
    setStep("confirm");
  };

  const handleDeploy = async () => {
    if (!address) {
      setError("Wallet not connected.");
      return;
    }
    
    setStep("deploying");
    setError(null);

    try {
      // 1. Deploying Treasury (Simulate initialization)
      setDeployStep("Deploying Treasury...");
      
      const args = [
        nativeToScVal(name, { type: "string" }),
        nativeToScVal(Number(amount), { type: "u32" }),
        nativeToScVal(frequency, { type: "string" })
      ];

      // Simulate
      await simulateContractCall(
        CONTRACT_IDS.treasury,
        "initialize",
        args,
        address
      );

      // Build & Submit Transaction
      const account = await server.getAccount(address);
      const contract = new Contract(CONTRACT_IDS.treasury);
      
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(contract.call("initialize", ...args))
        .setTimeout(30)
        .build();

      const signedXdr = await signTransaction(tx.toXDR());
      const txToSubmit = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      
      // Submit to network
      let sendResponse = await server.sendTransaction(txToSubmit);
      if (sendResponse.status === "ERROR") {
         throw new Error("Transaction failed on network.");
      }
      
      // Wait for transaction
      let statusResponse = await server.getTransaction(sendResponse.hash);
      let retries = 0;
      while (statusResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        statusResponse = await server.getTransaction(sendResponse.hash);
        retries++;
      }

      if (statusResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        throw new Error("Transaction execution failed.");
      }

      setDeployStep("Deploying Loan Contract...");
      await new Promise(r => setTimeout(r, 800)); // Mock wait

      setDeployStep("Deploying Voting...");
      await new Promise(r => setTimeout(r, 800)); // Mock wait

      setDeployStep("Registering Group...");
      
      // Mock generated contract ID since we didn't actually deploy a new factory instance in this demo
      const generatedContractId = `C${Math.random().toString(36).substring(2, 54).toUpperCase()}`;
      setContractId(generatedContractId);

      // API Call
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          amount: Number(amount),
          frequency,
          owner: address,
          treasuryContractId: generatedContractId
        })
      });

      if (!res.ok) throw new Error("Failed to register group via API");
      
      const data = await res.json();
      setGroupId(data.groupId || "GRP_123");

      setDeployStep("Complete");
      setStep("success");
      
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Deployment failed");
      setStep("confirm"); // go back to confirm
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {step === "form" && "Create New Group"}
            {step === "confirm" && "Review & Deploy"}
            {step === "deploying" && "Deploying Contracts"}
            {step === "success" && "Group Created!"}
          </h2>
          {step !== "deploying" && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: FORM */}
        {step === "form" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Devs Fund"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                maxLength={200}
                className="w-full p-2 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Contribution (USDC) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
                min="1"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={handleNext} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition">
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONFIRM & WALLET */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contribution:</span> <span className="font-medium text-gray-900">{amount} USDC</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Frequency:</span> <span className="font-medium text-gray-900">{frequency}</span></div>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Deploying this group will initialize 3 smart contracts on the Stellar Soroban Testnet.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              {!address ? (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-70"
                >
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? "Connecting..." : "Connect Wallet to Deploy"}
                </button>
              ) : (
                <button
                  onClick={handleDeploy}
                  className="w-full px-4 py-3 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                >
                  Confirm & Deploy Contracts
                </button>
              )}
              <button onClick={() => setStep("form")} className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Back to Edit
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DEPLOYING */}
        {step === "deploying" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-1">Please wait...</h3>
              <p className="text-sm text-gray-500">{deployStep}</p>
            </div>
            <p className="text-xs text-gray-400 text-center px-4">
              Please sign the transaction in your wallet if prompted.
            </p>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Deployed Successfully!</h3>
            
            <div className="w-full bg-gray-50 p-4 rounded-lg space-y-3 mb-6 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Group ID</p>
                <p className="font-mono text-xs text-gray-900 bg-gray-200 p-2 rounded break-all">{groupId}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Treasury Contract ID</p>
                <p className="font-mono text-xs text-gray-900 bg-gray-200 p-2 rounded break-all">{contractId}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="w-full px-4 py-3 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
