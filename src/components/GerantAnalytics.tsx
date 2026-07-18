import React from 'react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function GerantAnalytics({ establishmentId }: { establishmentId: string }) {
  const { serviceRequests, relationshipRequests } = useAppStore();

  const estServiceRequests = serviceRequests.filter(r => r.establishmentId === establishmentId);
  const estRelRequests = relationshipRequests.filter(r => r.establishmentId === establishmentId);

  const totalRequests = estServiceRequests.length;
  const validatedRequests = estServiceRequests.filter(r => r.status === 'validee').length;
  const acceptanceRate = totalRequests > 0 ? Math.round((validatedRequests / totalRequests) * 100) : 0;
  const pendingConnections = estRelRequests.filter(r => r.status === 'en_attente').length;

  const data = [
    { name: 'Validées', value: validatedRequests },
    { name: 'Refusées', value: estServiceRequests.filter(r => r.status === 'refusee').length },
    { name: 'En attente', value: estServiceRequests.filter(r => r.status === 'en_attente').length },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h5 className="text-sm font-medium text-gray-500">Taux d'acceptation</h5>
        <p className="text-3xl font-bold text-gray-900">{acceptanceRate}%</p>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h5 className="text-sm font-medium text-gray-500">Nouvelles demandes connexion</h5>
        <p className="text-3xl font-bold text-gray-900">{pendingConnections}</p>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h5 className="text-sm font-medium text-gray-500">Statut des Réservations</h5>
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={20} outerRadius={40} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
