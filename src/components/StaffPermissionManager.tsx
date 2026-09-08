import React from 'react';
import { useAppStore } from '../store';
import { StaffPermissions } from '../types';

export const StaffPermissionManager: React.FC<{ staffMembers: any[] }> = ({ staffMembers }) => {
  const { staffPermissions, updateStaffPermissions } = useAppStore();

  const togglePermission = (userId: string, permission: keyof StaffPermissions) => {
    const current = staffPermissions[userId] || { canAccessPOS: false, canViewAccounting: false, canManageStocks: false, canViewReviews: false };
    updateStaffPermissions(userId, { ...current, [permission]: !current[permission] });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-black text-gray-900">Permissions du Staff</h3>
      {staffMembers.map(member => (
        <div key={member.id} className="p-4 bg-gray-50 rounded-xl space-y-2">
          <p className="font-bold text-sm">{member.name}</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            { (['canAccessPOS', 'canViewAccounting', 'canManageStocks', 'canViewReviews'] as const).map(p => (
              <label key={p} className="flex items-center gap-1">
                <input type="checkbox" checked={staffPermissions[member.id]?.[p] || false} onChange={() => togglePermission(member.id, p)} />
                {p}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
