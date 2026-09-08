import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AccountingView: React.FC<{ establishmentId: string, onBack?: () => void }> = ({ establishmentId, onBack }) => {
  const { ventes, expenses } = useAppStore();

  const data = useMemo(() => {
    const months: Record<string, { revenue: number, expenses: number }> = {};
    
    ventes.filter(v => v.establishmentId === establishmentId).forEach(v => {
      const month = v.date ? new Date(v.date).toLocaleString('fr-FR', { month: 'short' }) : 'N/A';
      months[month] = months[month] || { revenue: 0, expenses: 0 };
      months[month].revenue += v.totalAmount;
    });

    expenses.filter(e => e.establishmentId === establishmentId).forEach(e => {
      const month = e.date ? new Date(e.date).toLocaleString('fr-FR', { month: 'short' }) : 'N/A';
      months[month] = months[month] || { revenue: 0, expenses: 0 };
      months[month].expenses += e.amount;
    });

    return Object.entries(months).map(([name, values]) => ({
      name,
      ...values,
      profit: values.revenue - values.expenses
    }));
  }, [ventes, expenses, establishmentId]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <h3 className="font-black text-gray-900">Bilan Comptable Mensuel</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" name="Revenus" />
            <Bar dataKey="expenses" fill="#ef4444" name="Dépenses" />
            <Bar dataKey="profit" fill="#f59e0b" name="Bénéfice Net" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
