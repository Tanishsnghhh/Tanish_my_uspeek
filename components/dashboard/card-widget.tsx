'use client';

import { ChevronLeft, ChevronRight, Send, ArrowDownLeft, Plus } from 'lucide-react';

export function CardWidget() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Card</h3>
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Credit Card */}
      <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl p-6 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 bg-white/20 rounded-full"></div>
        </div>
        
        <div className="space-y-4">
          <div className="text-2xl font-bold">$34,000.00</div>
          
          <div className="flex items-center space-x-1">
            <span className="text-lg">••••</span>
            <span className="text-lg">••••</span>
            <span className="text-lg">••••</span>
            <span className="text-lg font-semibold">7223</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white/60">Card Holder</p>
              <p className="font-semibold">Mical Smith</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Expires</p>
              <p className="font-semibold">03/26</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Send className="w-4 h-4" />
          <span className="text-sm font-medium">Send</span>
        </button>
        <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <ArrowDownLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Request</span>
        </button>
        <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add</span>
        </button>
      </div>
    </div>
  );
}