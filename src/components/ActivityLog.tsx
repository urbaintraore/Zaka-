import React from 'react';
import { ActivityLog } from '../types';
import { LayoutGrid, FileText, Package, UserPlus } from 'lucide-react';

export const ActivityLogComponent: React.FC<{ logs: ActivityLog[] }> = ({ logs }) => {
  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'recruitment': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'expense': return <FileText className="w-4 h-4 text-red-500" />;
      case 'stock': return <Package className="w-4 h-4 text-orange-500" />;
      default: return <LayoutGrid className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4">Activité Récente</h3>
      <div className="space-y-4">
        {logs.slice(0, 5).map(log => (
          <div key={log.id} className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">{getIcon(log.type)}</div>
            <div>
              <p className="text-sm font-medium text-gray-800">{log.message}</p>
              <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
