"use client";

export type ContractType = "treasury" | "loan" | "voting";

export const CONTRACT_WASM_PATHS: Record<ContractType, string> = {
  treasury: "/wasm/treasury_contract.wasm",
  loan: "/wasm/loan_contract.wasm",
  voting: "/wasm/voting_contract.wasm",
};

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function loadContractWasm(type: ContractType): Promise<Uint8Array> {
  try {
    const res = await fetch(CONTRACT_WASM_PATHS[type]);
    if (res.ok) {
      return new Uint8Array(await res.arrayBuffer());
    }
  } catch {}
  throw new Error(
    `WASM file not found for ${type} contract. ` +
      `Place the compiled WASM at ${CONTRACT_WASM_PATHS[type]}`
  );
}

export async function loadAllContractWasms(): Promise<Record<ContractType, Uint8Array>> {
  const [treasury, loan, voting] = await Promise.all([
    loadContractWasm("treasury"),
    loadContractWasm("loan"),
    loadContractWasm("voting"),
  ]);
  return { treasury, loan, voting };
}
