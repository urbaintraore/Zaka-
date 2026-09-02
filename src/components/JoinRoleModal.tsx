import React, { useState } from 'react';
import { Establishment } from '../types';
import { X, User, Music, Briefcase, Coffee, Sparkles, Shield, Camera, Upload } from 'lucide-react';

interface JoinRoleModalProps {
  establishment: Establishment;
  onClose: () => void;
  onSubmit: (role: 'client' | 'dj' | 'serveur' | 'caissier' | 'menage' | 'vigile', identityPhotoUrl?: string) => void;
}

export function JoinRoleModal({ establishment, onClose, onSubmit }: JoinRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<'client' | 'dj' | 'serveur' | 'caissier' | 'menage' | 'vigile'>('client');
  const [identityPhotoUrl, setIdentityPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    { id: 'client', label: 'Client régulier', icon: User, desc: 'Rejoindre comme simple client' },
    { id: 'dj', label: 'DJ', icon: Music, desc: 'Animer les soirées (peut être dans plusieurs établissements)' },
    { id: 'serveur', label: 'Serveur / Serveuse', icon: Coffee, desc: 'Service en salle (exclusif à cet établissement)' },
    { id: 'caissier', label: 'Caissier', icon: Briefcase, desc: 'Gestion de caisse (exclusif à cet établissement)' },
    { id: 'menage', label: 'Garçon / Fille de ménage', icon: Sparkles, desc: 'Entretien (exclusif à cet établissement)' },
    { id: 'vigile', label: 'Vigile', icon: Shield, desc: 'Sécurité (exclusif à cet établissement)' }
  ] as const;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentityPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await onSubmit(selectedRole, identityPhotoUrl || undefined);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">Rejoindre l'établissement</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choisissez votre rôle pour rejoindre <strong>{establishment.name}</strong>.
            <br/><span className="text-xs text-orange-500 mt-1 block">Note : À part le DJ, les employés ne peuvent être liés qu'à un seul établissement à la fois.</span>
          </p>

          <div className="space-y-3">
            {roles.map(role => {
              const Icon = role.icon;
              const isActive = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id as any)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>{role.label}</h3>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>{role.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedRole !== 'client' && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-800 space-y-3">
              <label className="block text-xs font-bold text-orange-900 dark:text-orange-200 uppercase tracking-wide">
                Photo d'identité (Optionnelle)
              </label>
              <div className="flex items-center gap-4">
                {identityPhotoUrl ? (
                  <div className="relative">
                    <img src={identityPhotoUrl} alt="Identité" className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setIdentityPhotoUrl('')}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-sm cursor-pointer"
                      title="Supprimer la photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>{identityPhotoUrl ? 'Changer de photo' : 'Ajouter une photo'}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Facultatif • JPG, PNG ou WEBP</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </div>
      </div>
    </div>
  );
}
