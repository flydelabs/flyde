import React, { useState } from 'react';
import { SecretStorage } from '../lib/secrets';

interface SecretSaveDialogProps {
  isOpen: boolean;
  secretKey: string;
  onSave: (storage: SecretStorage) => void;
  onCancel: () => void;
}

export const SecretSaveDialog: React.FC<SecretSaveDialogProps> = ({
  isOpen,
  secretKey,
  onSave,
  onCancel,
}) => {
  const [selectedStorage, setSelectedStorage] = useState<SecretStorage>('memory');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-6 max-w-md w-full mx-4 z-[101]">
        <h2 className="text-white text-xl font-medium mb-4">Save Secret</h2>
        
        <p className="text-gray-300 mb-6">
          Where would you like to save the secret <span className="font-mono text-sm bg-[#2d2d30] px-2 py-1 rounded">{secretKey}</span>?
        </p>

        <div className="space-y-4 mb-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="storage"
              value="memory"
              checked={selectedStorage === 'memory'}
              onChange={(e) => setSelectedStorage(e.target.value as SecretStorage)}
              className="mt-1 mr-3"
            />
            <div>
              <div className="text-white font-medium">In-Memory Storage (Recommended)</div>
              <div className="text-gray-400 text-sm mt-1">
                Secret will be stored in JavaScript memory only for this session and will be cleared when you close or refresh the browser
              </div>
            </div>
          </label>

          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="storage"
              value="localStorage"
              checked={selectedStorage === 'localStorage'}
              onChange={(e) => setSelectedStorage(e.target.value as SecretStorage)}
              className="mt-1 mr-3"
            />
            <div>
              <div className="text-white font-medium">localStorage (Persistent)</div>
              <div className="text-gray-400 text-sm mt-1">
                Secret will be stored in browser's localStorage and persist across sessions
              </div>
              <div className="text-yellow-400 text-sm mt-1 font-medium">
                ⚠️ Not recommended: localStorage is accessible to all scripts on this domain
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selectedStorage)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Save Secret
          </button>
        </div>
      </div>
    </div>
  );
};