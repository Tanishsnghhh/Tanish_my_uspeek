'use client';

import { Plus } from 'lucide-react';

const contacts = [
  { name: 'Add', avatar: null, isAdd: true },
  { name: 'Devi', avatar: 'D', color: 'bg-pink-500' },
  { name: 'John', avatar: 'J', color: 'bg-blue-500' },
  { name: 'Will', avatar: 'W', color: 'bg-green-500' },
  { name: 'Kris', avatar: 'K', color: 'bg-purple-500' },
];

export function QuickTransaction() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Transaction</h3>
      
      <div className="grid grid-cols-5 gap-4">
        {contacts.map((contact, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <button
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold transition-transform hover:scale-105 ${
                contact.isAdd 
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                  : contact.color
              }`}
            >
              {contact.isAdd ? (
                <Plus className="w-5 h-5" />
              ) : (
                contact.avatar
              )}
            </button>
            <span className="text-xs font-medium text-gray-700">{contact.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}