"use client";
// TODO: Implement group creation form with Soroban contract initialization
export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Create New Group</h2>
        <p className="text-sm text-gray-500 mb-4">
          This will deploy a new TreasuryContract on Stellar Testnet.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">
            Deploy Contract
          </button>
        </div>
      </div>
    </div>
  );
}
