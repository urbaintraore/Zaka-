import { GoogleGenAI } from '@google/genai';
import { CampaignTargeting, AdCTA, AdFormat } from '../types';

export interface ZakaAiProposal {
  title: string;
  copy: string;
  recommendedFormat: AdFormat;
  ctaText: AdCTA;
  targetAudience: CampaignTargeting;
  suggestedBudget: number; // in FCFA
  bestSchedule: string;
}

export async function generateZakaAiAdProposal(prompt: string, advertiserName?: string): Promise<ZakaAiProposal> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
  
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Tu es l'assistant IA officiel "ZAKA AI Ads", expert en stratégie publicitaire et marketing digital au Burkina Faso pour la plateforme ZAKA+.
Ta mission est de concevoir la meilleure campagne publicitaire ciblée pour tout type d'annonceur :
- **Restaurants & Gastronomie** (Promouvoir le menu du jour, les réservations de tables, la livraison et les formules gourmandes).
- **Salons de Coiffure & Beauté** (Attirer des clients pour des tresses, coupes, relooking, soins esthétiques et prises de rendez-vous).
- **Grands Annonceurs & Marques** (Brakina, Coca-Cola, Telecoms, Banques, Evénements : notoriété, visibilité multi-canale et sponsoring d'établissements).

Réponds TOUJOURS au format JSON strict avec la structure suivante :
{
  "title": "Nom accrocheur de la campagne / titre pub",
  "copy": "Texte publicitaire percutant et adapté aux consommateurs burkinabès",
  "recommendedFormat": "banniere" | "video" | "publication_sponsorisee",
  "ctaText": "Appeler" | "WhatsApp" | "Réserver" | "Découvrir" | "Acheter",
  "targetAudience": {
    "cities": ["Ouagadougou", "Bobo-Dioulasso"],
    "neighborhoods": ["Ouaga 2000", "Zone du Bois", "Gounghin", "Pissy", "Tampouy"],
    "ageRanges": ["18-24 ans", "25-34 ans", "35-49 ans"],
    "interests": ["Restaurants & Gastronomie", "Salons de Coiffure & Beauté", "Sorties & Nightlife", "Shopping & Mode"],
    "keyMoments": ["Pause Déjeuner (11h-14h)", "Après-midi Coiffure & Beauté", "Vendredi soir", "Samedi soir"]
  },
  "suggestedBudget": 50000,
  "bestSchedule": "Conseil horaire et stratégie de diffusion sur mesure (ex: Diffusion avant les pauses repas pour les restos, créneaux semaine & week-end pour salons)."
}`;

      const userPrompt = `Annonceur: ${advertiserName || 'Annonceur ZAKA+'}.
Demande ou produit à promouvoir: "${prompt}".
Génère la meilleure stratégie publicitaire sous forme d'objet JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
        ]
      });

      const responseText = response.text || '';
      // Try parsing JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || 'Campagne ZAKA Ads',
          copy: parsed.copy || 'Découvrez nos offres exclusives ce week-end sur ZAKA+ !',
          recommendedFormat: ['banniere', 'video', 'publication_sponsorisee'].includes(parsed.recommendedFormat) ? parsed.recommendedFormat : 'publication_sponsorisee',
          ctaText: ['Appeler', 'WhatsApp', 'Réserver', 'Découvrir', 'Acheter'].includes(parsed.ctaText) ? parsed.ctaText : 'WhatsApp',
          targetAudience: {
            cities: parsed.targetAudience?.cities || ['Ouagadougou', 'Bobo-Dioulasso'],
            neighborhoods: parsed.targetAudience?.neighborhoods || ['Ouaga 2000', 'Zone du Bois'],
            ageRanges: parsed.targetAudience?.ageRanges || ['18-24 ans', '25-34 ans'],
            interests: parsed.targetAudience?.interests || ['Restaurants & Gastronomie', 'Salons de Coiffure & Beauté'],
            keyMoments: parsed.targetAudience?.keyMoments || ['Vendredi soir', 'Pause Déjeuner (11h-14h)']
          },
          suggestedBudget: parsed.suggestedBudget || 50000,
          bestSchedule: parsed.bestSchedule || 'Diffusion recommandée du jeudi au dimanche pour un impact optimal.'
        };
      }
    } catch (e) {
      console.warn("ZAKA AI Gemini generation failed or no key, falling back to smart local template generator:", e);
    }
  }

  // Fallback smart template logic if Gemini API key isn't provided or fails
  const lower = prompt.toLowerCase();
  let suggestedBudget = 50000;
  let ctaText: AdCTA = 'WhatsApp';
  let recommendedFormat: AdFormat = 'publication_sponsorisee';
  let cities = ['Ouagadougou', 'Bobo-Dioulasso'];
  let neighborhoods = ['Ouaga 2000', 'Zone du Bois', 'Gounghin', 'Tampouy'];
  let ageRanges = ['18-24 ans', '25-34 ans'];
  let interests = ['Restaurants & Gastronomie', 'Salons de Coiffure & Beauté'];
  let keyMoments = ['Pause Déjeuner (11h-14h)', 'Vendredi soir'];
  let title = 'Campagne ZAKA Ads Exclusive';
  let copy = 'Venez vivre une expérience unique ! Profitez de nos offres spéciales et contactez-nous dès maintenant.';
  let bestSchedule = 'Diffusion optimale du mercredi au dimanche à Ouagadougou et Bobo-Dioulasso.';

  if (lower.includes('coiffure') || lower.includes('beauté') || lower.includes('tresses') || lower.includes('ongles') || lower.includes('soin') || lower.includes('salon') || lower.includes('perruque') || lower.includes('maquillage')) {
    title = 'Sublimez votre Beauté & Style';
    copy = `Offrez-vous un relooking d'exception chez ${advertiserName || 'notre salon de beauté'} ! Tresses tendance, coupes modernes, manucure et soins du visage. Prenez rendez-vous directement en 1 clic !`;
    ctaText = 'Réserver';
    recommendedFormat = 'publication_sponsorisee';
    interests = ['Salons de Coiffure & Beauté', 'Shopping & Mode'];
    ageRanges = ['18-24 ans', '25-34 ans', '35-49 ans'];
    keyMoments = ['Après-midi Coiffure (14h-18h)', 'Week-end & Fêtes'];
    suggestedBudget = 40000;
    bestSchedule = 'Diffusion prioritaire du jeudi au samedi pour remplir vos fauteuils et carnet de rendez-vous du week-end.';
  } else if (lower.includes('restaurant') || lower.includes('manger') || lower.includes('plat') || lower.includes('menu') || lower.includes('pizza') || lower.includes('buffet') || lower.includes('grillade') || lower.includes('degustation')) {
    title = 'Délices & Menu Gourmet du Jour';
    copy = `Savourez nos spécialités culinaires préparées par les meilleurs chefs chez ${advertiserName || 'notre restaurant'} ! Menu du jour, grillades au feu de bois et formules livraison. Réservez votre table dès maintenant !`;
    ctaText = 'Réserver';
    recommendedFormat = 'publication_sponsorisee';
    interests = ['Restaurants & Gastronomie', 'Sorties & Nightlife'];
    keyMoments = ['Pause Déjeuner (11h-14h)', 'Dîner & Happy Hour (18h-22h)'];
    suggestedBudget = 50000;
    bestSchedule = 'Diffusions ciblées quotidiennement entre 11h-13h (déjeuner) et 18h-20h (dîner) pour capter les réservations immédiates.';
  } else if (lower.includes('boisson') || lower.includes('biere') || lower.includes('brakina') || lower.includes('coca') || lower.includes('orange') || lower.includes('moov') || lower.includes('marque') || lower.includes('entreprise')) {
    title = 'Opération Notoriété Nationale Grands Comptes';
    copy = `Partenaire officiel de vos moments de convivialité au Burkina Faso ! Découvrez nos promotions exclusives dans les maquis, bars et restaurants partenaires ZAKA+.`;
    recommendedFormat = 'banniere';
    ctaText = 'Découvrir';
    suggestedBudget = 150000;
    ageRanges = ['18-24 ans', '25-34 ans', '35-49 ans'];
    interests = ['Boissons & Rafraîchissements', 'Sorties & Nightlife', 'Sports & Événements'];
    keyMoments = ['Vendredi soir', 'Samedi soir', 'Grands Événements'];
    bestSchedule = 'Affichage continu en bannière d\'accueil et sponso fiches établissements avec campagne push hebdo.';
  }

  return {
    title,
    copy,
    recommendedFormat,
    ctaText,
    targetAudience: { cities, neighborhoods, ageRanges, interests, keyMoments },
    suggestedBudget,
    bestSchedule
  };
}
