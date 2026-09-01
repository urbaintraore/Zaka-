import { supabase, isSupabaseConfigured } from './supabaseClient';
import { StockItem, SaleRecord, SaleItem } from '../types';

/**
 * Service Supabase dédié à la gestion des Stocks et des Ventes (Caisse POS)
 * Intègre les politiques de sécurité RLS (Gérants et Caissiers accrédités).
 */
export const stockSalesService = {
  /**
   * Récupère la liste complète des articles et boissons en stock pour un établissement donné
   */
  async fetchStocks(establishmentId: string): Promise<StockItem[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('establishmentId', establishmentId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur Supabase fetchStocks:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      establishmentId: row.establishmentId,
      name: row.name,
      price: Number(row.price),
      quantity: Number(row.quantity),
      stock_faible: row.stock_faible ?? (Number(row.quantity) <= 5),
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at
    }));
  },

  /**
   * Ajoute un nouvel article au catalogue des stocks
   */
  async addStockItem(item: Omit<StockItem, 'id' | 'createdAt'>): Promise<StockItem> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non configuré.');
    }

    const payload = {
      establishmentId: item.establishmentId,
      name: item.name.trim(),
      price: item.price,
      quantity: item.quantity,
      stock_faible: item.stock_faible ?? (item.quantity <= 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('stocks')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase addStockItem:', error);
      throw error;
    }

    return {
      id: data.id,
      establishmentId: data.establishmentId,
      name: data.name,
      price: Number(data.price),
      quantity: Number(data.quantity),
      stock_faible: data.stock_faible,
      createdAt: data.createdAt || data.created_at
    };
  },

  /**
   * Met à jour le prix ou la quantité d'un article en stock
   */
  async updateStockItem(id: string, updates: Partial<Omit<StockItem, 'id' | 'establishmentId'>>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const payload: any = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.quantity !== undefined && updates.stock_faible === undefined) {
      payload.stock_faible = updates.quantity <= 5;
    }

    const { error } = await supabase
      .from('stocks')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Erreur Supabase updateStockItem:', error);
      throw error;
    }
  },

  /**
   * Supprime un article du catalogue
   */
  async deleteStockItem(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('stocks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur Supabase deleteStockItem:', error);
      throw error;
    }
  },

  /**
   * Enregistre une vente (saisie caisse) et décrémente automatiquement le stock associé
   */
  async recordSale(sale: Omit<SaleRecord, 'id' | 'date'>): Promise<SaleRecord> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non configuré.');
    }

    const saleDate = new Date().toISOString();

    // 1. Décrémenter chaque article dans la table stocks
    for (const item of sale.items) {
      const { data: stockRow, error: fetchErr } = await supabase
        .from('stocks')
        .select('quantity, name')
        .eq('id', item.stockId)
        .single();

      if (fetchErr || !stockRow) {
        console.warn(`Article de stock non trouvé pour l'id: ${item.stockId}`);
        continue;
      }

      const newQty = Math.max(0, stockRow.quantity - item.quantity);

      const { error: updateErr } = await supabase
        .from('stocks')
        .update({
          quantity: newQty,
          stock_faible: newQty <= 5,
          updatedAt: saleDate
        })
        .eq('id', item.stockId);

      if (updateErr) {
        console.error(`Erreur mise à jour stock pour ${stockRow.name}:`, updateErr);
      }
    }

    // 2. Insérer le reçu de vente dans la table ventes
    const salePayload = {
      establishmentId: sale.establishmentId,
      cashierId: sale.cashierId,
      cashierName: sale.cashierName || 'Caissier',
      items: sale.items,
      totalAmount: sale.totalAmount,
      date: saleDate
    };

    const { data, error: insertSaleErr } = await supabase
      .from('ventes')
      .insert([salePayload])
      .select()
      .single();

    if (insertSaleErr) {
      console.error('Erreur Supabase insertion vente:', insertSaleErr);
      throw insertSaleErr;
    }

    return {
      id: data.id,
      establishmentId: data.establishmentId,
      cashierId: data.cashierId,
      cashierName: data.cashierName,
      items: data.items,
      totalAmount: Number(data.totalAmount),
      date: data.date
    };
  },

  /**
   * Récupère l'historique des ventes d'un établissement avec filtres optionnels
   */
  async fetchSales(
    establishmentId: string, 
    options?: { cashierId?: string; startDate?: string; endDate?: string; limit?: number }
  ): Promise<SaleRecord[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('ventes')
      .select('*')
      .eq('establishmentId', establishmentId)
      .order('date', { ascending: false });

    if (options?.cashierId && options.cashierId !== 'all') {
      query = query.eq('cashierId', options.cashierId);
    }
    if (options?.startDate) {
      query = query.gte('date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('date', options.endDate);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase fetchSales:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      establishmentId: row.establishmentId,
      cashierId: row.cashierId,
      cashierName: row.cashierName,
      items: row.items || [],
      totalAmount: Number(row.totalAmount),
      date: row.date
    }));
  },

  /**
   * Écoute en temps réel les changements de stocks pour actualiser l'interface POS instantanément
   */
  subscribeToStocks(establishmentId: string, onUpdate: () => void) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`stocks_channel_${establishmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stocks',
          filter: `establishmentId=eq.${establishmentId}`
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Écoute en temps réel les nouvelles ventes enregistrées
   */
  subscribeToSales(establishmentId: string, onNewSale: (sale: SaleRecord) => void) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`ventes_channel_${establishmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ventes',
          filter: `establishmentId=eq.${establishmentId}`
        },
        (payload: any) => {
          if (payload.new) {
            onNewSale({
              id: payload.new.id,
              establishmentId: payload.new.establishmentId,
              cashierId: payload.new.cashierId,
              cashierName: payload.new.cashierName,
              items: payload.new.items || [],
              totalAmount: Number(payload.new.totalAmount),
              date: payload.new.date
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
