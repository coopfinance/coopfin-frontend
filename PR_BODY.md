## Summary

Closes #17

Adds Playwright E2E test coverage for two critical flows: wallet connect and loan request.

## Changes

- **Playwright setup**: Installed `@playwright/test` and configured with `playwright.config.ts`
- **Wallet Connect tests** (`tests/wallet-connect.spec.ts`):
  - Mock Freighter wallet extension via `page.addInitScript()`
  - Verify "Connect Wallet" button is visible in sidebar
  - Click to open wallet selection modal
  - Select Freighter and verify shortened address appears
  - Click disconnect and verify address clears
- **Loan Request tests** (`tests/loan-request.spec.ts`):
  - Mock API calls with `page.route()`
  - Verify "Request Loan" button opens modal
  - Fill form fields (amount, purpose, repayment period)
  - Connect wallet and submit loan request
  - Validate form disables submit when fields are empty
- **Sidebar wallet UI**: Added wallet connect/disconnect section to sidebar with data-testid attributes for test targeting
- **CI**: Added `e2e` job to `.github/workflows/ci.yml` that runs Playwright tests
- **Script**: Added `test:e2e` script to `package.json`

## Testing

- `npm run test:e2e` runs all 7 Playwright tests
- CI pipeline validates tests pass on PRs

---

ETHEREUM ADDRESS: 0x5e1040927a1E28D740f92De27a3d493b81682D88
