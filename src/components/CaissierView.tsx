import React from 'react';
import { CashierDashboard } from './CashierDashboard';

interface CaissierViewProps {
  initialEstablishmentId?: string;
  onLogout?: () => void;
}

export function CaissierView({ initialEstablishmentId, onLogout }: CaissierViewProps) {
  return (
    <CashierDashboard 
      establishmentId={initialEstablishmentId} 
      onLogout={onLogout} 
    />
  );
}
