import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Store, 
  Phone, 
  Mail, 
  MessageSquare, 
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { Establishment, User } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface QuickFeedbackCardProps {
  establishments: Establishment[];
  currentUser: User | null;
  defaultEstId?: string;
  onSuccess?: () => void;
}

export type FeedbackType = 'issue_establishment' | 'suggestion' | 'other';

interface StoredFeedback {
  id: string;
  type: FeedbackType;
  establishmentId?: string;
  establishmentName?: string;
  issueCategory?: string;
  subject: string;
  message: string;
  userContact: string;
  createdAt: string;
}

const ISSUE_CATEGORIES = [
  'Numéro de téléphone incorrect ou injoignable',
  'Horaires d’ouverture ou jours erronés',
  'Lieu définitivement fermé ou déménagé',
  'Localisation GPS ou quartier inexact',
  'Menu, prix ou photos obsolètes',
  'Autre anomalie sur la fiche'
];

export function QuickFeedbackCard({
  establishments,
  currentUser,
  defaultEstId,
  onSuccess
}: QuickFeedbackCardProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(
    defaultEstId ? 'issue_establishment' : 'issue_establishment'
  );
  const [selectedEstId, setSelectedEstId] = useState<string>(defaultEstId || '');
  const [issueCategory, setIssueCategory] = useState<string>(ISSUE_CATEGORIES[0]);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [userContact, setUserContact] = useState<string>(
    currentUser?.phone || currentUser?.email || ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedEst = establishments.find(e => e.id === selectedEstId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!message.trim()) {
      setErrorMsg('Veuillez décrire le problème ou votre suggestion.');
      triggerHaptic('warning');
      return;
    }

    if (feedbackType === 'issue_establishment' && !selectedEstId) {
      setErrorMsg('Veuillez sélectionner l’établissement concerné.');
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const newFeedback: StoredFeedback = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: feedbackType,
        establishmentId: selectedEstId || undefined,
        establishmentName: selectedEst?.name,
        issueCategory: feedbackType === 'issue_establishment' ? issueCategory : undefined,
        subject: subject.trim() || (feedbackType === 'issue_establishment' ? `Signalement : ${selectedEst?.name || 'Établissement'}` : 'Suggestion d’amélioration'),
        message: message.trim(),
        userContact: userContact.trim() || 'Anonyme',
        createdAt: new Date().toISOString()
      };

      // Persist in localStorage
      const existing = localStorage.getItem('zaka_user_feedbacks');
      const list: StoredFeedback[] = existing ? JSON.parse(existing) : [];
      list.unshift(newFeedback);
      localStorage.setItem('zaka_user_feedbacks', JSON.stringify(list));

      triggerHaptic('success');
      setIsSubmitting(false);
      setIsSubmitted(true);

      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: {
          message: feedbackType === 'issue_establishment'
            ? '✅ Merci ! Votre signalement a bien été enregistré et sera vérifié.'
            : '💡 Merci pour votre suggestion ! Elle a bien été transmise à l’équipe.',
          type: 'success'
        }
      }));

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving feedback:', err);
      setIsSubmitting(false);
      setErrorMsg("Une erreur s'est produite lors de l'envoi.");
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setMessage('');
    setSubject('');
    setSelectedEstId('');
    setErrorMsg('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Signalement & Suggestions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Signalez une anomalie sur une fiche ou proposez une amélioration.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-850">
          <Sparkles className="w-3 h-3" /> Rapide & Direct
        </span>
      </div>

      {isSubmitted ? (
        <div className="py-8 text-center space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-gray-900 dark:text-white">
            Merci pour votre contribution !
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
            Votre retour a été transmis à l'équipe Zaka+. Vos remarques nous permettent de maintenir des fiches fiables et d'améliorer constamment l'application pour la communauté.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Envoyer un autre retour
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Quel type de retour souhaitez-vous partager ?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFeedbackType('issue_establishment');
                }}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                  feedbackType === 'issue_establishment'
                    ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500/20'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 shrink-0 ${feedbackType === 'issue_establishment' ? 'text-orange-600' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">Signaler un problème</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Fiche établissement</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFeedbackType('suggestion');
                }}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                  feedbackType === 'suggestion'
                    ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500/20'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Lightbulb className={`w-4 h-4 shrink-0 ${feedbackType === 'suggestion' ? 'text-amber-500' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">Suggérer une idée</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Fonctionnalité, ergonomie</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFeedbackType('other');
                }}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                  feedbackType === 'other'
                    ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500/20'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <HelpCircle className={`w-4 h-4 shrink-0 ${feedbackType === 'other' ? 'text-orange-600' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">Autre remarque</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Commentaire général</p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional: Establishment selector if issue on establishment */}
          {feedbackType === 'issue_establishment' && (
            <div className="space-y-3 p-3.5 bg-gray-50 dark:bg-gray-850/50 rounded-2xl border border-gray-150 dark:border-gray-800">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-orange-500" />
                  Établissement concerné <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEstId}
                  onChange={(e) => setSelectedEstId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-750 rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Sélectionner un établissement...</option>
                  {establishments.map(est => (
                    <option key={est.id} value={est.id}>
                      {est.name} ({est.neighborhood || est.quarter || est.city || 'Ouagadougou'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Type de problème rencontré
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-750 rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {ISSUE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Subject field (for suggestions or other) */}
          {feedbackType !== 'issue_establishment' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Titre de votre suggestion
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Ajouter le paiement par Moov Money, mode hors-ligne..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Description Textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Description détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                feedbackType === 'issue_establishment'
                  ? "Précisez l'erreur observée (ex: le bon numéro WhatsApp est le +226 XX XX XX XX, le maquis a fermé la semaine passée...)"
                  : "Expliquez votre idée en quelques mots : ce que vous aimeriez faire et pourquoi ce serait utile..."
              }
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400 resize-y"
              required
            />
          </div>

          {/* Optional contact info */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Votre contact pour le suivi (facultatif)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={userContact}
                onChange={(e) => setUserContact(e.target.value)}
                placeholder="Numéro WhatsApp ou email pour vous tenir informé"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          {/* Submit button */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer mon retour'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
