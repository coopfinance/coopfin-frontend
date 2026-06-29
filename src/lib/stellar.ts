import {
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
} from "@stellar/stellar-sdk";

export const STELLAR_NETWORK =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ||
  "https://horizon-testnet.stellar.org";

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  "https://soroban-testnet.stellar.org";

export const server = new SorobanRpc.Server(SOROBAN_RPC_URL);

export const networkPassphrase =
  STELLAR_NETWORK === "MAINNET" || STELLAR_NETWORK === "PUBLIC"
    ? Networks.PUBLIC
    : Networks.TESTNET;

// Contract IDs from deployments/testnet.json (injected at build time or loaded at runtime)
export const CONTRACT_IDS = {
  treasury:   process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID || "",
  loan:       process.env.NEXT_PUBLIC_LOAN_CONTRACT_ID || "",
  voting:     process.env.NEXT_PUBLIC_VOTING_CONTRACT_ID || "",
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID || "",
  dividend:   process.env.NEXT_PUBLIC_DIVIDEND_CONTRACT_ID || "",
};

/** Format a Stellar amount (7 decimal places) to a human-readable string */
export function formatAmount(stroops: bigint | number, decimals = 2): string {
  const val = Number(stroops) / 10_000_000;
  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Parse a human-readable amount to Stellar base units (7 decimals) */
export function parseAmount(amount: string | number): bigint {
  return BigInt(Math.round(Number(amount) * 10_000_000));
}

/** Shorten a Stellar public key for display */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}

/** Invoke a Soroban contract read-only (simulation only) */
export async function simulateContractCall(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceAccount: string
): Promise<unknown> {
  const account = await server.getAccount(sourceAccount);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation failed: ${result.error}`);
  }
  if (!result.result) return null;
  return scValToNative(result.result.retval);
}
