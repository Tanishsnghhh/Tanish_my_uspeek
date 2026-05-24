'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

const statsData = [
  {
    title: 'Earnings',
    amount: '$984.42',
    change: '+12.8%',
    changeAmount: '+$120.8',
    period: 'than last month',
    trending: 'up',
    icon: '💰',
  },
  {
    title: 'Spending',
    amount: '$576.76',
    change: '+2.4%',
    changeAmount: '-$6.8',
    period: 'than last month',
    trending: 'up',
    icon: '💸',
  },
  {
    title: 'Saving',
    amount: '$421.29',
    change: '+6.7%',
    changeAmount: '+$46.1',
    period: 'than last month',
    trending: 'up',
    icon: '💎',
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">{stat.icon}</span>
            <span className="text-sm text-gray-500">{stat.title}</span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">{stat.amount}</h3>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {stat.trending === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  stat.trending === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              <span className="font-medium">{stat.changeAmount}</span> {stat.period}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}