import {
  TransactionBuilder,
  xdr,
  Address,
  Operation,
  BASE_FEE,
  hash,
} from "@stellar/stellar-sdk";
import { server, networkPassphrase } from "./stellar";
import { bytesToHex } from "./wasm";

export interface DeployResult {
  contractId: string;
  txHash: string;
}

export interface DeployStep {
  label: string;
  status: "pending" | "in-progress" | "done" | "error";
  txHash?: string;
  contractId?: string;
}

async function submitAndPoll(
  txXdr: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const signedXdr = await signTransaction(txXdr);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction rejected by network`);
  }

  let getResponse = await server.getTransaction(sendResponse.hash);
  while (getResponse.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    getResponse = await server.getTransaction(sendResponse.hash);
  }

  if (getResponse.status === "SUCCESS") {
    return sendResponse.hash;
  }

  throw new Error("Transaction failed on chain");
}

export async function installContractWasm(
  wasm: Uint8Array,
  source: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const account = await server.getAccount(source);

  const op = Operation.uploadContractWasm({ wasm });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  await submitAndPoll(tx.toXDR(), signTransaction);

  return bytesToHex(new Uint8Array(hash(Buffer.from(wasm))));
}

export async function createContract(
  wasmHash: string,
  source: string,
  signTransaction: (xdr: string) => Promise<string>,
  salt?: Uint8Array
): Promise<DeployResult> {
  const account = await server.getAccount(source);
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(32));

  const addr = Address.fromString(source);
  const saltBuffer = Buffer.from(saltBytes);
  const wasmHashBuffer = Buffer.from(wasmHash, "hex");

  const preimage = xdr.ContractIdPreimage.contractIdPreimageFromAddress(
    new xdr.ContractIdPreimageFromAddress({
      address: addr.toScAddress(),
      salt: saltBuffer,
    })
  );

  const preimageHash = hash(preimage.toXDR());
  const contractId = bytesToHex(new Uint8Array(preimageHash));

  const op = Operation.createCustomContract({
    address: addr,
    wasmHash: wasmHashBuffer,
    salt: saltBuffer,
  });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const txHash = await submitAndPoll(tx.toXDR(), signTransaction);

  return { contractId: contractId.toUpperCase(), txHash };
}

export async function deployContract(
  wasm: Uint8Array,
  source: string,
  signTransaction: (xdr: string) => Promise<string>,
  salt?: Uint8Array
): Promise<DeployResult> {
  const wasmHash = await installContractWasm(wasm, source, signTransaction);
  return createContract(wasmHash, source, signTransaction, salt);
}
