import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Briefcase, MapPin, Clock, MessageSquare, Mail, X, Send, CheckCircle2 } from 'lucide-react';

interface RecruitmentsViewProps {
  onNavigate?: (tab: any) => void;
  onStartChatWithConv?: (convId: string) => void;
}

export function RecruitmentsView({ onNavigate, onStartChatWithConv }: RecruitmentsViewProps) {
  const { 
    publications, 
    establishments, 
    currentUser, 
    createConversation, 
    setGlobalError,
    applications,
    addApplication
  } = useAppStore();

  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobs = publications.filter(p => p.type === 'recrutement' && p.status === 'active');

  const handleStartChat = async (estId: string, estName: string, ownerId: string) => {
    if (!currentUser) {
      setGlobalError({ message: "Veuillez vous connecter pour démarrer une discussion.", type: 'info' });
      if (onNavigate) onNavigate('profile');
      return;
    }
    try {
      const convId = await createConversation(currentUser.id, estId, currentUser.name, estName, ownerId);
      if (onStartChatWithConv) {
        onStartChatWithConv(convId);
      } else if (onNavigate) {
        onNavigate('messages');
      }
    } catch (err: any) {
      console.error("Erreur lancement discussion :", err);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour postuler.", type: 'info' });
      if (onNavigate) onNavigate('profile');
      return;
    }
    if (!selectedJob) return;

    setIsSubmitting(true);
    try {
      const est = establishments.find(e => e.id === selectedJob.establishmentId);
      await addApplication({
        clientId: currentUser.id,
        clientName: currentUser.name,
        publicationId: selectedJob.id,
        publicationTitle: selectedJob.title,
        establishmentId: selectedJob.establishmentId,
        establishmentName: est?.name || 'Établissement',
        message: applyMessage,
      });
      setApplyMessage('');
      setSelectedJob(null);
      alert("Votre candidature a été transmise avec succès ! Retrouvez son statut dans votre profil.");
    } catch (error) {
      console.error("Erreur lors de la candidature:", error);
      alert("Une erreur est survenue lors de l'envoi de votre candidature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <h2 className="text-2xl font-black text-gray-900 mb-2">Offres d'emploi</h2>
      <p className="text-gray-500 mb-6 font-medium">Trouvez votre prochain poste dans la restauration.</p>

      <div className="flex flex-col gap-4">
        {jobs.map(job => {
          const est = establishments.find(e => e.id === job.establishmentId);
          
          // Check if current user has already applied to this job offer
          const existingApplication = currentUser 
            ? applications.find(a => a.clientId === currentUser.id && a.publicationId === job.id)
            : null;

          return (
            <div key={job.id} id={`job-${job.id}`} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                {existingApplication ? (
                  <div className={`text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-full flex items-center gap-1 ${
                    existingApplication.status === 'acceptee' 
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : existingApplication.status === 'refusee'
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {existingApplication.status === 'acceptee' 
                      ? 'Candidature Acceptée' 
                      : existingApplication.status === 'refusee' 
                      ? 'Candidature Refusée' 
                      : 'Candidature Envoyée'}
                  </div>
                ) : (
                  <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded">Actif</div>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{job.title}</h3>
              <div className="font-bold text-orange-600 text-sm mb-3">{est?.name}</div>
              <div className="text-gray-600 text-sm mb-5 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.description }}></div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {est?.city}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>

              {(job.whatsapp || job.applyEmail) && (
                <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Coordonnées de l'employeur
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {job.whatsapp && (
                      <a
                        href={`https://wa.me/${job.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!currentUser) {
                            e.preventDefault();
                            setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour postuler.", type: 'info' });
                            if (onNavigate) onNavigate('profile');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs rounded-lg border border-emerald-100/50 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.182 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.017 14.077.99 11.487.99c-5.435 0-9.858 4.37-9.862 9.8.001 2.012.524 3.97 1.52 5.708l-.99 3.61 3.705-.96c1.616.86 3.236 1.33 4.86 1.33zM16.596 13.71c-.266-.133-1.577-.771-1.821-.859-.244-.089-.422-.133-.599.133-.178.266-.688.859-.843 1.037-.156.178-.311.2-.577.067-.266-.133-1.127-.412-2.148-1.314-.793-.702-1.33-1.568-1.486-1.834-.156-.266-.017-.409.117-.542.12-.12.266-.31.4-.465.133-.155.178-.266.266-.443.089-.178.044-.333-.022-.465-.067-.133-.599-1.428-.821-1.96-.216-.517-.435-.446-.599-.454-.155-.007-.333-.008-.511-.008-.178 0-.466.067-.71.333-.244.266-.931.902-.931 2.2s.954 2.548 1.088 2.724c.133.178 1.877 2.845 4.547 3.982.635.271 1.13.433 1.516.554.639.202 1.22.174 1.68.106.513-.077 1.577-.639 1.8-.1.222-.513.222-.953.155-1.02-.067-.067-.244-.1-.511-.233z"/>
                        </svg>
                        WhatsApp
                      </a>
                    )}
                    {job.applyEmail && (
                      <a
                        href={`mailto:${job.applyEmail}?subject=Candidature - ${encodeURIComponent(job.title)}`}
                        onClick={(e) => {
                          if (!currentUser) {
                            e.preventDefault();
                            setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour postuler.", type: 'info' });
                            if (onNavigate) onNavigate('profile');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg border border-blue-100/50 transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        E-mail
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                {existingApplication ? (
                  <button 
                    disabled
                    className="flex-1 py-3.5 bg-gray-100 text-gray-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Déjà postulé en ligne
                  </button>
                ) : (
                  <button 
                    id={`apply-btn-${job.id}`}
                    onClick={() => {
                      if (!currentUser) {
                        setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour postuler à un emploi.", type: 'info' });
                        if (onNavigate) onNavigate('profile');
                        return;
                      }
                      setSelectedJob(job);
                    }}
                    className="flex-1 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black active:scale-[0.98] transition-all cursor-pointer text-xs"
                  >
                    Postuler en ligne
                  </button>
                )}

                {est && (
                  <button 
                    onClick={() => {
                      if (!currentUser) {
                        setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour échanger avec le gérant.", type: 'info' });
                        if (onNavigate) onNavigate('profile');
                        return;
                      }
                      handleStartChat(est.id, est.name, est.ownerId);
                    }}
                    className="flex-1 py-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Messagerie instantanée
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
            Aucune offre d'emploi pour le moment.
          </div>
        )}
      </div>

      {/* Modern Dialog/Modal for In-App Job Application */}
      {selectedJob && (
        <div id="apply-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-orange-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Postuler à l'offre</h3>
                <p className="text-xs font-bold text-orange-600">{selectedJob.title}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedJob(null);
                  setApplyMessage('');
                }}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm border border-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Votre Profil</label>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                  <div className="font-bold text-gray-800">{currentUser?.name}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">
                    {currentUser?.phone && <span>📞 {currentUser.phone}</span>}
                    {currentUser?.email && <span className="ml-3">✉️ {currentUser.email}</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lettre de motivation / Message (Optionnel)</label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Décrivez brièvement votre expérience dans la restauration, vos disponibilités et vos motivations..."
                  rows={5}
                  maxLength={2000}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white text-sm text-gray-700 transition-all resize-none placeholder-gray-400"
                />
                <div className="text-right text-[10px] text-gray-400 font-bold mt-1">
                  {applyMessage.length} / 2000 caractères
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(null);
                    setApplyMessage('');
                  }}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 cursor-pointer text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold rounded-xl cursor-pointer text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/10 active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer ma candidature
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
