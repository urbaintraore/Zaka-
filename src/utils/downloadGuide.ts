/**
 * Utility to download or export the complete ZAKA+ User Guide
 * Supports PDF / Printable HTML view, Markdown download, and standalone styled HTML.
 */

export const GUIDE_CONTENT_MARKDOWN = `# ZAKA+ — Guide Complet & Présentation Officielle
*Le compagnon ultime de la vie nocturne, gastronomique et culturelle au Burkina Faso*

---

## Table des Matières
1. [Présentation Générale & Impact](#1-présentation-générale--impact)
2. [Économie & Monétisation (Points Zaka & Abonnements)](#2-économie--monétisation)
3. [Guide Profil Client / Fêtard](#3-guide-profil-client--fêtard)
4. [Guide Profil Gérant / Promoteur](#4-guide-profil-gérant--promoteur)
5. [Guide Profil DJ & Artiste](#5-guide-profil-dj--artiste)
6. [Guide Profil Annonceur (ZAKA Ads)](#6-guide-profil-annonceur-zaka-ads)
7. [Guide Profil Entreprise & Partenaires](#7-guide-profil-entreprise--partenaires)
8. [Guide Profil Administrateur & Modération](#8-guide-profil-administrateur--modération)

---

## 1. Présentation Générale & Impact
**ZAKA+** est la plateforme numérique de référence conçue pour dynamiser et moderniser la vie nocturne, les sorties gastronomiques, les salons de beauté et les loisirs urbains au Burkina Faso (Ouagadougou, Bobo-Dioulasso, Koudougou, etc.).

### Nos Engagements :
- **Visibilité Locale :** Mettre en lumière les maquis, bars, lounges, restaurants, salons de coiffure et clubs culturels.
- **Transparence & Qualité :** Avis certifiés, menus du jour digitalisés, affluence en temps réel et géolocalisation précise.
- **Communauté Festive :** Événements interactifs, challenges photo, sorties en groupe et partage d'expériences.

---

## 2. Économie & Monétisation
### A. Programme de Fidélité & Points Zaka
- **Gagnez des points :** À chaque réservation confirmée (+50 pts), avis vérifié (+20 pts), enregistrement d'entrée (+10 pts) ou participation à un challenge (+30 pts).
- **Convertissez vos points :** Réductions exclusives, consommations offertes dans vos établissements favoris et badges de fidélité.

### B. Packs Annonceurs ZAKA Ads
- **Packs Visibilité :** Bannière sponsorisée en tête d'accueil, mise en avant sur la carte interactive, diffusion ciblée par ville et quartier.
- **Statistiques en direct :** Suivi transparent des impressions, clics, taux de conversion et retour sur investissement.

---

## 3. Guide Profil Client / Fêtard
En tant que membre fêtard sur Zaka+ :
1. **Explorez la Carte & l'Affluence :** Consultez en direct le niveau de fréquentation des lieux (calme, animé, complet).
2. **Réservez votre Table en 2 Clics :** Envoyez votre demande de réservation et recevez la confirmation par SMS/WhatsApp.
3. **Consultez les Menus & Tarifs :** Accédez aux cartes des boissons, plats du jour et tarifs des soins en salon.
4. **Sorties en Groupe (Team Outing) :** Créez une sortie, invitez vos amis, partagez l'itinéraire et suivez les arrivées en direct.
5. **Carnet de Sorties & Avis :** Gardez une trace mémorable de vos soirées et partagez vos retours d'expérience.

---

## 4. Guide Profil Gérant / Promoteur
Maximisez l'affluence et le chiffre d'affaires de votre établissement :
1. **Fiche Établissement Certifiée :** Ajoutez vos photos, horaires, géolocalisation et menus téléchargeables.
2. **Gestion des Réservations & Commandes :** Acceptez, refusez ou modifiez les demandes clients en temps réel.
3. **Mise à Jour de l'Affluence :** Indiquez l'ambiance live pour attirer les fêtards au bon moment.
4. **Publication d'Événements & Menus du Jour :** Informez instantanément la communauté de vos soirées spéciales et concerts.
5. **Gestion RH & Recrutement :** Publiez des offres d'emploi (serveurs, barmen, sécurité, coiffeurs) et recevez des candidatures ciblées.

---

## 5. Guide Profil DJ & Artiste
Exprimez votre talent et connectez-vous avec votre public :
1. **Profil DJ & Résidences :** Affichez les clubs et maquis où vous mixez chaque semaine.
2. **Playlists & Mixes en Direct :** Partagez vos sets musicaux et découvrez les titres les plus demandés.
3. **Demandes de Prestations :** Recevez directement des propositions de booking d'établissements et de particuliers.

---

## 6. Guide Profil Annonceur (ZAKA Ads)
1. **Création de Campagne Express :** Choisissez un visuel, un titre accrocheur, un lien d'action et un budget quotidien.
2. **Ciblage Ultra-Précis :** Ciblez les utilisateurs par ville (Ouaga, Bobo), centres d'intérêt (Gastronomie, Clubbing, Beauté).
3. **Tableau de Bord Analytique :** Mesurez vos performances en temps réel avec des graphiques clairs et téléchargez vos factures certifiées.

---

## 7. Guide Profil Entreprise & Partenaires
1. **Partenariats Événements & Boissons :** Devenez sponsor officiel des grands rassemblements nocturnes.
2. **Promotions Spéciales & Ventes Flash :** Offrez des réductions et offres corporatives exclusives aux membres Zaka+.

---

## 8. Guide Profil Administrateur & Modération
1. **Validation des Établissements :** Audit rigoureux de chaque nouvelle inscription pour garantir la qualité de la plateforme.
2. **Modération Communautaire :** Respect de la charte de civilité festive, traitement des signalements et protection des utilisateurs.

---
*Document généré automatiquement par ZAKA+ Burkina Faso — Plateforme officielle.*
`;

/**
 * Downloads the guide as a clean Markdown (.md) file
 */
export function downloadGuideMarkdown() {
  const blob = new Blob([GUIDE_CONTENT_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Guide_Officiel_ZAKA_Plus_Burkina_Faso.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { jsPDF } from 'jspdf';

/**
 * Generates and downloads the complete ZAKA+ User Guide as a PDF file using jsPDF.
 */
export function downloadGuidePDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  // Colors
  const primaryOrange: [number, number, number] = [234, 88, 12];
  const darkSlate: [number, number, number] = [15, 23, 42];
  const textGray: [number, number, number] = [51, 65, 85];
  const lightBg: [number, number, number] = [248, 250, 252];

  const checkPageOverflow = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = 20;
    }
  };

  // HEADER BANNER
  doc.setFillColor(...primaryOrange);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ZAKA+ BURKINA FASO', margin, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Guide Officiel & Mode d\'Emploi de la Plateforme', margin, 26);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉDITION OFFICIELLE 2026 — DOCUMENT PDF CERTIFIÉ', margin, 34);

  cursorY = 50;

  // SECTIONS DATA
  const pdfSections = [
    {
      title: '1. Présentation Générale & Vision',
      content: [
        'ZAKA+ est la plateforme numérique pionnière dédiée à la modernisation de la vie nocturne, des sorties gastronomiques, des salons de beauté et de l\'événementiel au Burkina Faso (Ouagadougou, Bobo-Dioulasso, Koudougou).',
        '• Visibilité locale accrue pour maquis, lounges, restaurants & salons.',
        '• Suivi de l\'affluence en direct et géolocalisation interactive.',
        '• Système de réservation instantanée et menus numériques.'
      ]
    },
    {
      title: '2. Guide des Profils Utilisateurs',
      content: [
        '• Client / Fêtard : Découvrez les meilleurs spots, consultez l\'affluence en temps réel, réservez des tables et accumulez des points Zaka à chaque sortie.',
        '• Gérant / Promoteur : Administrez votre établissement, mettez à jour l\'ambiance en direct, validez les réservations et publiez vos menus du jour.',
        '• DJ & Artiste : Affichez vos résidences hebdomadaires, partagez vos playlists et recevez des demandes de booking.',
        '• Annonceur (ZAKA Ads) : Lancez des campagnes publicitaires ciblées par ville et quartier avec suivi analytique du ROI.'
      ]
    },
    {
      title: '3. Programme de Fidélité Zaka Points',
      content: [
        '• +50 Points par réservation honorée et confirmée.',
        '• +20 Points par avis certifié publié avec photos.',
        '• +30 Points pour chaque participation aux Challenges Photo.',
        '• Vos points accumulés sont échangeables contre des consommations offertes, cocktails et réductions exclusives chez les établissements partenaires.'
      ]
    },
    {
      title: '4. Sécurité, RLS & Modération',
      content: [
        'ZAKA+ garantit une expérience sécurisée grâce à la modération en temps réel et des règles d\'accès RLS (Row Level Security) strictes sur l\'ensemble des données et médias stockés sur Supabase.'
      ]
    }
  ];

  pdfSections.forEach((section) => {
    checkPageOverflow(30);

    // Section Title
    doc.setFillColor(...lightBg);
    doc.rect(margin - 2, cursorY - 5, contentWidth + 4, 10, 'F');
    doc.setTextColor(...primaryOrange);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(section.title, margin, cursorY + 2);
    cursorY += 12;

    // Content Lines
    doc.setTextColor(...textGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    section.content.forEach((paragraph) => {
      const splitLines = doc.splitTextToSize(paragraph, contentWidth);
      checkPageOverflow(splitLines.length * 6 + 4);
      doc.text(splitLines, margin, cursorY);
      cursorY += splitLines.length * 5.5 + 3;
    });

    cursorY += 6;
  });

  // FOOTER ON EACH PAGE
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ZAKA+ Burkina Faso — Document Officiel PDF', margin, pageHeight - 6);
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin - 15, pageHeight - 6);
  }

  doc.save('Guide_Officiel_ZAKA_Plus_Burkina_Faso.pdf');
}

/**
 * Opens a print dialog immediately for direct PDF export
 */
export function printGuideDirectly() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    downloadGuidePDF();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Guide ZAKA+ Burkina Faso</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
          h1 { color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 8px; }
          h2 { color: #0f172a; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          h3 { color: #c2410c; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin: 10px 0; }
          ul { margin-left: 20px; }
        </style>
      </head>
      <body>
        <h1>Guide Officiel ZAKA+ — Burkina Faso</h1>
        <p><em>Le compagnon ultime de la vie nocturne et culturelle au Burkina Faso</em></p>
        
        <h2>1. Présentation & Vision</h2>
        <p>ZAKA+ est la plateforme de référence pour découvrir, réserver et vivre le meilleur de la vie festive, gastronomique et culturelle au Burkina Faso.</p>

        <h2>2. Rôles & Fonctionnalités Clés</h2>
        <div class="card">
          <strong>Client / Fêtard :</strong> Carte interactive, affluence en temps réel, réservations simplifiées, carnet de sorties et points de fidélité.
        </div>
        <div class="card">
          <strong>Gérant d'Établissement :</strong> Gestion des réservations, mise à jour de l'affluence en direct, publication des menus du jour et recrutement de personnel.
        </div>
        <div class="card">
          <strong>DJ & Artiste :</strong> Calendrier des résidences, partage de playlists et bookings directs.
        </div>
        <div class="card">
          <strong>Annonceur ZAKA Ads :</strong> Campagnes ciblées, bannières sponsorisées et tableau de bord analytique.
        </div>

        <h2>3. Programme de Fidélité Zaka Points</h2>
        <p>Cumulez des points sur vos réservations, avis et entrées pour débloquer des réductions et cadeaux festifs chez vos partenaires préférés.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">Document officiel imprimé depuis l'application ZAKA+ Burkina Faso.</p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
