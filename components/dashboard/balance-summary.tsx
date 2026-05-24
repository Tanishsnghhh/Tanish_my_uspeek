'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { ChevronDown } from 'lucide-react';

const chartData = [
  { month: 'Jan', value: 30000 },
  { month: 'Feb', value: 45000 },
  { month: 'Mar', value: 35000 },
  { month: 'Apr', value: 40000 },
  { month: 'May', value: 50000 },
  { month: 'Jun', value: 70685 },
  { month: 'Jul', value: 75000 },
  { month: 'Aug', value: 72000 },
  { month: 'Sep', value: 78000 },
  { month: 'Oct', value: 68000 },
  { month: 'Nov', value: 82000 },
];

export function BalanceSummary() {
  const [selectedMonth, setSelectedMonth] = useState('March');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700 text-white p-3 rounded-lg shadow-lg">
          <p className="font-semibold">${payload[0].value.toLocaleString()}</p>
          <p className="text-sm opacity-80">Value | {label} 20</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Balance Summary</h2>
        <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
          <span>{selectedMonth}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickFormatter={(value) => `$${(value / 1000)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x="Jun" stroke="#64748b" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#64748b"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#64748b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}