import React, { useState } from 'react';
import { X, Clock, ShoppingBag, CreditCard, Banknote } from 'lucide-react';
import { Establishment, MenuDuJour } from '../types';
import { useAppStore } from '../store';

interface TakeawayOrderModalProps {
  establishment: Establishment;
  menuDuJour?: MenuDuJour;
  onClose: () => void;
}

export function TakeawayOrderModal({ establishment, menuDuJour, onClose }: TakeawayOrderModalProps) {
  const { addTakeawayOrder, currentUser, setGlobalError } = useAppStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pickupTime, setPickupTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'sur_place' | 'orange_money' | 'moov_money'>('sur_place');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableItems = menuDuJour?.items || [];
  const hasItems = availableItems.length > 0;

  const handleIncrement = (itemName: string) => {
    setQuantities(prev => ({ ...prev, [itemName]: (prev[itemName] || 0) + 1 }));
  };

  const handleDecrement = (itemName: string) => {
    setQuantities(prev => {
      const current = prev[itemName] || 0;
      if (current <= 1) {
        const newQ = { ...prev };
        delete newQ[itemName];
        return newQ;
      }
      return { ...prev, [itemName]: current - 1 };
    });
  };

  const totalAmount = Object.entries(quantities).reduce((acc, [name, q]) => {
    const item = availableItems.find(i => i.name === name);
    return acc + (item ? item.price * q : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (Object.keys(quantities).length === 0) {
      setGlobalError({ message: "Veuillez sélectionner au moins un plat.", type: 'warning' });
      return;
    }
    
    if (!pickupTime) {
      setGlobalError({ message: "Veuillez choisir un créneau de retrait.", type: 'warning' });
      return;
    }

    if (paymentMethod !== 'sur_place') {
      const confirmPayment = window.confirm(`Vous allez être redirigé vers l'interface de paiement ${paymentMethod === 'orange_money' ? 'Orange Money' : 'Moov Money'} pour payer ${totalAmount} FCFA. Confirmez-vous ?`);
      if (!confirmPayment) return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = Object.entries(quantities).map(([name, q]) => {
        const item = availableItems.find(i => i.name === name);
        return { name, quantity: q, price: item ? item.price : 0 };
      });

      await addTakeawayOrder({
        clientId: currentUser.id,
        clientName: currentUser.name,
        clientPhone: currentUser.phone,
        establishmentId: establishment.id,
        establishmentName: establishment.name,
        items: orderItems,
        totalAmount,
        pickupTime,
        paymentMethod
      });
      setGlobalError({ message: "Commande enregistrée avec succès !", type: 'info' });
      onClose();
    } catch (err) {
      setGlobalError({ message: "Erreur lors de la commande.", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Commande à emporter</h2>
              <p className="text-xs text-gray-500 font-medium">{establishment.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1">
          {!hasItems ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Le menu n'est pas encore disponible pour aujourd'hui.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Menu Items */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>1. Choisissez vos plats</span>
                </h3>
                <div className="space-y-2">
                  {availableItems.map((item, idx) => {
                    const q = quantities[item.name] || 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</p>
                          <p className="text-orange-600 dark:text-orange-400 font-bold text-xs">{item.price} FCFA</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                          <button type="button" onClick={() => handleDecrement(item.name)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold bg-gray-100 dark:bg-gray-800 rounded">-</button>
                          <span className="w-4 text-center text-sm font-bold">{q}</span>
                          <button type="button" onClick={() => handleIncrement(item.name)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold bg-gray-100 dark:bg-gray-800 rounded">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pickup Time */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>2. Créneau de retrait</span>
                </h3>
                <select 
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  required
                >
                  <option value="">Sélectionnez une heure...</option>
                  {['11:30', '12:00', '12:30', '13:00', '13:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  <span>3. Paiement</span>
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="sur_place" 
                      checked={paymentMethod === 'sur_place'}
                      onChange={() => setPaymentMethod('sur_place')}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-500" />
                        Paiement sur place
                      </span>
                      <span className="text-xs text-gray-500">Payer en espèces au retrait</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="orange_money" 
                      checked={paymentMethod === 'orange_money'}
                      onChange={() => setPaymentMethod('orange_money')}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#FF7900] rounded-full"></div>
                        Orange Money
                      </span>
                      <span className="text-xs text-gray-500">Paiement mobile sécurisé</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="moov_money" 
                      checked={paymentMethod === 'moov_money'}
                      onChange={() => setPaymentMethod('moov_money')}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#0055A5] rounded-full"></div>
                        Moov Money
                      </span>
                      <span className="text-xs text-gray-500">Paiement mobile sécurisé</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{totalAmount} FCFA</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || totalAmount === 0}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isSubmitting ? 'Traitement...' : 'Valider la commande'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
