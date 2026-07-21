import React from 'react';
import { useAppStore } from '../store';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Star, TrendingUp, Calendar, MessageSquare, ShieldCheck, StarHalf } from 'lucide-react';

export function GerantAnalytics({ establishmentId }: { establishmentId: string }) {
  const { serviceRequests, relationshipRequests, reservations, reviews } = useAppStore();

  const estServiceRequests = serviceRequests.filter(r => r.establishmentId === establishmentId);
  const estRelRequests = relationshipRequests.filter(r => r.establishmentId === establishmentId);
  const estReservations = reservations ? reservations.filter(r => r.establishmentId === establishmentId) : [];
  const estReviews = reviews ? reviews.filter(r => r.establishmentId === establishmentId) : [];

  const totalRequests = estServiceRequests.length;
  const validatedRequests = estServiceRequests.filter(r => r.status === 'validee').length;
  const acceptanceRate = totalRequests > 0 ? Math.round((validatedRequests / totalRequests) * 100) : 0;
  const pendingConnections = estRelRequests.filter(r => r.status === 'en_attente').length;

  // Rating calculations
  const totalRating = estReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = estReviews.length > 0 ? (totalRating / estReviews.length).toFixed(1) : null;

  // Count distribution of stars
  const starCounts = [0, 0, 0, 0, 0]; // 1-star to 5-star
  estReviews.forEach(r => {
    const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
    starCounts[idx]++;
  });
  
  const ratingDistribution = starCounts.map((count, i) => ({
    stars: `${i + 1} ★`,
    count,
  })).reverse();

  const data = [
    { name: 'Validées', value: validatedRequests },
    { name: 'Refusées', value: estServiceRequests.filter(r => r.status === 'refusee').length },
    { name: 'En attente', value: estServiceRequests.filter(r => r.status === 'en_attente').length },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  // Track daily membership/adhesion requests (type: 'client_join') for the last 7 days
  const joinRequests = estRelRequests.filter(r => r.type === 'client_join');

  const requestsByDay: Record<string, number> = {};
  const resByDay: Record<string, number> = {};
  
  // Populate last 7 days dates to guarantee a clean time-series trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  last7Days.forEach(day => {
    requestsByDay[day] = 0;
    resByDay[day] = 0;
  });

  joinRequests.forEach(req => {
    if (req.date) {
      const day = req.date.split('T')[0];
      if (requestsByDay[day] !== undefined) {
        requestsByDay[day]++;
      }
    }
  });

  estReservations.forEach(res => {
    if (res.date) {
      const day = res.date.split('T')[0];
      if (resByDay[day] !== undefined) {
        resByDay[day]++;
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

  const resChartData = Object.entries(resByDay).map(([key, value]) => {
    const [year, month, day] = key.split('-');
    const displayDate = `${day}/${month}`;
    return {
      date: displayDate,
      fullDate: key,
      'Réservations': value
    };
  }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    
    return (
      <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-amber-500" />
        ))}
        {hasHalf && <StarHalf className="w-4 h-4 fill-amber-500" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 dark:text-gray-700" />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 mb-6">
      {/* Existing Metrics Grid & Rating Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Rating Card */}
        <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-150 dark:border-gray-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <h5 className="text-xs font-bold uppercase tracking-wider">Note moyenne</h5>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                {averageRating ? `${averageRating}/5` : 'N/A'}
              </p>
              {averageRating && renderStars(parseFloat(averageRating))}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold mt-3">
            Basé sur {estReviews.length} avis client{estReviews.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-150 dark:border-gray-900 shadow-sm">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h5 className="text-xs font-bold uppercase tracking-wider">Acceptation</h5>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">{acceptanceRate}%</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-3">Taux d'acceptation des services</p>
        </div>

        <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-150 dark:border-gray-900 shadow-sm">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h5 className="text-xs font-bold uppercase tracking-wider">Connexions</h5>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">{pendingConnections}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-3">Demandes d'adhésion en attente</p>
        </div>

        <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-150 dark:border-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-gray-500 dark:text-gray-400">
            <h5 className="text-xs font-bold uppercase tracking-wider">Statut Services</h5>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded">Total: {totalRequests}</span>
          </div>
          <div className="h-[75px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={15} outerRadius={30} paddingAngle={3} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Charts: Reservations and Adhesions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Reservations Trend Graph */}
        <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-150 dark:border-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h5 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-600 animate-pulse" /> Réservations de tables
              </h5>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">Évolution quotidienne des réservations de tables (7 jours)</p>
            </div>
            <span className="text-xs bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900/30">
              Total : {estReservations.length}
            </span>
          </div>
          
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                  dataKey="Réservations" 
                  stroke="#ea580c" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorReservations)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Membership Requests Trend Graph */}
        <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-150 dark:border-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h5 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Demandes d'Adhésion
              </h5>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">Évolution quotidienne des demandes d'adhésion (7 jours)</p>
            </div>
            <span className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
              Total : {joinRequests.length}
            </span>
          </div>
          
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3182ce" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3182ce" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                  itemStyle={{ fontWeight: 'bold', fontSize: 11, color: '#3182ce' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Demandes" 
                  stroke="#3182ce" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorDemandes)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ratings score distribution */}
      {estReviews.length > 0 && (
        <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-150 dark:border-gray-900 shadow-sm">
          <h5 className="text-sm font-black text-gray-900 dark:text-white mb-3">Répartition des notes client</h5>
          <div className="space-y-2 max-w-md">
            {ratingDistribution.map((item) => {
              const pct = estReviews.length > 0 ? (item.count / estReviews.length) * 100 : 0;
              return (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-500 w-8">{item.stars}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-900 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400 w-12 text-right">{item.count} avis</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
