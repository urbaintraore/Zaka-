import { GoogleGenAI } from '@google/genai';
import { AdCTA, AdFormat, CampaignTargeting } from '../types';

export interface ZakaAiExpressAdResult {
  title: string;
  description: string;
  ctaText: AdCTA;
  recommendedBudget: number; // in FCFA
  recommendedDays: number;
  score: number; // 0 to 100
  scoreTips: string[];
  suggestedCities: string[];
  suggestedAudience: string;
  headlineHighlight: string;
}

export async function generateExpressAdWithAI(params: {
  category: string;
  rawText: string;
  establishmentName?: string;
  city?: string;
  neighborhood?: string;
  hasImage: boolean;
  priceMentioned?: string;
  dateMentioned?: string;
}): Promise<ZakaAiExpressAdResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
  const { category, rawText, establishmentName, city, neighborhood, hasImage, priceMentioned, dateMentioned } = params;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Tu es ZAKA AI AD CREATOR, le moteur d'intelligence artificielle de la régie ZAKA+ au Burkina Faso (Ouagadougou, Bobo-Dioulasso, Koudougou).
Ta mission est de transformer la description brute d'un gérant de maquis, restaurant, lounge, boîte de nuit, salon de coiffure ou DJ en une publicité digitale percutante, moderne et professionnelle en moins de 2 minutes.

RÈGLES CAPITALES :
1. Langage dynamique, chaleureux, burkinabè contemporain, accrocheur (ex: "🔥 Ce samedi, ça chauffe !", "🍺 Grillades chaudes & ambiance live").
2. NE JAMAIS inventer de prix, de date, d'artistes ou d'adresses non fournis. Si non précisé, reste général sans affabuler.
3. Choisir le Call to Action (CTA) le plus efficace ("WhatsApp", "Appeler", "Réserver", "Découvrir", "Acheter").
4. Calculer un ZAKA AD SCORE (0-100) avec 2 conseils d'optimisation clairs et bienveillants.
5. Répondre STRICTEMENT en JSON valide.

JSON Schema attendu:
{
  "title": "Titre percutant avec émojis (max 45 caractères)",
  "description": "Texte court, attractif et percutant adapté à un smartphone (2-3 phrases max)",
  "ctaText": "WhatsApp" | "Appeler" | "Réserver" | "Découvrir" | "Acheter",
  "recommendedBudget": 10000 | 25000 | 50000,
  "recommendedDays": 3 | 7 | 14,
  "score": 88,
  "scoreTips": ["Ajoutez l'heure exacte pour booster les clics WhatsApp", "Une photo nette augmente la conversion"],
  "suggestedCities": ["Ouagadougou", "Bobo-Dioulasso"],
  "suggestedAudience": "Tous les noctambules et amateurs de bonne ambiance",
  "headlineHighlight": "SPONSORISÉ • ZAKA EXPRESS"
}`;

      const userPrompt = `Catégorie: ${category}
Établissement: ${establishmentName || 'Mon Établissement'}
Localisation: ${city || 'Ouagadougou'} ${neighborhood ? `(${neighborhood})` : ''}
Texte du gérant: "${rawText}"
A une image: ${hasImage ? 'Oui' : 'Non'}
Prix ou promo: ${priceMentioned || 'Non spécifié'}
Date / Heure: ${dateMentioned || 'Ce week-end / Immédiat'}

Génère la publicité optimisée en JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }]
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || `🔥 ${establishmentName || 'Offre Spéciale ZAKA+'}`,
          description: parsed.description || rawText || 'Découvrez notre offre exclusive ce week-end sur ZAKA+ !',
          ctaText: ['WhatsApp', 'Appeler', 'Réserver', 'Découvrir', 'Acheter'].includes(parsed.ctaText) ? parsed.ctaText : 'WhatsApp',
          recommendedBudget: Number(parsed.recommendedBudget) || 10000,
          recommendedDays: Number(parsed.recommendedDays) || 3,
          score: Math.min(100, Math.max(70, Number(parsed.score) || 85)),
          scoreTips: Array.isArray(parsed.scoreTips) && parsed.scoreTips.length > 0 ? parsed.scoreTips : [
            'Votre annonce est bien structurée pour capter l\'attention locale.',
            'Activez la réception des messages WhatsApp pour convertir instantanément.'
          ],
          suggestedCities: Array.isArray(parsed.suggestedCities) && parsed.suggestedCities.length > 0 ? parsed.suggestedCities : [city || 'Ouagadougou'],
          suggestedAudience: parsed.suggestedAudience || 'Clients locaux ciblés',
          headlineHighlight: parsed.headlineHighlight || 'SPONSORISÉ ZAKA+'
        };
      }
    } catch (err) {
      console.warn("ZAKA AI Gemini call failed, using intelligent offline generator", err);
    }
  }

  // Smart instant fallback
  return generateOfflineSmartAd(params);
}

function generateOfflineSmartAd(params: {
  category: string;
  rawText: string;
  establishmentName?: string;
  city?: string;
  neighborhood?: string;
  hasImage: boolean;
  priceMentioned?: string;
  dateMentioned?: string;
}): ZakaAiExpressAdResult {
  const { category, rawText, establishmentName, city, neighborhood, hasImage } = params;
  const name = establishmentName || 'Notre Établissement';
  const loc = `${city || 'Ouagadougou'}${neighborhood ? ` (${neighborhood})` : ''}`;
  const textLower = (rawText || '').toLowerCase();

  let title = `🔥 Offre Spéciale chez ${name}`;
  let description = `${rawText ? rawText + ' • ' : ''}Ambiance garantie et service au top à ${loc}. Contactez-nous vite pour réserver votre place !`;
  let ctaText: AdCTA = 'WhatsApp';
  let recommendedBudget = 10000;
  let recommendedDays = 3;
  let score = 82;
  const scoreTips: string[] = [];

  if (category === 'evenement' || textLower.includes('soiree') || textLower.includes('dj') || textLower.includes('concert') || textLower.includes('live')) {
    title = `🎉 CE SOIR : Ambiance Explosive chez ${name} !`;
    description = rawText 
      ? `🔥 ${rawText}. Retrouvez-nous à ${loc} pour une ambiance inoubliable !`
      : `🔥 Grande soirée ce week-end chez ${name} à ${loc} ! DJ sets, rafraîchissements et ambiance festive garantie.`;
    ctaText = 'WhatsApp';
    recommendedBudget = 10000;
    recommendedDays = 3;
    score = 88;
    scoreTips.push("Les soirées et DJ sets ont un taux d'engagement 3x supérieur le week-end.");
  } else if (category === 'promotion' || textLower.includes('promo') || textLower.includes('happy') || textLower.includes('réduction') || textLower.includes('gratuit')) {
    title = `⚡ PROMO EXCLUSIVE : Profitez-en chez ${name} !`;
    description = rawText
      ? `💥 ${rawText} ! Valable dès maintenant chez ${name} à ${loc}.`
      : `💥 Offre promotionnelle à ne pas rater chez ${name} (${loc}) ! Contactez-nous pour en profiter immédiatement.`;
    ctaText = 'WhatsApp';
    recommendedBudget = 10000;
    recommendedDays = 3;
    score = 90;
    scoreTips.push("Les offres avec réduction attirent 45% de clics en plus sur WhatsApp.");
  } else if (category === 'coiffure' || textLower.includes('coiffure') || textLower.includes('tresse') || textLower.includes('barber') || textLower.includes('soin')) {
    title = `✂️ Sublimez votre style chez ${name}`;
    description = rawText
      ? `✨ ${rawText}. Salon situé à ${loc}. Prenez rendez-vous en 1 clic !`
      : `✨ Tresses, coupes tendances et soins capillaires pros chez ${name} à ${loc}. Fauteuils disponibles !`;
    ctaText = 'Réserver';
    recommendedBudget = 10000;
    recommendedDays = 3;
    score = 86;
    scoreTips.push("Proposer un bouton de réservation directe remplit vos créneaux plus vite.");
  } else if (category === 'produit' || textLower.includes('menu') || textLower.includes('plat') || textLower.includes('grillade') || textLower.includes('poulet') || textLower.includes('pizza')) {
    title = `🍔 Menu Gourmand & Saveurs chez ${name}`;
    description = rawText
      ? `😋 ${rawText}. Préparé frais du jour à ${loc} !`
      : `😋 Grillades braisées, plats savoureux et boissons fraîches chez ${name} à ${loc}. Commandez ou réservez !`;
    ctaText = 'WhatsApp';
    recommendedBudget = 10000;
    recommendedDays = 3;
    score = 87;
    scoreTips.push("Les photos de plats gourmands augmentent les commandes directes.");
  } else {
    title = `🚀 Découvrez ${name} à ${loc}`;
    description = rawText
      ? `✨ ${rawText} • Bienvenue chez ${name} (${loc}) !`
      : `✨ Venez passer un moment d'exception chez ${name} à ${loc}. Accueil chaleureux et convivialité assurée.`;
    ctaText = 'Découvrir';
    recommendedBudget = 10000;
    recommendedDays = 3;
    score = 84;
    scoreTips.push("Ajoutez des détails sur vos tarifs pour obtenir des contacts plus qualifiés.");
  }

  if (hasImage) {
    score += 6;
  } else {
    scoreTips.push("Ajouter une belle photo réelle augmente le score à plus de 90/100.");
  }

  return {
    title,
    description,
    ctaText,
    recommendedBudget,
    recommendedDays,
    score: Math.min(98, score),
    scoreTips,
    suggestedCities: [city || 'Ouagadougou'],
    suggestedAudience: 'Clients & noctambules locaux',
    headlineHighlight: 'SPONSORISÉ • ZAKA EXPRESS'
  };
}
