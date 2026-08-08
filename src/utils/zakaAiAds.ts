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
      const systemInstruction = `Tu es l'assistant IA officiel "ZAKA AI Ads", expert en publicité digitale AdTech au Burkina Faso pour la plateforme ZAKA+.
Ta mission est d'aider un annonceur (maquis, bar, restaurant, marque, entreprise, boite de nuit, salon) à concevoir sa campagne publicitaire optimale au Burkina Faso.

Réponds TOUJOURS au format JSON strict avec la structure suivante :
{
  "title": "Nom accrocheur de la campagne / titre pub",
  "copy": "Texte publicitaire percutant et attrayant pour les burkinabès",
  "recommendedFormat": "banniere" | "video" | "publication_sponsorisee",
  "ctaText": "Appeler" | "WhatsApp" | "Réserver" | "Découvrir" | "Acheter",
  "targetAudience": {
    "cities": ["Ouagadougou", "Bobo-Dioulasso"],
    "neighborhoods": ["Ouaga 2000", "Zone du Bois", "Gounghin"],
    "ageRanges": ["18-25", "26-35"],
    "interests": ["sorties", "musique", "restaurants", "événements"],
    "keyMoments": ["vendredi_soir", "samedi_soir"]
  },
  "suggestedBudget": 50000,
  "bestSchedule": "Conseil horaire détaillé pour la diffusion (ex: Diffuser à partir de vendredi 17h, pic entre 19h et 23h à Ouagadougou)."
}`;

      const userPrompt = `Annonceur: ${advertiserName || 'Entreprise locale'}.
Demande: "${prompt}".
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
          title: parsed.title || 'Campagne Promotionnelle ZAKA+',
          copy: parsed.copy || 'Découvrez nos offres exclusives ce week-end !',
          recommendedFormat: ['banniere', 'video', 'publication_sponsorisee'].includes(parsed.recommendedFormat) ? parsed.recommendedFormat : 'publication_sponsorisee',
          ctaText: ['Appeler', 'WhatsApp', 'Réserver', 'Découvrir', 'Acheter'].includes(parsed.ctaText) ? parsed.ctaText : 'WhatsApp',
          targetAudience: {
            cities: parsed.targetAudience?.cities || ['Ouagadougou'],
            neighborhoods: parsed.targetAudience?.neighborhoods || ['Ouaga 2000', 'Zone du Bois'],
            ageRanges: parsed.targetAudience?.ageRanges || ['18-25', '26-35'],
            interests: parsed.targetAudience?.interests || ['sorties', 'musique', 'restaurants'],
            keyMoments: parsed.targetAudience?.keyMoments || ['vendredi_soir', 'samedi_soir']
          },
          suggestedBudget: parsed.suggestedBudget || 50000,
          bestSchedule: parsed.bestSchedule || 'Diffusion recommandée du vendredi 17h au dimanche 23h pour un impact maximal.'
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
  let neighborhoods = ['Ouaga 2000', 'Zone du Bois', 'Gounghin'];
  let ageRanges = ['18-25', '26-35'];
  let interests = ['sorties', 'musique', 'restaurants'];
  let keyMoments = ['vendredi_soir', 'samedi_soir'];
  let title = 'Soirée Spéciale & Ambiance VIP';
  let copy = 'Venez vivre une expérience nocturne inoubliable ! Profitez de nos offres exclusives et réservez votre table dès maintenant.';
  let bestSchedule = 'Diffusion optimale du vendredi 16h30 au samedi minuit avec un pic d\'engagement à Ouagadougou et Bobo-Dioulasso.';

  if (lower.includes('restaurant') || lower.includes('manger') || lower.includes('plat') || lower.includes('menu')) {
    title = 'Délices & Gastronomie à l\'honneur';
    copy = `Découvrez la nouvelle carte chez ${advertiserName || 'notre établissement'} ! Saveurs uniques, produits frais et cadre chaleureux vous attendent.`;
    ctaText = 'Réserver';
    interests = ['restaurants', 'mode'];
    suggestedBudget = 50000;
  } else if (lower.includes('boisson') || lower.includes('biere') || lower.includes('brakina') || lower.includes('coca') || lower.includes('orange') || lower.includes('moov')) {
    title = 'Campagne Nationale Grands Publics';
    copy = `Moussez vos soirées avec nos rafraîchissements officiels ! Offres spéciales disponibles dans tous les maquis et bars partenaires ZAKA+.`;
    recommendedFormat = 'banniere';
    ctaText = 'Découvrir';
    suggestedBudget = 150000;
    ageRanges = ['18-25', '26-35', '36-50'];
    interests = ['sorties', 'musique', 'sport', 'culture'];
  } else if (lower.includes('video') || lower.includes('clip') || lower.includes('dj') || lower.includes('concert')) {
    title = 'Show & Ambiance Live Exclusif';
    copy = 'Ne manquez pas l\'événement phare de ce week-end ! Un spectacle grandiose, de la bonne musique et une ambiance garantie jusqu\'à l\'aube.';
    recommendedFormat = 'video';
    ctaText = 'WhatsApp';
    suggestedBudget = 150000;
    keyMoments = ['vendredi_soir', 'samedi_soir', 'evenements_speciaux'];
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
