'use client';

import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MoreHorizontal, ChevronDown } from 'lucide-react';

const barData = [
  { name: 'J', value: 65 },
  { name: 'F', value: 30 },
  { name: 'M', value: 50 },
  { name: 'A', value: 20 },
  { name: 'M', value: 55 },
];

const pieData = [
  { name: 'United Stage', value: 2467, color: '#64748b' },
  { name: 'Germany', value: 234, color: '#94a3b8' },
  { name: 'Australia', value: 142, color: '#cbd5e1' },
  { name: 'France', value: 82, color: '#e2e8f0' },
];

const expenseData = [
  { name: 'Information technology', amount: '$2,657.89', color: '#1e293b' },
  { name: 'Various shopping', amount: '$2,657.89', color: '#475569' },
  { name: 'Employee salary', amount: '$2,657.89', color: '#64748b' },
];

export function AnalyticsWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Admit Snap */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Admit Snap</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-green-600">+30.00%</span>
            <span className="text-xs text-gray-500">↗</span>
          </div>
          
          <div>
            <h4 className="text-2xl font-bold text-gray-900">$40,585</h4>
            <p className="text-sm text-gray-500">Total Amount</p>
          </div>
          
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <Bar dataKey="value" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Growth */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth</h3>
        
        <div className="relative">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={60}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 space-y-2">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Expenses Summary</h3>
          <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
            <span className="text-sm">March</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: 72 }, { value: 28 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    startAngle={90}
                    endAngle={450}
                    dataKey="value"
                  >
                    <Cell fill="#1e293b" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm font-bold">Total</div>
                <div className="text-xs font-semibold">$9670</div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-2xl font-bold">72%</span>
            <span className="text-sm text-gray-500 ml-1">Total Expense</span>
          </div>
          
          <div className="space-y-3">
            {expenseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}