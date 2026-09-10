import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  BeautyProduct,
  BeautyProductCategory,
  BeautyStockMovement,
  BeautyStockMovementType,
  BeautyInventorySession,
  BeautyInventoryItem,
  BeautySale,
  BeautySaleItem,
  BeautyPaymentMethod,
  BeautyCashClosure,
  BeautyLoyaltySettings,
  BeautyLoyaltyAccount,
  BeautyLoyaltyTier,
  BeautyReward,
  BeautyRewardType,
  BeautyLoyaltyTransaction,
  BeautyStaffMember,
  BeautyAppointment,
  BeautyCommercialStats
} from '../types';

// =============================================================================
// 1. PRODUCT CATALOG & STOCK MANAGEMENT
// =============================================================================

export async function fetchBeautyProducts(salonId: string, onlyActive = false): Promise<BeautyProduct[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalProducts(salonId, onlyActive);
  }

  try {
    let query = supabase
      .from('beauty_products')
      .select('*')
      .eq('salon_id', salonId)
      .order('nom', { ascending: true });

    if (onlyActive) {
      query = query.eq('actif', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalProducts(salonId, onlyActive);
    }

    return data.map(mapDbToProduct);
  } catch (err) {
    console.warn('Erreur fetchBeautyProducts Supabase:', err);
    return getLocalProducts(salonId, onlyActive);
  }
}

export async function saveBeautyProduct(
  productData: Partial<BeautyProduct> & Omit<BeautyProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BeautyProduct> {
  const newProduct: BeautyProduct = {
    ...productData,
    id: productData.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: productData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_products')
        .insert({
          salon_id: productData.salonId,
          nom: productData.nom,
          categorie: productData.categorie,
          sku: productData.sku || null,
          unite: productData.unite || 'unité',
          quantite_actuelle: productData.quantiteActuelle,
          quantite_minimale: productData.quantiteMinimale,
          prix_achat: productData.prixAchat,
          prix_vente: productData.prixVente,
          fournisseur: productData.fournisseur || null,
          image_url: productData.imageUrl || null,
          actif: productData.actif !== undefined ? productData.actif : true
        })
        .select()
        .single();

      if (!error && data) {
        const saved = mapDbToProduct(data);
        saveLocalProduct(saved);
        // Log initial movement if quantity > 0
        if (saved.quantiteActuelle > 0) {
          await createStockMovement({
            salonId: saved.salonId,
            productId: saved.id,
            productNom: saved.nom,
            quantite: saved.quantiteActuelle,
            typeMouvement: 'entree',
            userName: 'Initialisation',
            dateMouvement: new Date().toISOString(),
            commentaire: 'Stock initial lors de la création du produit'
          });
        }
        return saved;
      }
    } catch (err) {
      console.warn('Erreur saveBeautyProduct Supabase, fallback local:', err);
    }
  }

  saveLocalProduct(newProduct);
  if (newProduct.quantiteActuelle > 0) {
    createStockMovement({
      salonId: newProduct.salonId,
      productId: newProduct.id,
      productNom: newProduct.nom,
      quantite: newProduct.quantiteActuelle,
      typeMouvement: 'entree',
      userName: 'Initialisation',
      dateMouvement: new Date().toISOString(),
      commentaire: 'Stock initial lors de la création du produit'
    });
  }
  return newProduct;
}

export async function updateBeautyProduct(
  id: string,
  updates: Partial<BeautyProduct>
): Promise<BeautyProduct> {
  if (isSupabaseConfigured) {
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.nom !== undefined) dbUpdates.nom = updates.nom;
      if (updates.categorie !== undefined) dbUpdates.categorie = updates.categorie;
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
      if (updates.unite !== undefined) dbUpdates.unite = updates.unite;
      if (updates.quantiteActuelle !== undefined) dbUpdates.quantite_actuelle = updates.quantiteActuelle;
      if (updates.quantiteMinimale !== undefined) dbUpdates.quantite_minimale = updates.quantiteMinimale;
      if (updates.prixAchat !== undefined) dbUpdates.prix_achat = updates.prixAchat;
      if (updates.prixVente !== undefined) dbUpdates.prix_vente = updates.prixVente;
      if (updates.fournisseur !== undefined) dbUpdates.fournisseur = updates.fournisseur;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.actif !== undefined) dbUpdates.actif = updates.actif;

      const { data, error } = await supabase
        .from('beauty_products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated = mapDbToProduct(data);
        saveLocalProduct(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Erreur updateBeautyProduct Supabase:', err);
    }
  }

  const existing = getLocalProducts().find(p => p.id === id);
  if (!existing) throw new Error('Produit non trouvé');
  const updated: BeautyProduct = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveLocalProduct(updated);
  return updated;
}

export async function deleteBeautyProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('beauty_products').delete().eq('id', id);
      if (!error) {
        removeLocalProduct(id);
        return true;
      }
    } catch (err) {
      console.warn('Erreur deleteBeautyProduct Supabase:', err);
    }
  }
  removeLocalProduct(id);
  return true;
}

// -----------------------------------------------------------------------------
// Stock Movements
// -----------------------------------------------------------------------------

export async function fetchBeautyStockMovements(
  salonId: string,
  productId?: string,
  limit = 100
): Promise<BeautyStockMovement[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalStockMovements(salonId, productId);
  }

  try {
    let query = supabase
      .from('beauty_stock_movements')
      .select('*, beauty_products(nom)')
      .eq('salon_id', salonId)
      .order('date_mouvement', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalStockMovements(salonId, productId);
    }

    return data.map((d: any) => ({
      id: d.id,
      salonId: d.salon_id,
      productId: d.product_id,
      productNom: d.beauty_products?.nom || d.product_nom || 'Produit',
      quantite: d.quantite,
      typeMouvement: d.type_mouvement as BeautyStockMovementType,
      userId: d.user_id,
      userName: d.user_name,
      saleId: d.sale_id,
      dateMouvement: d.date_mouvement,
      commentaire: d.commentaire,
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn('Erreur fetchBeautyStockMovements Supabase:', err);
    return getLocalStockMovements(salonId, productId);
  }
}

export async function createStockMovement(
  movementData: Omit<BeautyStockMovement, 'id' | 'createdAt'>
): Promise<BeautyStockMovement> {
  const newMovement: BeautyStockMovement = {
    ...movementData,
    id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  // Adjust product current quantity
  try {
    const products = await fetchBeautyProducts(movementData.salonId);
    const prod = products.find(p => p.id === movementData.productId);
    if (prod) {
      let delta = 0;
      switch (movementData.typeMouvement) {
        case 'entree':
        case 'retour':
          delta = movementData.quantite;
          break;
        case 'sortie':
        case 'vente':
        case 'consommation':
        case 'perte':
          delta = -movementData.quantite;
          break;
        case 'ajustement':
          // For direct adjustments, quantite is the adjustment delta or target
          delta = movementData.quantite;
          break;
      }
      const newQty = Math.max(0, prod.quantiteActuelle + delta);
      await updateBeautyProduct(prod.id, { quantiteActuelle: newQty });
    }
  } catch (adjustErr) {
    console.warn('Erreur ajustement stock automatique:', adjustErr);
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_stock_movements')
        .insert({
          salon_id: movementData.salonId,
          product_id: movementData.productId,
          quantite: movementData.quantite,
          type_mouvement: movementData.typeMouvement,
          user_id: movementData.userId || null,
          user_name: movementData.userName || null,
          sale_id: movementData.saleId || null,
          date_mouvement: movementData.dateMouvement || new Date().toISOString(),
          commentaire: movementData.commentaire || null
        })
        .select()
        .single();

      if (!error && data) {
        const saved: BeautyStockMovement = {
          id: data.id,
          salonId: data.salon_id,
          productId: data.product_id,
          productNom: movementData.productNom,
          quantite: data.quantite,
          typeMouvement: data.type_mouvement as BeautyStockMovementType,
          userId: data.user_id,
          userName: data.user_name,
          saleId: data.sale_id,
          dateMouvement: data.date_mouvement,
          commentaire: data.commentaire,
          createdAt: data.created_at
        };
        saveLocalStockMovement(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Erreur createStockMovement Supabase:', err);
    }
  }

  saveLocalStockMovement(newMovement);
  return newMovement;
}

// -----------------------------------------------------------------------------
// Inventory Sessions
// -----------------------------------------------------------------------------

export async function saveInventorySession(
  sessionData: Omit<BeautyInventorySession, 'id' | 'createdAt'>
): Promise<BeautyInventorySession> {
  const newSession: BeautyInventorySession = {
    ...sessionData,
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  // For each item with an ecart, apply stock adjustment and create movement
  for (const item of sessionData.items) {
    if (item.ecart !== 0) {
      await updateBeautyProduct(item.productId, { quantiteActuelle: item.stockReel });
      await createStockMovement({
        salonId: sessionData.salonId,
        productId: item.productId,
        productNom: item.productNom,
        quantite: item.ecart, // positive or negative
        typeMouvement: 'ajustement',
        userName: sessionData.realiseParNom || 'Inventaire',
        dateMouvement: new Date().toISOString(),
        commentaire: `Inventaire du ${sessionData.dateInventaire}: Écart de ${item.ecart > 0 ? '+' : ''}${item.ecart} (${item.justification || 'Ajustement physique'})`
      });
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_inventory_sessions')
        .insert({
          salon_id: sessionData.salonId,
          date_inventaire: sessionData.dateInventaire,
          realise_par_nom: sessionData.realiseParNom || null,
          items: sessionData.items,
          commentaire: sessionData.commentaire || null,
          total_ecart_valeur_fcfa: sessionData.totalEcartValeurFcfa || 0
        })
        .select()
        .single();

      if (!error && data) {
        const saved: BeautyInventorySession = {
          id: data.id,
          salonId: data.salon_id,
          dateInventaire: data.date_inventaire,
          realiseParNom: data.realise_par_nom,
          items: data.items,
          commentaire: data.commentaire,
          totalEcartValeurFcfa: data.total_ecart_valeur_fcfa,
          createdAt: data.created_at
        };
        saveLocalInventorySession(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Erreur saveInventorySession Supabase:', err);
    }
  }

  saveLocalInventorySession(newSession);
  return newSession;
}

export async function fetchInventorySessions(salonId: string): Promise<BeautyInventorySession[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalInventorySessions(salonId);
  }

  try {
    const { data, error } = await supabase
      .from('beauty_inventory_sessions')
      .select('*')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalInventorySessions(salonId);
    }

    return data.map((d: any) => ({
      id: d.id,
      salonId: d.salon_id,
      dateInventaire: d.date_inventaire,
      realiseParNom: d.realise_par_nom,
      items: d.items || [],
      commentaire: d.commentaire,
      totalEcartValeurFcfa: d.total_ecart_valeur_fcfa || 0,
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn('Erreur fetchInventorySessions Supabase:', err);
    return getLocalInventorySessions(salonId);
  }
}

// =============================================================================
// 2. CAISSE & VENTES (SALES / POS)
// =============================================================================

export async function fetchBeautySales(
  salonId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: BeautyPaymentMethod;
    employeeId?: string;
    limit?: number;
  }
): Promise<BeautySale[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalSales(salonId, options);
  }

  try {
    let query = supabase
      .from('beauty_sales')
      .select('*, beauty_sale_items(*)')
      .eq('salon_id', salonId)
      .order('date_vente', { ascending: false });

    if (options?.startDate) {
      query = query.gte('date_vente', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('date_vente', options.endDate);
    }
    if (options?.paymentMethod) {
      query = query.eq('moyen_paiement', options.paymentMethod);
    }
    if (options?.employeeId) {
      query = query.eq('employee_id', options.employeeId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalSales(salonId, options);
    }

    return data.map(mapDbToSale);
  } catch (err) {
    console.warn('Erreur fetchBeautySales Supabase:', err);
    return getLocalSales(salonId, options);
  }
}

export async function createBeautySale(saleInput: {
  salonId: string;
  salonNom?: string;
  appointmentId?: string;
  clientId?: string;
  nomClient: string;
  telephoneClient?: string;
  employeeId?: string;
  employeeName?: string;
  items: BeautySaleItem[];
  montantBrutFcfa: number;
  montantRemiseFcfa: number;
  montantTotalFcfa: number;
  montantRecuFcfa?: number;
  montantRenduFcfa?: number;
  moyenPaiement: BeautyPaymentMethod;
  referencePaiement?: string;
  recompenseId?: string;
  notes?: string;
  caissierNom?: string;
}): Promise<BeautySale> {
  const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const nowIso = new Date().toISOString();

  // 1. Calculate loyalty points to earn
  let pointsGagnes = 0;
  let pointsUtilises = 0;
  let loyaltySettings: BeautyLoyaltySettings | null = null;
  let clientLoyaltyAcc: BeautyLoyaltyAccount | null = null;

  try {
    loyaltySettings = await fetchLoyaltySettings(saleInput.salonId);
    if (loyaltySettings && loyaltySettings.actif && saleInput.telephoneClient) {
      const step = loyaltySettings.montantStepFcfa || 1000;
      const ptsStep = loyaltySettings.pointsGagnesParStep || 10;
      pointsGagnes = Math.floor(saleInput.montantTotalFcfa / step) * ptsStep;

      // Fetch or initialize client loyalty account
      clientLoyaltyAcc = await getOrCreateLoyaltyAccount(
        saleInput.salonId,
        saleInput.nomClient,
        saleInput.telephoneClient,
        saleInput.clientId
      );

      // If a reward was applied
      if (saleInput.recompenseId) {
        const rewards = await fetchLoyaltyRewards(saleInput.salonId);
        const reward = rewards.find(r => r.id === saleInput.recompenseId);
        if (reward) {
          pointsUtilises = reward.pointsRequis;
        }
      }
    }
  } catch (loyaltyErr) {
    console.warn('Erreur calcul points fidélité:', loyaltyErr);
  }

  const newSale: BeautySale = {
    id: saleId,
    salonId: saleInput.salonId,
    salonNom: saleInput.salonNom,
    appointmentId: saleInput.appointmentId,
    clientId: saleInput.clientId,
    nomClient: saleInput.nomClient || 'Client de passage',
    telephoneClient: saleInput.telephoneClient,
    employeeId: saleInput.employeeId,
    employeeName: saleInput.employeeName,
    items: saleInput.items,
    montantBrutFcfa: saleInput.montantBrutFcfa,
    montantRemiseFcfa: saleInput.montantRemiseFcfa || 0,
    montantTotalFcfa: saleInput.montantTotalFcfa,
    montantRecuFcfa: saleInput.montantRecuFcfa,
    montantRenduFcfa: saleInput.montantRenduFcfa,
    moyenPaiement: saleInput.moyenPaiement,
    referencePaiement: saleInput.referencePaiement,
    statut: 'paye',
    dateVente: nowIso,
    pointsFideliteGagnes: pointsGagnes,
    pointsFideliteUtilises: pointsUtilises,
    recompenseId: saleInput.recompenseId,
    notes: saleInput.notes,
    caissierNom: saleInput.caissierNom || 'Caisse Principale',
    createdAt: nowIso
  };

  // 2. Perform DB Insertion if Supabase is active
  let savedSale: BeautySale = newSale;
  if (isSupabaseConfigured) {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from('beauty_sales')
        .insert({
          salon_id: newSale.salonId,
          appointment_id: newSale.appointmentId || null,
          client_id: newSale.clientId || null,
          nom_client: newSale.nomClient,
          telephone_client: newSale.telephoneClient || null,
          employee_id: newSale.employeeId || null,
          employee_name: newSale.employeeName || null,
          montant_brut_fcfa: newSale.montantBrutFcfa,
          montant_remise_fcfa: newSale.montantRemiseFcfa,
          montant_total_fcfa: newSale.montantTotalFcfa,
          montant_recu_fcfa: newSale.montantRecuFcfa || null,
          montant_rendu_fcfa: newSale.montantRenduFcfa || null,
          moyen_paiement: newSale.moyenPaiement,
          reference_paiement: newSale.referencePaiement || null,
          statut: 'paye',
          date_vente: newSale.dateVente,
          points_fidelite_gagnes: pointsGagnes,
          points_fidelite_utilises: pointsUtilises,
          recompense_id: newSale.recompenseId || null,
          notes: newSale.notes || null,
          caissier_nom: newSale.caissierNom || null
        })
        .select()
        .single();

      if (!saleError && saleData) {
        const dbSaleId = saleData.id;
        savedSale = { ...newSale, id: dbSaleId };

        // Insert sale items
        const itemsToInsert = newSale.items.map(it => ({
          sale_id: dbSaleId,
          item_type: it.itemType,
          item_id: it.itemId,
          nom: it.nom,
          quantite: it.quantite,
          prix_unitaire_fcfa: it.prixUnitaireFcfa,
          montant_total_fcfa: it.montantTotalFcfa,
          notes: it.notes || null
        }));

        await supabase.from('beauty_sale_items').insert(itemsToInsert);
      }
    } catch (dbErr) {
      console.warn('Erreur insertion vente Supabase, poursuite en local:', dbErr);
    }
  }

  // 3. Auto-deduct stock for sold products & log movement
  for (const item of newSale.items) {
    if (item.itemType === 'produit') {
      try {
        await createStockMovement({
          salonId: newSale.salonId,
          productId: item.itemId,
          productNom: item.nom,
          quantite: item.quantite,
          typeMouvement: 'vente',
          saleId: savedSale.id,
          userName: newSale.caissierNom || 'Caisse',
          dateMouvement: nowIso,
          commentaire: `Vente #${savedSale.id.slice(-6)} - Client: ${newSale.nomClient}`
        });
      } catch (stockErr) {
        console.warn('Erreur décrément stock vente:', stockErr);
      }
    }
  }

  // 4. Update Loyalty Account & log transaction
  if (clientLoyaltyAcc && (pointsGagnes > 0 || pointsUtilises > 0)) {
    try {
      const netDelta = pointsGagnes - pointsUtilises;
      const newSolde = Math.max(0, clientLoyaltyAcc.pointsSolde + netDelta);
      const newCumul = clientLoyaltyAcc.pointsCumulesTotal + pointsGagnes;
      const newUtilises = clientLoyaltyAcc.pointsUtilisesTotal + pointsUtilises;

      // Determine new tier
      const tier = determineLoyaltyTier(newCumul, loyaltySettings);

      await updateLoyaltyAccount(clientLoyaltyAcc.id, {
        pointsSolde: newSolde,
        pointsCumulesTotal: newCumul,
        pointsUtilisesTotal: newUtilises,
        niveau: tier,
        dernierAchatDate: nowIso
      });

      // Log points gain
      if (pointsGagnes > 0) {
        await logLoyaltyTransaction({
          salonId: newSale.salonId,
          accountId: clientLoyaltyAcc.id,
          clientId: newSale.clientId,
          nomClient: newSale.nomClient,
          telephoneClient: newSale.telephoneClient,
          saleId: savedSale.id,
          typeTransaction: 'gain',
          points: pointsGagnes,
          soldeApres: newSolde,
          motif: `Achat en caisse (${newSale.montantTotalFcfa.toLocaleString()} FCFA)`,
          dateTransaction: nowIso
        });
      }

      // Log reward redemption
      if (pointsUtilises > 0) {
        await logLoyaltyTransaction({
          salonId: newSale.salonId,
          accountId: clientLoyaltyAcc.id,
          clientId: newSale.clientId,
          nomClient: newSale.nomClient,
          telephoneClient: newSale.telephoneClient,
          saleId: savedSale.id,
          rewardId: newSale.recompenseId,
          typeTransaction: 'utilisation',
          points: -pointsUtilises,
          soldeApres: newSolde,
          motif: `Utilisation d'une récompense fidélité`,
          dateTransaction: nowIso
        });
      }
    } catch (loyaltyUpdateErr) {
      console.warn('Erreur mise à jour compte fidélité:', loyaltyUpdateErr);
    }
  }

  // 5. Update appointment status if linked
  if (newSale.appointmentId && isSupabaseConfigured) {
    try {
      await supabase
        .from('beauty_appointments')
        .update({ statut: 'termine' })
        .eq('id', newSale.appointmentId);
    } catch (apptErr) {
      console.warn('Erreur update rdv linked:', apptErr);
    }
  }

  saveLocalSale(savedSale);
  return savedSale;
}

export async function cancelBeautySale(saleId: string, salonId: string, reason?: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('beauty_sales')
        .update({ statut: 'annule', notes: reason ? `Annulé: ${reason}` : 'Annulé' })
        .eq('id', saleId)
        .eq('salon_id', salonId);

      if (!error) {
        updateLocalSaleStatus(saleId, 'annule');
        return true;
      }
    } catch (err) {
      console.warn('Erreur cancelBeautySale Supabase:', err);
    }
  }

  updateLocalSaleStatus(saleId, 'annule');
  return true;
}

// -----------------------------------------------------------------------------
// Cash Closures (Clôtures de Caisse)
// -----------------------------------------------------------------------------

export async function fetchCashClosures(salonId: string): Promise<BeautyCashClosure[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalCashClosures(salonId);
  }

  try {
    const { data, error } = await supabase
      .from('beauty_cash_closures')
      .select('*')
      .eq('salon_id', salonId)
      .order('date_cloture', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalCashClosures(salonId);
    }

    return data.map((d: any) => ({
      id: d.id,
      salonId: d.salon_id,
      dateCloture: d.date_cloture,
      heureCloture: d.heure_cloture,
      caissierId: d.caissier_id,
      caissierNom: d.caissier_nom,
      fondDeCaisseInitialFcfa: d.fond_de_caisse_initial_fcfa || 0,
      totalVentesFcfa: d.total_ventes_fcfa || 0,
      totalEspecesFcfa: d.total_especes_fcfa || 0,
      totalOrangeMoneyFcfa: d.total_orange_money_fcfa || 0,
      totalMoovMoneyFcfa: d.total_moov_money_fcfa || 0,
      totalWaveFcfa: d.total_wave_fcfa || 0,
      totalVirementFcfa: d.total_virement_fcfa || 0,
      totalAutreFcfa: d.total_autre_fcfa || 0,
      nombreTransactions: d.nombre_transactions || 0,
      totalReelConstateFcfa: d.total_reel_constate_fcfa || 0,
      ecartCaisseFcfa: d.ecart_caisse_fcfa || 0,
      notes: d.notes,
      statut: d.statut,
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn('Erreur fetchCashClosures Supabase:', err);
    return getLocalCashClosures(salonId);
  }
}

export async function createCashClosure(
  closureData: Omit<BeautyCashClosure, 'id' | 'createdAt'>
): Promise<BeautyCashClosure> {
  const newClosure: BeautyCashClosure = {
    ...closureData,
    id: `closure_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_cash_closures')
        .upsert({
          salon_id: closureData.salonId,
          date_cloture: closureData.dateCloture,
          heure_cloture: closureData.heureCloture,
          caissier_id: closureData.caissierId || null,
          caissier_nom: closureData.caissierNom,
          fond_de_caisse_initial_fcfa: closureData.fondDeCaisseInitialFcfa,
          total_ventes_fcfa: closureData.totalVentesFcfa,
          total_especes_fcfa: closureData.totalEspecesFcfa,
          total_orange_money_fcfa: closureData.totalOrangeMoneyFcfa,
          total_moov_money_fcfa: closureData.totalMoovMoneyFcfa,
          total_wave_fcfa: closureData.totalWaveFcfa,
          total_virement_fcfa: closureData.totalVirementFcfa,
          total_autre_fcfa: closureData.totalAutreFcfa,
          nombre_transactions: closureData.nombreTransactions,
          total_reel_constate_fcfa: closureData.totalReelConstateFcfa,
          ecart_caisse_fcfa: closureData.ecartCaisseFcfa,
          notes: closureData.notes || null,
          statut: 'cloturee'
        }, { onConflict: 'salon_id,date_cloture' })
        .select()
        .single();

      if (!error && data) {
        const saved: BeautyCashClosure = {
          id: data.id,
          salonId: data.salon_id,
          dateCloture: data.date_cloture,
          heureCloture: data.heure_cloture,
          caissierId: data.caissier_id,
          caissierNom: data.caissier_nom,
          fondDeCaisseInitialFcfa: data.fond_de_caisse_initial_fcfa,
          totalVentesFcfa: data.total_ventes_fcfa,
          totalEspecesFcfa: data.total_especes_fcfa,
          totalOrangeMoneyFcfa: data.total_orange_money_fcfa,
          totalMoovMoneyFcfa: data.total_moov_money_fcfa,
          totalWaveFcfa: data.total_wave_fcfa,
          totalVirementFcfa: data.total_virement_fcfa,
          totalAutreFcfa: data.total_autre_fcfa,
          nombreTransactions: data.nombre_transactions,
          totalReelConstateFcfa: data.total_reel_constate_fcfa,
          ecartCaisseFcfa: data.ecart_caisse_fcfa,
          notes: data.notes,
          statut: data.statut,
          createdAt: data.created_at
        };
        saveLocalCashClosure(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Erreur createCashClosure Supabase:', err);
    }
  }

  saveLocalCashClosure(newClosure);
  return newClosure;
}

// =============================================================================
// 3. FIDÉLITÉ & RÉCOMPENSES (« ZAKA BEAUTY REWARDS »)
// =============================================================================

export async function fetchLoyaltySettings(salonId: string): Promise<BeautyLoyaltySettings> {
  const defaultSettings: BeautyLoyaltySettings = {
    salonId,
    actif: true,
    montantStepFcfa: 1000,
    pointsGagnesParStep: 10,
    expirationMois: 12,
    niveauBronzeMinPoints: 0,
    niveauArgentMinPoints: 200,
    niveauOrMinPoints: 500,
    niveauPlatineMinPoints: 1000
  };

  if (!isSupabaseConfigured || !salonId) {
    const local = getLocalLoyaltySettings(salonId);
    return local || defaultSettings;
  }

  try {
    const { data, error } = await supabase
      .from('beauty_loyalty_settings')
      .select('*')
      .eq('salon_id', salonId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        salonId: data.salon_id,
        actif: data.actif,
        montantStepFcfa: data.montant_step_fcfa,
        pointsGagnesParStep: data.points_gagnes_par_step,
        expirationMois: data.expiration_mois,
        niveauBronzeMinPoints: data.niveau_bronze_min_points,
        niveauArgentMinPoints: data.niveau_argent_min_points,
        niveauOrMinPoints: data.niveau_or_min_points,
        niveauPlatineMinPoints: data.niveau_platine_min_points,
        updatedAt: data.updated_at
      };
    }
  } catch (err) {
    console.warn('Erreur fetchLoyaltySettings Supabase:', err);
  }

  const local = getLocalLoyaltySettings(salonId);
  return local || defaultSettings;
}

export async function saveLoyaltySettings(
  settings: BeautyLoyaltySettings
): Promise<BeautyLoyaltySettings> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_loyalty_settings')
        .upsert({
          salon_id: settings.salonId,
          actif: settings.actif,
          montant_step_fcfa: settings.montantStepFcfa,
          points_gagnes_par_step: settings.pointsGagnesParStep,
          expiration_mois: settings.expirationMois || 12,
          niveau_bronze_min_points: settings.niveauBronzeMinPoints || 0,
          niveau_argent_min_points: settings.niveauArgentMinPoints || 200,
          niveau_or_min_points: settings.niveauOrMinPoints || 500,
          niveau_platine_min_points: settings.niveauPlatineMinPoints || 1000,
          updated_at: new Date().toISOString()
        }, { onConflict: 'salon_id' })
        .select()
        .single();

      if (!error && data) {
        const saved: BeautyLoyaltySettings = {
          id: data.id,
          salonId: data.salon_id,
          actif: data.actif,
          montantStepFcfa: data.montant_step_fcfa,
          pointsGagnesParStep: data.points_gagnes_par_step,
          expirationMois: data.expiration_mois,
          niveauBronzeMinPoints: data.niveau_bronze_min_points,
          niveauArgentMinPoints: data.niveau_argent_min_points,
          niveauOrMinPoints: data.niveau_or_min_points,
          niveauPlatineMinPoints: data.niveau_platine_min_points,
          updatedAt: data.updated_at
        };
        saveLocalLoyaltySettings(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Erreur saveLoyaltySettings Supabase:', err);
    }
  }

  saveLocalLoyaltySettings(settings);
  return settings;
}

export async function fetchSalonLoyaltyAccounts(salonId: string): Promise<BeautyLoyaltyAccount[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalLoyaltyAccounts(salonId);
  }

  try {
    const { data, error } = await supabase
      .from('beauty_loyalty_accounts')
      .select('*')
      .eq('salon_id', salonId)
      .order('points_solde', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalLoyaltyAccounts(salonId);
    }

    return data.map((d: any) => ({
      id: d.id,
      salonId: d.salon_id,
      clientId: d.client_id,
      nomClient: d.nom_client,
      telephoneClient: d.telephone_client,
      pointsSolde: d.points_solde,
      pointsCumulesTotal: d.points_cumules_total,
      pointsUtilisesTotal: d.points_utilises_total,
      niveau: d.niveau as BeautyLoyaltyTier,
      dernierAchatDate: d.dernier_achat_date,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  } catch (err) {
    console.warn('Erreur fetchSalonLoyaltyAccounts Supabase:', err);
    return getLocalLoyaltyAccounts(salonId);
  }
}

export async function fetchClientLoyaltyAccount(
  salonId: string,
  phoneOrClientId: string
): Promise<BeautyLoyaltyAccount | null> {
  const accounts = await fetchSalonLoyaltyAccounts(salonId);
  return accounts.find(
    a => a.telephoneClient === phoneOrClientId || a.clientId === phoneOrClientId
  ) || null;
}

export async function fetchAllClientLoyaltyCards(
  phoneOrClientId: string
): Promise<Array<BeautyLoyaltyAccount & { salonNom?: string; salonPhoto?: string }>> {
  if (!phoneOrClientId) return [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_loyalty_accounts')
        .select('*, beauty_salons(nom, photo_profil)')
        .or(`client_id.eq.${phoneOrClientId},telephone_client.eq.${phoneOrClientId}`);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          salonId: d.salon_id,
          salonNom: d.beauty_salons?.nom || 'Salon de Beauté',
          salonPhoto: d.beauty_salons?.photo_profil,
          clientId: d.client_id,
          nomClient: d.nom_client,
          telephoneClient: d.telephone_client,
          pointsSolde: d.points_solde,
          pointsCumulesTotal: d.points_cumules_total,
          pointsUtilisesTotal: d.points_utilises_total,
          niveau: d.niveau as BeautyLoyaltyTier,
          dernierAchatDate: d.dernier_achat_date,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
      }
    } catch (err) {
      console.warn('Erreur fetchAllClientLoyaltyCards Supabase:', err);
    }
  }

  const all = getLocalLoyaltyAccounts();
  return all
    .filter(a => a.telephoneClient === phoneOrClientId || a.clientId === phoneOrClientId)
    .map(a => ({ ...a, salonNom: 'Salon Partenaire' }));
}

export async function getOrCreateLoyaltyAccount(
  salonId: string,
  nomClient: string,
  telephoneClient: string,
  clientId?: string
): Promise<BeautyLoyaltyAccount> {
  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from('beauty_loyalty_accounts')
        .select('*')
        .eq('salon_id', salonId)
        .eq('telephone_client', telephoneClient)
        .maybeSingle();

      if (existing) {
        return {
          id: existing.id,
          salonId: existing.salon_id,
          clientId: existing.client_id,
          nomClient: existing.nom_client,
          telephoneClient: existing.telephone_client,
          pointsSolde: existing.points_solde,
          pointsCumulesTotal: existing.points_cumules_total,
          pointsUtilisesTotal: existing.points_utilises_total,
          niveau: existing.niveau as BeautyLoyaltyTier,
          dernierAchatDate: existing.dernier_achat_date,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at
        };
      }

      const { data: created, error } = await supabase
        .from('beauty_loyalty_accounts')
        .insert({
          salon_id: salonId,
          client_id: clientId || null,
          nom_client: nomClient,
          telephone_client: telephoneClient,
          points_solde: 0,
          points_cumules_total: 0,
          points_utilises_total: 0,
          niveau: 'bronze'
        })
        .select()
        .single();

      if (!error && created) {
        const acc: BeautyLoyaltyAccount = {
          id: created.id,
          salonId: created.salon_id,
          clientId: created.client_id,
          nomClient: created.nom_client,
          telephoneClient: created.telephone_client,
          pointsSolde: created.points_solde,
          pointsCumulesTotal: created.points_cumules_total,
          pointsUtilisesTotal: created.points_utilises_total,
          niveau: created.niveau as BeautyLoyaltyTier,
          dernierAchatDate: created.dernier_achat_date,
          createdAt: created.created_at,
          updatedAt: created.updated_at
        };
        saveLocalLoyaltyAccount(acc);
        return acc;
      }
    } catch (err) {
      console.warn('Erreur getOrCreateLoyaltyAccount Supabase:', err);
    }
  }

  const existingLocal = getLocalLoyaltyAccounts(salonId).find(
    a => a.telephoneClient === telephoneClient
  );
  if (existingLocal) return existingLocal;

  const newAcc: BeautyLoyaltyAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    salonId,
    clientId,
    nomClient,
    telephoneClient,
    pointsSolde: 0,
    pointsCumulesTotal: 0,
    pointsUtilisesTotal: 0,
    niveau: 'bronze',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveLocalLoyaltyAccount(newAcc);
  return newAcc;
}

export async function updateLoyaltyAccount(
  id: string,
  updates: Partial<BeautyLoyaltyAccount>
): Promise<BeautyLoyaltyAccount> {
  if (isSupabaseConfigured) {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.pointsSolde !== undefined) dbUpdates.points_solde = updates.pointsSolde;
      if (updates.pointsCumulesTotal !== undefined) dbUpdates.points_cumules_total = updates.pointsCumulesTotal;
      if (updates.pointsUtilisesTotal !== undefined) dbUpdates.points_utilises_total = updates.pointsUtilisesTotal;
      if (updates.niveau !== undefined) dbUpdates.niveau = updates.niveau;
      if (updates.dernierAchatDate !== undefined) dbUpdates.dernier_achat_date = updates.dernierAchatDate;

      const { data, error } = await supabase
        .from('beauty_loyalty_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated: BeautyLoyaltyAccount = {
          id: data.id,
          salonId: data.salon_id,
          clientId: data.client_id,
          nomClient: data.nom_client,
          telephoneClient: data.telephone_client,
          pointsSolde: data.points_solde,
          pointsCumulesTotal: data.points_cumules_total,
          pointsUtilisesTotal: data.points_utilises_total,
          niveau: data.niveau as BeautyLoyaltyTier,
          dernierAchatDate: data.dernier_achat_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        saveLocalLoyaltyAccount(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Erreur updateLoyaltyAccount Supabase:', err);
    }
  }

  const existing = getLocalLoyaltyAccounts().find(a => a.id === id);
  if (!existing) throw new Error('Compte fidélité non trouvé');
  const updated: BeautyLoyaltyAccount = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveLocalLoyaltyAccount(updated);
  return updated;
}

export async function adjustLoyaltyPoints(
  salonId: string,
  accountId: string,
  pointsDelta: number,
  motif: string
): Promise<BeautyLoyaltyAccount> {
  const accounts = await fetchSalonLoyaltyAccounts(salonId);
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Compte introuvable');

  const newSolde = Math.max(0, acc.pointsSolde + pointsDelta);
  const newCumul = pointsDelta > 0 ? acc.pointsCumulesTotal + pointsDelta : acc.pointsCumulesTotal;
  const newUtilises = pointsDelta < 0 ? acc.pointsUtilisesTotal + Math.abs(pointsDelta) : acc.pointsUtilisesTotal;
  const settings = await fetchLoyaltySettings(salonId);
  const tier = determineLoyaltyTier(newCumul, settings);

  const updated = await updateLoyaltyAccount(accountId, {
    pointsSolde: newSolde,
    pointsCumulesTotal: newCumul,
    pointsUtilisesTotal: newUtilises,
    niveau: tier
  });

  await logLoyaltyTransaction({
    salonId,
    accountId,
    clientId: acc.clientId,
    nomClient: acc.nomClient,
    telephoneClient: acc.telephoneClient,
    typeTransaction: 'ajustement',
    points: pointsDelta,
    soldeApres: newSolde,
    motif: motif || 'Ajustement manuel de points',
    dateTransaction: new Date().toISOString()
  });

  return updated;
}

// -----------------------------------------------------------------------------
// Loyalty Rewards Catalog
// -----------------------------------------------------------------------------

export async function fetchLoyaltyRewards(salonId: string, onlyActive = false): Promise<BeautyReward[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalLoyaltyRewards(salonId, onlyActive);
  }

  try {
    let query = supabase
      .from('beauty_rewards')
      .select('*, beauty_services(nom), beauty_products(nom)')
      .eq('salon_id', salonId)
      .order('points_requis', { ascending: true });

    if (onlyActive) {
      query = query.eq('actif', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalLoyaltyRewards(salonId, onlyActive);
    }

    return data.map((d: any) => ({
      id: d.id,
      salonId: d.salon_id,
      titre: d.titre,
      description: d.description,
      pointsRequis: d.points_requis,
      typeRecompense: d.type_recompense as BeautyRewardType,
      valeurReduction: d.valeur_reduction,
      serviceId: d.service_id,
      serviceNom: d.beauty_services?.nom,
      productId: d.product_id,
      productNom: d.beauty_products?.nom,
      actif: d.actif,
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn('Erreur fetchLoyaltyRewards Supabase:', err);
    return getLocalLoyaltyRewards(salonId, onlyActive);
  }
}

export async function saveLoyaltyReward(
  rewardData: Partial<BeautyReward> & { salonId: string; titre: string; pointsRequis: number; typeRecompense: BeautyRewardType }
): Promise<BeautyReward> {
  const newReward: BeautyReward = {
    ...rewardData,
    id: rewardData.id || `rew_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    actif: rewardData.actif !== undefined ? rewardData.actif : true,
    createdAt: rewardData.createdAt || new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_rewards')
        .insert({
          salon_id: rewardData.salonId,
          titre: rewardData.titre,
          description: rewardData.description || null,
          points_requis: rewardData.pointsRequis,
          type_recompense: rewardData.typeRecompense,
          valeur_reduction: rewardData.valeurReduction || null,
          service_id: rewardData.serviceId || null,
          product_id: rewardData.productId || null,
          actif: rewardData.actif !== undefined ? rewardData.actif : true
        })
        .select()
        .single();

      if (!error && data) {
        const saved: BeautyReward = {
          id: data.id,
          salonId: data.salon_id,
          titre: data.titre,
          description: data.description,
          pointsRequis: data.points_requis,
          typeRecompense: data.type_recompense as BeautyRewardType,
          valeurReduction: data.valeur_reduction,
          serviceId: data.service_id,
          productId: data.product_id,
          actif: data.actif,
          createdAt: data.created_at
        };
        saveLocalLoyaltyReward(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Erreur saveLoyaltyReward Supabase:', err);
    }
  }

  saveLocalLoyaltyReward(newReward);
  return newReward;
}

export async function updateLoyaltyReward(
  id: string,
  updates: Partial<BeautyReward>
): Promise<BeautyReward> {
  if (isSupabaseConfigured) {
    try {
      const dbUpdates: any = {};
      if (updates.titre !== undefined) dbUpdates.titre = updates.titre;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.pointsRequis !== undefined) dbUpdates.points_requis = updates.pointsRequis;
      if (updates.typeRecompense !== undefined) dbUpdates.type_recompense = updates.typeRecompense;
      if (updates.valeurReduction !== undefined) dbUpdates.valeur_reduction = updates.valeurReduction;
      if (updates.serviceId !== undefined) dbUpdates.service_id = updates.serviceId;
      if (updates.productId !== undefined) dbUpdates.product_id = updates.productId;
      if (updates.actif !== undefined) dbUpdates.actif = updates.actif;

      const { data, error } = await supabase
        .from('beauty_rewards')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated: BeautyReward = {
          id: data.id,
          salonId: data.salon_id,
          titre: data.titre,
          description: data.description,
          pointsRequis: data.points_requis,
          typeRecompense: data.type_recompense as BeautyRewardType,
          valeurReduction: data.valeur_reduction,
          serviceId: data.service_id,
          productId: data.product_id,
          actif: data.actif,
          createdAt: data.created_at
        };
        saveLocalLoyaltyReward(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Erreur updateLoyaltyReward Supabase:', err);
    }
  }

  const existing = getLocalLoyaltyRewards().find(r => r.id === id);
  if (!existing) throw new Error('Récompense non trouvée');
  const updated = { ...existing, ...updates };
  saveLocalLoyaltyReward(updated);
  return updated;
}

export async function deleteLoyaltyReward(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('beauty_rewards').delete().eq('id', id);
      if (!error) {
        removeLocalLoyaltyReward(id);
        return true;
      }
    } catch (err) {
      console.warn('Erreur deleteLoyaltyReward Supabase:', err);
    }
  }
  removeLocalLoyaltyReward(id);
  return true;
}

// -----------------------------------------------------------------------------
// Loyalty Transactions Log
// -----------------------------------------------------------------------------

export async function fetchLoyaltyTransactions(
  salonId: string,
  accountId?: string
): Promise<BeautyLoyaltyTransaction[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalLoyaltyTransactions(salonId, accountId);
  }

  try {
    let query = supabase
      .from('beauty_loyalty_transactions')
      .select('*')
      .eq('salon_id', salonId)
      .order('date_transaction', { ascending: false });

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalLoyaltyTransactions(salonId, accountId);
    }

    return data.map((d: any) => ({
      id: d.id,
      salonId: d.salon_id,
      accountId: d.account_id,
      clientId: d.client_id,
      nomClient: d.nom_client,
      telephoneClient: d.telephone_client,
      saleId: d.sale_id,
      rewardId: d.reward_id,
      rewardTitre: d.reward_titre,
      typeTransaction: d.type_transaction,
      points: d.points,
      soldeApres: d.solde_apres,
      motif: d.motif,
      dateTransaction: d.date_transaction,
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn('Erreur fetchLoyaltyTransactions Supabase:', err);
    return getLocalLoyaltyTransactions(salonId, accountId);
  }
}

export async function logLoyaltyTransaction(
  txData: Omit<BeautyLoyaltyTransaction, 'id' | 'createdAt'>
): Promise<BeautyLoyaltyTransaction> {
  const newTx: BeautyLoyaltyTransaction = {
    ...txData,
    id: `ltx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('beauty_loyalty_transactions').insert({
        salon_id: txData.salonId,
        account_id: txData.accountId,
        client_id: txData.clientId || null,
        nom_client: txData.nomClient || null,
        telephone_client: txData.telephoneClient || null,
        sale_id: txData.saleId || null,
        reward_id: txData.rewardId || null,
        reward_titre: txData.rewardTitre || null,
        type_transaction: txData.typeTransaction,
        points: txData.points,
        solde_apres: txData.soldeApres,
        motif: txData.motif || null,
        date_transaction: txData.dateTransaction || new Date().toISOString()
      });
    } catch (err) {
      console.warn('Erreur logLoyaltyTransaction Supabase:', err);
    }
  }

  saveLocalLoyaltyTransaction(newTx);
  return newTx;
}

function determineLoyaltyTier(
  totalCumul: number,
  settings: BeautyLoyaltySettings | null
): BeautyLoyaltyTier {
  if (!settings) return 'bronze';
  if (totalCumul >= (settings.niveauPlatineMinPoints || 1000)) return 'platine';
  if (totalCumul >= (settings.niveauOrMinPoints || 500)) return 'or';
  if (totalCumul >= (settings.niveauArgentMinPoints || 200)) return 'argent';
  return 'bronze';
}

// =============================================================================
// 4. STAFF / TEAM MANAGEMENT
// =============================================================================

export async function fetchSalonStaff(salonId: string): Promise<BeautyStaffMember[]> {
  if (!isSupabaseConfigured || !salonId) {
    return getLocalStaff(salonId);
  }

  try {
    const { data, error } = await supabase
      .from('beauty_staff_members')
      .select('*')
      .eq('salon_id', salonId)
      .order('nom', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getLocalStaff(salonId);
    }

    return data.map((d: any) => ({
      id: d.id,
      salonId: d.salon_id,
      userId: d.user_id,
      nom: d.nom,
      role: d.role,
      telephone: d.telephone,
      specialites: d.specialites || [],
      actif: d.actif,
      avatarUrl: d.avatar_url
    }));
  } catch (err) {
    console.warn('Erreur fetchSalonStaff Supabase:', err);
    return getLocalStaff(salonId);
  }
}

export async function saveSalonStaffMember(
  staffData: Omit<BeautyStaffMember, 'id'>
): Promise<BeautyStaffMember> {
  const newStaff: BeautyStaffMember = {
    ...staffData,
    id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_staff_members')
        .insert({
          salon_id: staffData.salonId,
          user_id: staffData.userId || null,
          nom: staffData.nom,
          role: staffData.role,
          telephone: staffData.telephone || null,
          specialites: staffData.specialites || [],
          actif: staffData.actif !== undefined ? staffData.actif : true,
          avatar_url: staffData.avatarUrl || null
        })
        .select()
        .single();

      if (!error && data) {
        const saved: BeautyStaffMember = {
          id: data.id,
          salonId: data.salon_id,
          userId: data.user_id,
          nom: data.nom,
          role: data.role,
          telephone: data.telephone,
          specialites: data.specialites || [],
          actif: data.actif,
          avatarUrl: data.avatar_url
        };
        saveLocalStaff(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Erreur saveSalonStaffMember Supabase:', err);
    }
  }

  saveLocalStaff(newStaff);
  return newStaff;
}

export async function updateSalonStaffMember(
  id: string,
  updates: Partial<BeautyStaffMember>
): Promise<BeautyStaffMember> {
  if (isSupabaseConfigured) {
    try {
      const dbUpdates: any = {};
      if (updates.nom !== undefined) dbUpdates.nom = updates.nom;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.telephone !== undefined) dbUpdates.telephone = updates.telephone;
      if (updates.specialites !== undefined) dbUpdates.specialites = updates.specialites;
      if (updates.actif !== undefined) dbUpdates.actif = updates.actif;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

      const { data, error } = await supabase
        .from('beauty_staff_members')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated: BeautyStaffMember = {
          id: data.id,
          salonId: data.salon_id,
          userId: data.user_id,
          nom: data.nom,
          role: data.role,
          telephone: data.telephone,
          specialites: data.specialites || [],
          actif: data.actif,
          avatarUrl: data.avatar_url
        };
        saveLocalStaff(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Erreur updateSalonStaffMember Supabase:', err);
    }
  }

  const existing = getLocalStaff().find(s => s.id === id);
  if (!existing) throw new Error('Membre introuvable');
  const updated = { ...existing, ...updates };
  saveLocalStaff(updated);
  return updated;
}

export async function deleteSalonStaffMember(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('beauty_staff_members').delete().eq('id', id);
      if (!error) {
        removeLocalStaff(id);
        return true;
      }
    } catch (err) {
      console.warn('Erreur deleteSalonStaffMember Supabase:', err);
    }
  }
  removeLocalStaff(id);
  return true;
}

// =============================================================================
// 5. ADVANCED ANALYTICS AGGREGATIONS
// =============================================================================

export interface BeautyAnalyticsSummary {
  caAujourdhui: number;
  caHier: number;
  caCetteSemaine: number;
  caSemainePrecedente: number;
  caCeMois: number;
  caMoisPrecedent: number;
  evolutionMoisPourcent: number;
  evolutionSemainePourcent: number;
  totalVentes: number;
  totalClients: number;
  nouveauxClients: number;
  clientsRecurrents: number;
  totalRendezVous: number;
  tauxRdvTermines: number;
  panierMoyenFcfa: number;
  servicePlusVendu: string;
  produitPlusVendu: string;
  valeurStockAchatFcfa: number;
  valeurStockVenteFcfa: number;
  produitsStockFaibleCount: number;
  moyenPaiementBreakdown: Record<BeautyPaymentMethod, number>;
  ventesParJour: Array<{ date: string; label: string; ca: number; transactions: number }>;
  topServices: Array<{ nom: string; count: number; ca: number; partCaPourcent: number }>;
  topProduits: Array<{ nom: string; count: number; ca: number; stockRestant: number }>;
  frequentationJours: Array<{ jour: string; count: number; intensite: 'faible' | 'normale' | 'forte' }>;
  heuresDePointe: Array<{ heure: string; count: number; tag: 'creux' | 'moyen' | 'pointe' }>;
  performancesEquipe: Array<{ nom: string; prestations: number; ca: number }>;
}

export async function calculateBeautyAnalytics(
  salonId: string,
  sales: BeautySale[],
  appointments: BeautyAppointment[],
  products: BeautyProduct[],
  staff: BeautyStaffMember[]
): Promise<BeautyAnalyticsSummary> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay() || 7;
  startOfWeek.setDate(startOfWeek.getDate() - day + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfWeek.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  let caAujourdhui = 0;
  let caHier = 0;
  let caCetteSemaine = 0;
  let caSemainePrecedente = 0;
  let caCeMois = 0;
  let caMoisPrecedent = 0;

  const moyenPaiementBreakdown: Record<BeautyPaymentMethod, number> = {
    especes: 0,
    orange_money: 0,
    moov_money: 0,
    wave: 0,
    virement: 0,
    autre: 0
  };

  const clientPhoneMap = new Map<string, number>();
  const serviceStatsMap = new Map<string, { count: number; ca: number }>();
  const productStatsMap = new Map<string, { count: number; ca: number }>();
  const staffStatsMap = new Map<string, { prestations: number; ca: number }>();
  const dayCountMap = new Map<number, number>(); // 0..6
  const hourCountMap = new Map<number, number>(); // 0..23

  // Initialize day map
  for (let i = 0; i < 7; i++) dayCountMap.set(i, 0);
  for (let i = 8; i <= 20; i++) hourCountMap.set(i, 0);

  // Initialize staff map
  staff.forEach(s => staffStatsMap.set(s.nom, { prestations: 0, ca: 0 }));

  const activeSales = sales.filter(s => s.statut === 'paye');

  activeSales.forEach(sale => {
    const saleDate = new Date(sale.dateVente);
    const saleDateStr = sale.dateVente.split('T')[0];
    const amount = sale.montantTotalFcfa || 0;

    // CA by periods
    if (saleDateStr === todayStr) caAujourdhui += amount;
    if (saleDateStr === yesterdayStr) caHier += amount;
    if (saleDate >= startOfWeek) caCetteSemaine += amount;
    if (saleDate >= startOfPrevWeek && saleDate < startOfWeek) caSemainePrecedente += amount;
    if (saleDate >= startOfMonth) caCeMois += amount;
    if (saleDate >= startOfPrevMonth && saleDate <= endOfPrevMonth) caMoisPrecedent += amount;

    // Payment methods
    if (sale.moyenPaiement && moyenPaiementBreakdown[sale.moyenPaiement] !== undefined) {
      moyenPaiementBreakdown[sale.moyenPaiement] += amount;
    }

    // Clients
    const cPhone = sale.telephoneClient || sale.nomClient;
    clientPhoneMap.set(cPhone, (clientPhoneMap.get(cPhone) || 0) + 1);

    // Items
    sale.items?.forEach(it => {
      if (it.itemType === 'service') {
        const cur = serviceStatsMap.get(it.nom) || { count: 0, ca: 0 };
        serviceStatsMap.set(it.nom, {
          count: cur.count + it.quantite,
          ca: cur.ca + it.montantTotalFcfa
        });
      } else {
        const cur = productStatsMap.get(it.nom) || { count: 0, ca: 0 };
        productStatsMap.set(it.nom, {
          count: cur.count + it.quantite,
          ca: cur.ca + it.montantTotalFcfa
        });
      }
    });

    // Staff
    if (sale.employeeName) {
      const cur = staffStatsMap.get(sale.employeeName) || { prestations: 0, ca: 0 };
      staffStatsMap.set(sale.employeeName, {
        prestations: cur.prestations + (sale.items?.length || 1),
        ca: cur.ca + amount
      });
    }

    // Frequentation day & hour
    const dayOfWeek = saleDate.getDay();
    dayCountMap.set(dayOfWeek, (dayCountMap.get(dayOfWeek) || 0) + 1);
    const hour = saleDate.getHours();
    hourCountMap.set(hour, (hourCountMap.get(hour) || 0) + 1);
  });

  // Comparisons
  const evolutionMoisPourcent = caMoisPrecedent > 0
    ? Math.round(((caCeMois - caMoisPrecedent) / caMoisPrecedent) * 100)
    : (caCeMois > 0 ? 100 : 0);

  const evolutionSemainePourcent = caSemainePrecedente > 0
    ? Math.round(((caCetteSemaine - caSemainePrecedente) / caSemainePrecedente) * 100)
    : (caCetteSemaine > 0 ? 100 : 0);

  // Clients breakdown
  let nouveauxClients = 0;
  let clientsRecurrents = 0;
  clientPhoneMap.forEach(count => {
    if (count === 1) nouveauxClients++;
    else clientsRecurrents++;
  });
  const totalClients = clientPhoneMap.size;

  // Appointments stats
  const totalRendezVous = appointments.length;
  const rdvTermines = appointments.filter(a => a.statut === 'termine').length;
  const tauxRdvTermines = totalRendezVous > 0 ? Math.round((rdvTermines / totalRendezVous) * 100) : 0;

  // Average Basket
  const totalVentes = activeSales.length;
  const panierMoyenFcfa = totalVentes > 0 ? Math.round(activeSales.reduce((sum, s) => sum + s.montantTotalFcfa, 0) / totalVentes) : 0;

  // Top Services
  const totalServiceCa = Array.from(serviceStatsMap.values()).reduce((sum, s) => sum + s.ca, 0) || 1;
  const topServices = Array.from(serviceStatsMap.entries())
    .map(([nom, st]) => ({
      nom,
      count: st.count,
      ca: st.ca,
      partCaPourcent: Math.round((st.ca / totalServiceCa) * 100)
    }))
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 5);

  const servicePlusVendu = topServices[0]?.nom || 'Aucun';

  // Top Products
  const topProduits = Array.from(productStatsMap.entries())
    .map(([nom, st]) => {
      const prod = products.find(p => p.nom.toLowerCase() === nom.toLowerCase());
      return {
        nom,
        count: st.count,
        ca: st.ca,
        stockRestant: prod ? prod.quantiteActuelle : 0
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const produitPlusVendu = topProduits[0]?.nom || 'Aucun';

  // Stock values & low stock
  let valeurStockAchatFcfa = 0;
  let valeurStockVenteFcfa = 0;
  let produitsStockFaibleCount = 0;

  products.forEach(p => {
    valeurStockAchatFcfa += p.quantiteActuelle * (p.prixAchat || 0);
    valeurStockVenteFcfa += p.quantiteActuelle * (p.prixVente || 0);
    if (p.quantiteActuelle <= p.quantiteMinimale) {
      produitsStockFaibleCount++;
    }
  });

  // Daily evolution over the last 7 days
  const ventesParJour: Array<{ date: string; label: string; ca: number; transactions: number }> = [];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const daySales = activeSales.filter(s => s.dateVente.startsWith(dStr));
    const dayCa = daySales.reduce((sum, s) => sum + s.montantTotalFcfa, 0);
    ventesParJour.push({
      date: dStr,
      label: i === 0 ? "Aujourd'hui" : `${dayNames[d.getDay()]} ${d.getDate()}`,
      ca: dayCa,
      transactions: daySales.length
    });
  }

  // Frequentation days (Lun..Dim)
  const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const frequentationJours = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
    const count = dayCountMap.get(dayIndex) || 0;
    let intensite: 'faible' | 'normale' | 'forte' = 'normale';
    if (count >= 5 || (dayIndex === 6 && count > 0)) intensite = 'forte';
    else if (count <= 1) intensite = 'faible';
    return {
      jour: frenchDays[dayIndex],
      count,
      intensite
    };
  });

  // Peak hours
  const peakHoursSlots = [
    { label: '08h - 10h', hours: [8, 9] },
    { label: '10h - 12h', hours: [10, 11] },
    { label: '12h - 14h', hours: [12, 13] },
    { label: '14h - 16h', hours: [14, 15] },
    { label: '16h - 18h', hours: [16, 17] },
    { label: '18h - 20h', hours: [18, 19, 20] }
  ];

  const heuresDePointe = peakHoursSlots.map(slot => {
    const count = slot.hours.reduce((sum, h) => sum + (hourCountMap.get(h) || 0), 0);
    let tag: 'creux' | 'moyen' | 'pointe' = 'moyen';
    if (count >= 4) tag = 'pointe';
    else if (count <= 1) tag = 'creux';
    return {
      heure: slot.label,
      count,
      tag
    };
  });

  // Staff performances
  const performancesEquipe = Array.from(staffStatsMap.entries())
    .map(([nom, st]) => ({
      nom,
      prestations: st.prestations,
      ca: st.ca
    }))
    .sort((a, b) => b.ca - a.ca);

  return {
    caAujourdhui,
    caHier,
    caCetteSemaine,
    caSemainePrecedente,
    caCeMois,
    caMoisPrecedent,
    evolutionMoisPourcent,
    evolutionSemainePourcent,
    totalVentes,
    totalClients,
    nouveauxClients,
    clientsRecurrents,
    totalRendezVous,
    tauxRdvTermines,
    panierMoyenFcfa,
    servicePlusVendu,
    produitPlusVendu,
    valeurStockAchatFcfa,
    valeurStockVenteFcfa,
    produitsStockFaibleCount,
    moyenPaiementBreakdown,
    ventesParJour,
    topServices,
    topProduits,
    frequentationJours,
    heuresDePointe,
    performancesEquipe
  };
}

// =============================================================================
// LOCAL STORAGE PERSISTENCE HELPERS
// =============================================================================

function getLocalProducts(salonId?: string, onlyActive?: boolean): BeautyProduct[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_products');
    const list: BeautyProduct[] = raw ? JSON.parse(raw) : [];
    return list.filter(p => {
      if (salonId && p.salonId !== salonId) return false;
      if (onlyActive && !p.actif) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function saveLocalProduct(product: BeautyProduct) {
  const list = getLocalProducts();
  const idx = list.findIndex(p => p.id === product.id);
  if (idx >= 0) list[idx] = product;
  else list.push(product);
  localStorage.setItem('zaka_beauty_products', JSON.stringify(list));
}

function removeLocalProduct(id: string) {
  const list = getLocalProducts().filter(p => p.id !== id);
  localStorage.setItem('zaka_beauty_products', JSON.stringify(list));
}

function getLocalStockMovements(salonId?: string, productId?: string): BeautyStockMovement[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_stock_movements');
    const list: BeautyStockMovement[] = raw ? JSON.parse(raw) : [];
    return list.filter(m => {
      if (salonId && m.salonId !== salonId) return false;
      if (productId && m.productId !== productId) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function saveLocalStockMovement(mov: BeautyStockMovement) {
  const list = getLocalStockMovements();
  list.unshift(mov);
  localStorage.setItem('zaka_beauty_stock_movements', JSON.stringify(list.slice(0, 500)));
}

function getLocalInventorySessions(salonId?: string): BeautyInventorySession[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_inventory_sessions');
    const list: BeautyInventorySession[] = raw ? JSON.parse(raw) : [];
    return salonId ? list.filter(i => i.salonId === salonId) : list;
  } catch {
    return [];
  }
}

function saveLocalInventorySession(session: BeautyInventorySession) {
  const list = getLocalInventorySessions();
  list.unshift(session);
  localStorage.setItem('zaka_beauty_inventory_sessions', JSON.stringify(list));
}

function getLocalSales(salonId?: string, options?: any): BeautySale[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_sales');
    let list: BeautySale[] = raw ? JSON.parse(raw) : [];
    if (salonId) list = list.filter(s => s.salonId === salonId);
    if (options?.paymentMethod) list = list.filter(s => s.moyenPaiement === options.paymentMethod);
    if (options?.startDate) list = list.filter(s => s.dateVente >= options.startDate);
    if (options?.endDate) list = list.filter(s => s.dateVente <= options.endDate);
    return list;
  } catch {
    return [];
  }
}

function saveLocalSale(sale: BeautySale) {
  const list = getLocalSales();
  const idx = list.findIndex(s => s.id === sale.id);
  if (idx >= 0) list[idx] = sale;
  else list.unshift(sale);
  localStorage.setItem('zaka_beauty_sales', JSON.stringify(list.slice(0, 1000)));
}

function updateLocalSaleStatus(saleId: string, status: 'paye' | 'annule' | 'rembourse') {
  const list = getLocalSales();
  const item = list.find(s => s.id === saleId);
  if (item) {
    item.statut = status;
    localStorage.setItem('zaka_beauty_sales', JSON.stringify(list));
  }
}

function getLocalCashClosures(salonId?: string): BeautyCashClosure[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_cash_closures');
    const list: BeautyCashClosure[] = raw ? JSON.parse(raw) : [];
    return salonId ? list.filter(c => c.salonId === salonId) : list;
  } catch {
    return [];
  }
}

function saveLocalCashClosure(closure: BeautyCashClosure) {
  const list = getLocalCashClosures();
  const idx = list.findIndex(c => c.id === closure.id || (c.salonId === closure.salonId && c.dateCloture === closure.dateCloture));
  if (idx >= 0) list[idx] = closure;
  else list.unshift(closure);
  localStorage.setItem('zaka_beauty_cash_closures', JSON.stringify(list));
}

function getLocalLoyaltySettings(salonId?: string): BeautyLoyaltySettings | null {
  try {
    const raw = localStorage.getItem('zaka_beauty_loyalty_settings');
    const list: BeautyLoyaltySettings[] = raw ? JSON.parse(raw) : [];
    return list.find(s => s.salonId === salonId) || null;
  } catch {
    return null;
  }
}

function saveLocalLoyaltySettings(settings: BeautyLoyaltySettings) {
  const raw = localStorage.getItem('zaka_beauty_loyalty_settings');
  const list: BeautyLoyaltySettings[] = raw ? JSON.parse(raw) : [];
  const idx = list.findIndex(s => s.salonId === settings.salonId);
  if (idx >= 0) list[idx] = settings;
  else list.push(settings);
  localStorage.setItem('zaka_beauty_loyalty_settings', JSON.stringify(list));
}

function getLocalLoyaltyAccounts(salonId?: string): BeautyLoyaltyAccount[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_loyalty_accounts');
    const list: BeautyLoyaltyAccount[] = raw ? JSON.parse(raw) : [];
    return salonId ? list.filter(a => a.salonId === salonId) : list;
  } catch {
    return [];
  }
}

function saveLocalLoyaltyAccount(acc: BeautyLoyaltyAccount) {
  const list = getLocalLoyaltyAccounts();
  const idx = list.findIndex(a => a.id === acc.id);
  if (idx >= 0) list[idx] = acc;
  else list.push(acc);
  localStorage.setItem('zaka_beauty_loyalty_accounts', JSON.stringify(list));
}

function getLocalLoyaltyRewards(salonId?: string, onlyActive?: boolean): BeautyReward[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_rewards');
    const list: BeautyReward[] = raw ? JSON.parse(raw) : [];
    return list.filter(r => {
      if (salonId && r.salonId !== salonId) return false;
      if (onlyActive && !r.actif) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function saveLocalLoyaltyReward(reward: BeautyReward) {
  const list = getLocalLoyaltyRewards();
  const idx = list.findIndex(r => r.id === reward.id);
  if (idx >= 0) list[idx] = reward;
  else list.push(reward);
  localStorage.setItem('zaka_beauty_rewards', JSON.stringify(list));
}

function removeLocalLoyaltyReward(id: string) {
  const list = getLocalLoyaltyRewards().filter(r => r.id !== id);
  localStorage.setItem('zaka_beauty_rewards', JSON.stringify(list));
}

function getLocalLoyaltyTransactions(salonId?: string, accountId?: string): BeautyLoyaltyTransaction[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_loyalty_transactions');
    const list: BeautyLoyaltyTransaction[] = raw ? JSON.parse(raw) : [];
    return list.filter(t => {
      if (salonId && t.salonId !== salonId) return false;
      if (accountId && t.accountId !== accountId) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function saveLocalLoyaltyTransaction(tx: BeautyLoyaltyTransaction) {
  const list = getLocalLoyaltyTransactions();
  list.unshift(tx);
  localStorage.setItem('zaka_beauty_loyalty_transactions', JSON.stringify(list.slice(0, 1000)));
}

function getLocalStaff(salonId?: string): BeautyStaffMember[] {
  try {
    const raw = localStorage.getItem('zaka_beauty_staff');
    const list: BeautyStaffMember[] = raw ? JSON.parse(raw) : [];
    return salonId ? list.filter(s => s.salonId === salonId) : list;
  } catch {
    return [];
  }
}

function saveLocalStaff(staff: BeautyStaffMember) {
  const list = getLocalStaff();
  const idx = list.findIndex(s => s.id === staff.id);
  if (idx >= 0) list[idx] = staff;
  else list.push(staff);
  localStorage.setItem('zaka_beauty_staff', JSON.stringify(list));
}

function removeLocalStaff(id: string) {
  const list = getLocalStaff().filter(s => s.id !== id);
  localStorage.setItem('zaka_beauty_staff', JSON.stringify(list));
}

// -----------------------------------------------------------------------------
// Mapping Helpers
// -----------------------------------------------------------------------------

function mapDbToProduct(d: any): BeautyProduct {
  return {
    id: d.id,
    salonId: d.salon_id,
    nom: d.nom,
    categorie: d.categorie as BeautyProductCategory,
    sku: d.sku || undefined,
    unite: d.unite || 'unité',
    quantiteActuelle: d.quantite_actuelle || 0,
    quantiteMinimale: d.quantite_minimale || 2,
    prixAchat: Number(d.prix_achat) || 0,
    prixVente: Number(d.prix_vente) || 0,
    fournisseur: d.fournisseur || undefined,
    imageUrl: d.image_url || undefined,
    actif: d.actif !== undefined ? d.actif : true,
    createdAt: d.created_at,
    updatedAt: d.updated_at
  };
}

function mapDbToSale(d: any): BeautySale {
  const items: BeautySaleItem[] = (d.beauty_sale_items || []).map((it: any) => ({
    id: it.id,
    saleId: it.sale_id,
    itemType: it.item_type,
    itemId: it.item_id,
    nom: it.nom,
    quantite: it.quantite,
    prixUnitaireFcfa: Number(it.prix_unitaire_fcfa) || 0,
    montantTotalFcfa: Number(it.montant_total_fcfa) || 0,
    notes: it.notes || undefined
  }));

  return {
    id: d.id,
    salonId: d.salon_id,
    salonNom: d.salon_nom,
    appointmentId: d.appointment_id || undefined,
    clientId: d.client_id || undefined,
    nomClient: d.nom_client,
    telephoneClient: d.telephone_client || undefined,
    employeeId: d.employee_id || undefined,
    employeeName: d.employee_name || undefined,
    items,
    montantBrutFcfa: Number(d.montant_brut_fcfa) || 0,
    montantRemiseFcfa: Number(d.montant_remise_fcfa) || 0,
    montantTotalFcfa: Number(d.montant_total_fcfa) || 0,
    montantRecuFcfa: d.montant_recu_fcfa ? Number(d.montant_recu_fcfa) : undefined,
    montantRenduFcfa: d.montant_rendu_fcfa ? Number(d.montant_rendu_fcfa) : undefined,
    moyenPaiement: d.moyen_paiement as BeautyPaymentMethod,
    referencePaiement: d.reference_paiement || undefined,
    statut: d.statut,
    dateVente: d.date_vente,
    pointsFideliteGagnes: d.points_fidelite_gagnes || 0,
    pointsFideliteUtilises: d.points_fidelite_utilises || 0,
    recompenseId: d.recompense_id || undefined,
    notes: d.notes || undefined,
    caissierNom: d.caissier_nom || undefined,
    createdAt: d.created_at
  };
}

// Payment method labels and icons helper
export const createBeautyStockMovement = createStockMovement;

export async function adjustClientPoints(
  accountId: string,
  pointsDelta: number,
  motif: string,
  caissierNom?: string
): Promise<BeautyLoyaltyAccount> {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('beauty_loyalty_accounts').select('salon_id').eq('id', accountId).maybeSingle();
      if (data?.salon_id) {
        return adjustLoyaltyPoints(data.salon_id, accountId, pointsDelta, motif);
      }
    } catch (e) {
      console.warn('adjustClientPoints fetch salon_id err:', e);
    }
  }
  const localAcc = getLocalLoyaltyAccounts().find(a => a.id === accountId);
  const salonId = localAcc ? localAcc.salonId : 'salon-1';
  return adjustLoyaltyPoints(salonId, accountId, pointsDelta, motif);
}

export async function fetchCommercialStats(
  salonId: string,
  startDate?: string,
  endDate?: string
): Promise<BeautyCommercialStats> {
  const sales = await fetchBeautySales(salonId, { startDate, endDate });
  
  let totalCa = 0;
  let totalServices = 0;
  let totalProduits = 0;
  let totalRemises = 0;
  
  const repartitionPaiements: Record<BeautyPaymentMethod, number> = {
    especes: 0,
    orange_money: 0,
    moov_money: 0,
    wave: 0,
    virement: 0,
    autre: 0
  };

  const serviceMap = new Map<string, { id: string; nom: string; quantite: number; totalFcfa: number }>();
  const productMap = new Map<string, { id: string; nom: string; quantite: number; totalFcfa: number }>();
  const employeeMap = new Map<string, { employeeId: string; nom: string; nombrePrestations: number; totalCaFcfa: number }>();

  for (const sale of sales) {
    if (sale.statut === 'annule') continue;

    totalCa += sale.montantTotalFcfa;
    totalRemises += sale.montantRemiseFcfa || 0;
    
    if (repartitionPaiements[sale.moyenPaiement] !== undefined) {
      repartitionPaiements[sale.moyenPaiement] += sale.montantTotalFcfa;
    } else {
      repartitionPaiements.autre += sale.montantTotalFcfa;
    }

    if (sale.employeeId || sale.employeeName) {
      const empKey = sale.employeeId || sale.employeeName || 'Inconnu';
      const existing = employeeMap.get(empKey) || {
        employeeId: empKey,
        nom: sale.employeeName || 'Inconnu',
        nombrePrestations: 0,
        totalCaFcfa: 0
      };
      existing.nombrePrestations += sale.items.length;
      existing.totalCaFcfa += sale.montantTotalFcfa;
      employeeMap.set(empKey, existing);
    }

    for (const item of sale.items) {
      if (item.itemType === 'service') {
        totalServices += item.montantTotalFcfa;
        const existing = serviceMap.get(item.itemId) || {
          id: item.itemId,
          nom: item.nom,
          quantite: 0,
          totalFcfa: 0
        };
        existing.quantite += item.quantite;
        existing.totalFcfa += item.montantTotalFcfa;
        serviceMap.set(item.itemId, existing);
      } else {
        totalProduits += item.montantTotalFcfa;
        const existing = productMap.get(item.itemId) || {
          id: item.itemId,
          nom: item.nom,
          quantite: 0,
          totalFcfa: 0
        };
        existing.quantite += item.quantite;
        existing.totalFcfa += item.montantTotalFcfa;
        productMap.set(item.itemId, existing);
      }
    }
  }

  const topServices = Array.from(serviceMap.values()).sort((a, b) => b.totalFcfa - a.totalFcfa).slice(0, 5);
  const topProduits = Array.from(productMap.values()).sort((a, b) => b.totalFcfa - a.totalFcfa).slice(0, 5);
  const performancesEmployes = Array.from(employeeMap.values()).sort((a, b) => b.totalCaFcfa - a.totalCaFcfa);

  return {
    chiffreAffairesTotalFcfa: totalCa,
    chiffreAffairesServicesFcfa: totalServices,
    chiffreAffairesProduitsFcfa: totalProduits,
    nombreVentes: sales.filter(s => s.statut !== 'annule').length,
    panierMoyenFcfa: sales.length > 0 ? Math.round(totalCa / sales.length) : 0,
    totalRemisesFcfa: totalRemises,
    repartitionPaiements,
    topServices,
    topProduits,
    performancesEmployes
  };
}

export const BEAUTY_PAYMENT_LABELS: Record<BeautyPaymentMethod, { label: string; icon: string; color: string }> = {
  especes: { label: 'Espèces', icon: '💵', color: 'emerald' },
  orange_money: { label: 'Orange Money', icon: '🟧', color: 'orange' },
  moov_money: { label: 'Moov Money', icon: '🟦', color: 'blue' },
  wave: { label: 'Wave', icon: '🐧', color: 'cyan' },
  virement: { label: 'Virement bancaire', icon: '🏦', color: 'purple' },
  autre: { label: 'Autre moyen', icon: '💳', color: 'gray' }
};

export const BEAUTY_PRODUCT_CATEGORY_LABELS: Record<BeautyProductCategory, { label: string; icon: string }> = {
  shampooing: { label: 'Shampooing & Après-shampooing', icon: '🧴' },
  soins_capillaires: { label: 'Soins Capillaires', icon: '🌿' },
  coloration: { label: 'Coloration & Décoloration', icon: '🎨' },
  gel: { label: 'Gel & Cires coiffantes', icon: '✨' },
  huile: { label: 'Huiles & Sérums capillaires', icon: '💧' },
  meches: { label: 'Mèches & Tissages', icon: '💇‍♀️' },
  extensions: { label: 'Extensions & Clips', icon: '🎀' },
  perruques: { label: 'Perruques & Frontales', icon: '👑' },
  cosmetiques: { label: 'Produits Cosmétiques', icon: '💄' },
  soins_visage: { label: 'Soins Visage', icon: '💆‍♀️' },
  vernis: { label: 'Vernis & Onglerie', icon: '💅' },
  soins: { label: 'Soins & Masques', icon: '🌿' },
  materiel: { label: 'Matériel & Équipement', icon: '✂️' },
  accessoires: { label: 'Accessoires & Outils', icon: '🪮' },
  autre: { label: 'Autres produits', icon: '📦' }
};
