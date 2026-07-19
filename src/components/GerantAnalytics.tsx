import React from 'react';
import { useAppStore } from '../store';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

  // Track daily membership/adhesion requests (type: 'client_join') for the last 7 days
  const joinRequests = estRelRequests.filter(r => r.type === 'client_join');

  const requestsByDay: Record<string, number> = {};
  
  // Populate last 7 days dates to guarantee a clean time-series trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  last7Days.forEach(day => {
    requestsByDay[day] = 0;
  });

  joinRequests.forEach(req => {
    if (req.date) {
      const day = req.date.split('T')[0];
      if (requestsByDay[day] !== undefined) {
        requestsByDay[day]++;
      }
    }
  });

  const chartData = Object.entries(requestsByDay).map(([key, value]) => {
    const [year, month, day] = key.split('-');
    const displayDate = `${day}/${month}`;
    return {
      date: displayDate,
      fullDate: key,
      'Demandes': value
    };
  }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Existing Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Daily Membership Requests Trend Graph */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="text-sm font-bold text-gray-900">Demandes d'Adhésion</h5>
            <p className="text-xs text-gray-500 font-medium">Évolution quotidienne des demandes d'adhésion (7 derniers jours)</p>
          </div>
          <span className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full">
            Total : {joinRequests.length}
          </span>
        </div>
        
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1px solid #f1f5f9', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' 
                }} 
                labelStyle={{ fontWeight: 'bold', fontSize: 11, color: '#1e293b' }}
                itemStyle={{ fontWeight: 'bold', fontSize: 11, color: '#ea580c' }}
              />
              <Area 
                type="monotone" 
                dataKey="Demandes" 
                stroke="#ea580c" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorDemandes)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
