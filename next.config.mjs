/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_STELLAR_NETWORK:
      process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET",
    NEXT_PUBLIC_HORIZON_URL:
      process.env.NEXT_PUBLIC_HORIZON_URL ||
      "https://horizon-testnet.stellar.org",
    NEXT_PUBLIC_SOROBAN_RPC_URL:
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
      "https://soroban-testnet.stellar.org",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  },
};

export default nextConfig;
