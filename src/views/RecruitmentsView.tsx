import { useAppStore } from '../store';
import { Briefcase, MapPin, Clock, MessageSquare } from 'lucide-react';

interface RecruitmentsViewProps {
  onNavigate?: (tab: any) => void;
  onStartChatWithConv?: (convId: string) => void;
}

export function RecruitmentsView({ onNavigate, onStartChatWithConv }: RecruitmentsViewProps) {
  const { publications, establishments, currentUser, createConversation, setGlobalError } = useAppStore();
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

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <h2 className="text-2xl font-black text-gray-900 mb-2">Offres d'emploi</h2>
      <p className="text-gray-500 mb-6 font-medium">Trouvez votre prochain poste dans la restauration.</p>

      <div className="flex flex-col gap-4">
        {jobs.map(job => {
          const est = establishments.find(e => e.id === job.establishmentId);
          return (
            <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded">Actif</div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{job.title}</h3>
              <div className="font-bold text-orange-600 text-sm mb-3">{est?.name}</div>
              <div className="text-gray-600 text-sm mb-5 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.description }}></div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {est?.city}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button 
                  onClick={() => {
                    if (!currentUser) {
                      setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour postuler à un emploi.", type: 'info' });
                      if (onNavigate) onNavigate('profile');
                      return;
                    }
                    alert("Candidature transmise avec succès !");
                  }}
                  className="flex-1 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black active:scale-[0.98] transition-all cursor-pointer text-xs"
                >
                  Postuler maintenant
                </button>
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
                    Contacter le gérant
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
    </div>
  );
}
