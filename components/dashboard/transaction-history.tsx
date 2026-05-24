'use client';

import { MoreHorizontal } from 'lucide-react';

const transactions = [
  {
    id: 1,
    name: 'Paypal',
    date: '22/06/2023 - 15:11',
    amount: '$1,000',
    avatar: 'P',
    avatarColor: 'bg-blue-500',
  },
  {
    id: 2,
    name: 'Stripe',
    date: '21/06/2023 - 14:30',
    amount: '$2,500',
    avatar: 'S',
    avatarColor: 'bg-purple-500',
  },
  {
    id: 3,
    name: 'Apple Pay',
    date: '20/06/2023 - 09:15',
    amount: '$750',
    avatar: 'A',
    avatarColor: 'bg-gray-700',
  },
];

export function TransactionHistory() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${transaction.avatarColor}`}>
                      {transaction.avatar}
                    </div>
                    <span className="font-medium text-gray-900">{transaction.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">{transaction.date}</td>
                <td className="py-4 px-4 text-right font-semibold text-gray-900">{transaction.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}