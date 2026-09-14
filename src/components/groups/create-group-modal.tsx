"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Wallet,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { createGroup } from "@/lib/api";
import { loadAllContractWasms } from "@/lib/wasm";
import {
  installContractWasm,
  createContract,
  type DeployStep,
} from "@/lib/deploy-contract";
import type { ContractType } from "@/lib/wasm";

type FormStep = "form" | "confirm" | "deploying" | "success";

type Frequency = "weekly" | "monthly" | "custom";

interface FormErrors {
  name?: string;
  description?: string;
  minContribution?: string;
  customDays?: string;
}

const FREQUENCY_MAP: Record<Frequency, number> = {
  weekly: 7,
  monthly: 30,
  custom: 0,
};

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Weekly (7 days)",
  monthly: "Monthly (30 days)",
  custom: "Custom",
};

function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}

export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { address, isConnecting, connect, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  const [formStep, setFormStep] = useState<FormStep>("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minContribution, setMinContribution] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [customDays, setCustomDays] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([]);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployedContracts, setDeployedContracts] = useState<Record<string, string> | null>(null);

  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  const contributionPeriodDays =
    frequency === "custom"
      ? parseInt(customDays || "0", 10)
      : FREQUENCY_MAP[frequency];

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!name || name.length < 3 || name.length > 50) {
      newErrors.name = "Group name must be between 3 and 50 characters";
    }

    if (description.length > 200) {
      newErrors.description = "Description must be under 200 characters";
    }

    const amount = parseFloat(minContribution);
    if (!minContribution || isNaN(amount) || amount <= 0) {
      newErrors.minContribution = "Enter a valid minimum contribution amount";
    }

    if (frequency === "custom") {
      const days = parseInt(customDays || "0", 10);
      if (!customDays || isNaN(days) || days < 1) {
        newErrors.customDays = "Enter a valid number of days";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, description, minContribution, frequency, customDays]);

  const handleNext = useCallback(() => {
    if (validate()) {
      setFormStep("confirm");
    }
  }, [validate]);

  const handleBack = useCallback(() => {
    setFormStep("form");
    setDeployError(null);
  }, []);

  const updateDeployStep = (index: number, updates: Partial<DeployStep>) => {
    setDeploySteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const deploySingle = async (
    label: string,
    stepIndex: number,
    wasm: Uint8Array,
    source: string
  ): Promise<string> => {
    updateDeployStep(stepIndex, { status: "in-progress" });
    const wasmHash = await installContractWasm(wasm, source, signTransaction);
    const { contractId, txHash } = await createContract(wasmHash, source, signTransaction);
    updateDeployStep(stepIndex, { status: "done", txHash, contractId });
    return contractId;
  };

  const handleDeploy = async () => {
    if (!address) return;

    setFormStep("deploying");
    setDeployError(null);

    const steps: DeployStep[] = [
      { label: "Deploying Treasury Contract...", status: "pending" },
      { label: "Deploying Loan Contract...", status: "pending" },
      { label: "Deploying Voting Contract...", status: "pending" },
      { label: "Registering with API...", status: "pending" },
    ];
    setDeploySteps(steps);

    try {
      const wasms = await loadAllContractWasms();
      const contractTypes: ContractType[] = ["treasury", "loan", "voting"];
      const ids: Record<string, string> = {};

      for (let i = 0; i < contractTypes.length; i++) {
        const type = contractTypes[i];
        const contractId = await deploySingle(steps[i].label, i, wasms[type], address);
        ids[type] = contractId;
      }

      setDeployedContracts(ids);
      updateDeployStep(3, { status: "in-progress" });

      const amount = parseFloat(minContribution);
      const group = await createGroup({
        name: name.trim(),
        description: description.trim(),
        admin: address,
        minContribution: Math.round(amount * 10_000_000),
        contributionPeriodDays,
        contractAddresses: {
          treasury: ids.treasury,
          loan: ids.loan,
          voting: ids.voting,
        },
      });

      updateDeployStep(3, { status: "done", contractId: group.id });
      setCreatedGroupId(group.id);
      setFormStep("success");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deployment failed";
      setDeployError(message);
      setDeploySteps((prev) =>
        prev.map((s) => (s.status === "in-progress" ? { ...s, status: "error" } : s))
      );
    }
  };

  const handleClose = useCallback(() => {
    if (createdGroupId) {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    }
    onClose();
  }, [createdGroupId, onClose, queryClient]);

  if (!address) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Connect Wallet</h2>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Connect your wallet to create a new group and deploy Soroban contracts.
          </p>
          <button
            onClick={connect}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {formStep === "form" && "Create New Group"}
            {formStep === "confirm" && "Confirm Group Details"}
            {formStep === "deploying" && "Deploying Contracts"}
            {formStep === "success" && "Group Created!"}
          </h2>
          <button
            onClick={handleClose}
            disabled={formStep === "deploying"}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formStep === "form" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wallet className="h-4 w-4" />
                <span>Connected as</span>
                <span className="font-mono font-semibold text-gray-900">
                  {shortenAddress(address)}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="group-name" className="mb-1 block text-sm font-medium text-gray-700">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Savings Group"
                maxLength={50}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="group-desc" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="group-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                maxLength={200}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
                <p className="ml-auto text-xs text-gray-400">{description.length}/200</p>
              </div>
            </div>

            <div>
              <label htmlFor="min-contribution" className="mb-1 block text-sm font-medium text-gray-700">
                Minimum Contribution (USDC) <span className="text-red-500">*</span>
              </label>
              <input
                id="min-contribution"
                type="number"
                step="any"
                min="0"
                value={minContribution}
                onChange={(e) => setMinContribution(e.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {errors.minContribution && (
                <p className="mt-1 text-xs text-red-600">{errors.minContribution}</p>
              )}
            </div>

            <div>
              <label htmlFor="frequency" className="mb-1 block text-sm font-medium text-gray-700">
                Contribution Frequency <span className="text-red-500">*</span>
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                <option value="weekly">{FREQUENCY_LABELS.weekly}</option>
                <option value="monthly">{FREQUENCY_LABELS.monthly}</option>
                <option value="custom">{FREQUENCY_LABELS.custom}</option>
              </select>
              {frequency === "custom" && (
                <div className="mt-2">
                  <label htmlFor="custom-days" className="mb-1 block text-xs font-medium text-gray-600">
                    Number of Days
                  </label>
                  <input
                    id="custom-days"
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  {errors.customDays && <p className="mt-1 text-xs text-red-600">{errors.customDays}</p>}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {formStep === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Group Name</span>
                <span className="font-medium text-gray-900">{name}</span>
              </div>
              {description && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Description</span>
                  <span className="font-medium text-gray-900 max-w-[200px] text-right truncate">
                    {description}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Min Contribution</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(minContribution).toLocaleString()} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frequency</span>
                <span className="font-medium text-gray-900">
                  Every {contributionPeriodDays} day{contributionPeriodDays > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Admin</span>
                <span className="font-mono font-medium text-gray-900 text-xs">
                  {shortenAddress(address, 6)}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Three Soroban smart contracts will be deployed on Stellar Testnet.
              You will need to sign two transactions per contract (install + create) in your wallet.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleBack}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Deploy Contracts
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {formStep === "deploying" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {deploySteps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                    step.status === "done"
                      ? "border-green-200 bg-green-50"
                      : step.status === "error"
                      ? "border-red-200 bg-red-50"
                      : step.status === "in-progress"
                      ? "border-brand-200 bg-brand-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {step.status === "done" ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                  ) : step.status === "error" ? (
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  ) : step.status === "in-progress" ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-600" />
                  ) : (
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium ${
                        step.status === "done"
                          ? "text-green-800"
                          : step.status === "error"
                          ? "text-red-800"
                          : step.status === "in-progress"
                          ? "text-brand-800"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.contractId && (
                      <p className="mt-0.5 font-mono text-xs text-gray-500 truncate">
                        ID: {shortenAddress(step.contractId, 6)}
                      </p>
                    )}
                    {step.txHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${step.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                      >
                        View transaction
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {deployError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Deployment failed</p>
                  <p className="mt-1 text-xs">{deployError}</p>
                </div>
              </div>
            )}

            {deployError && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDeploy}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {formStep === "success" && createdGroupId && deployedContracts && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Group created successfully!</p>
                <p className="mt-0.5 text-xs text-green-600">
                  All contracts have been deployed and registered.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Group ID</span>
                <span className="font-mono font-medium text-gray-900 text-xs truncate ml-2">
                  {createdGroupId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Treasury Contract</span>
                <span className="font-mono font-medium text-gray-900 text-xs">
                  {shortenAddress(deployedContracts.treasury, 6)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Loan Contract</span>
                <span className="font-mono font-medium text-gray-900 text-xs">
                  {shortenAddress(deployedContracts.loan, 6)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Voting Contract</span>
                <span className="font-mono font-medium text-gray-900 text-xs">
                  {shortenAddress(deployedContracts.voting, 6)}
                </span>
              </div>
            </div>

            {deploySteps.map(
              (step) =>
                step.txHash && (
                  <a
                    key={step.txHash}
                    href={`https://stellar.expert/explorer/testnet/tx/${step.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-brand-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="break-all">{step.txHash}</span>
                  </a>
                )
            )}

            <button
              onClick={handleClose}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
