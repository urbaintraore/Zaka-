import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ExpenseRecord } from '../types';

export const AddExpenseForm: React.FC<{ establishmentId: string, onClose: () => void }> = ({ establishmentId, onClose }) => {
  const { addExpense, addActivityLog } = useAppStore();
  const [formData, setFormData] = useState({
    type: 'loyer' as ExpenseRecord['type'],
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Omit<ExpenseRecord, 'id'> = {
      establishmentId,
      ...formData,
      amount: parseFloat(formData.amount)
    };
    addExpense(newExpense);
    addActivityLog({
      establishmentId,
      type: 'expense',
      message: `Nouvelle dépense de ${newExpense.amount} enregistrée (${newExpense.type})`
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <h3 className="font-black text-gray-900">Enregistrer une dépense</h3>
      <div>
        <label className="text-xs font-bold text-gray-700">Type</label>
        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-xs">
          {['loyer', 'electricite', 'eau', 'personnel', 'marchandise', 'autre'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-700">Montant</label>
        <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-xs" />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-700">Description</label>
        <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-xs" />
      </div>
      <button type="submit" className="w-full py-2 bg-red-600 text-white font-bold rounded-xl text-xs">Enregistrer</button>
    </form>
  );
};
