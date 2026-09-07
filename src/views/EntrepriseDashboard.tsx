import React from 'react';
import { Briefcase, LogOut } from 'lucide-react';

export interface EntrepriseDashboardProps {
  onLogout?: () => void;
  onNavigate?: (tab: any) => void;
  onStartChatWithConv?: (convId: string) => void;
  [key: string]: any;
}

export const EntrepriseDashboard: React.FC<EntrepriseDashboardProps> = (props) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Espace Entreprise</h2>
            <p className="text-xs text-gray-500">Organisez vos événements d'entreprise et sorties d'équipe</p>
          </div>
        </div>
        {props.onLogout && (
          <button onClick={props.onLogout} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl">
            <LogOut size={18} />
          </button>
        )}
      </div>

      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl space-y-3">
        <h3 className="text-lg font-bold">Services Pro & Team Building</h3>
        <p className="text-xs text-blue-100 max-w-xl">
          Bénéficiez de tarifs préférentiels, de facturation unique et d'un accompagnement personnalisé pour vos réceptions et séminaires.
        </p>
        <button className="px-4 py-2 bg-white text-blue-700 font-bold text-xs rounded-xl shadow-sm hover:bg-blue-50 transition-colors">
          Demander un devis
        </button>
      </div>
    </div>
  );
};
