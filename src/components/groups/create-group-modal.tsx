"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface CreateGroupModalProps {
  onClose: () => void;
}

type Step = "form" | "deploying" | "success" | "error";

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minContribution: "",
    cycleDuration: "30",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || formData.name.length < 3) {
      setError("Group name must be at least 3 characters");
      return;
    }
    if (!formData.minContribution || Number(formData.minContribution) <= 0) {
      setError("Minimum contribution must be greater than 0");
      return;
    }

    setStep("deploying");

    // Simulate Soroban contract deployment
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      // In production, this would call the Stellar contract deployment API
      setStep("success");
    } catch {
      setError("Contract deployment failed. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        {step === "form" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create New Group</h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              This will deploy a new TreasuryContract on Stellar Testnet.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Savings Circle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What is this group for?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Contribution (USDC) *</label>
                <input
                  type="number"
                  name="minContribution"
                  value={formData.minContribution}
                  onChange={handleChange}
                  placeholder="10"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Duration (days)</label>
                <select
                  name="cycleDuration"
                  value={formData.cycleDuration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="7">7 days (Weekly)</option>
                  <option value="14">14 days (Bi-weekly)</option>
                  <option value="30">30 days (Monthly)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Deploy Contract
                </button>
              </div>
            </form>
          </>
        )}

        {step === "deploying" && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deploying Contract</h3>
            <p className="text-sm text-gray-500 text-center">
              Please wait while we deploy your TreasuryContract to Stellar Testnet...
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Group Created!</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Your TreasuryContract has been deployed to Stellar Testnet.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center py-8">
            <AlertCircle className="w-10 h-10 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deployment Failed</h3>
            <p className="text-sm text-gray-500 text-center mb-4">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("form")}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
