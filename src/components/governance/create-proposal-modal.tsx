"use client";
import { useState } from "react";
import { X } from "lucide-react";
interface Props { onClose: () => void; }
export function CreateProposalModal({ onClose }: Props) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [type, setType] = useState("General");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">New Proposal</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none">
              {["General","LoanApproval","TreasurySpend","AddMember","RemoveMember","UpdateRule"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-300" placeholder="Short, descriptive title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none" placeholder="Explain what you're proposing and why" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancel</button>
          <button disabled={!title || !description} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50" onClick={onClose}>Submit to Stellar</button>
        </div>
      </div>
    </div>
  );
}
