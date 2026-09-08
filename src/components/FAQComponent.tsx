import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  categoryLabel: string;
  question: string;
  answer: React.ReactNode;
  profile: 'user' | 'manager';
}

interface FAQComponentProps {
  faqList: FAQItem[];
}

export function FAQComponent({ faqList }: FAQComponentProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const userFaq = faqList.filter(item => item.profile === 'user');
  const managerFaq = faqList.filter(item => item.profile === 'manager');

  const FAQSection = ({ title, items }: { title: string; items: FAQItem[] }) => (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-black text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-3">
        {items.map(item => {
          const isOpen = !!openItems[item.id];
          return (
            <div key={item.id} className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
              >
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.question}</h4>
                <div className="p-1 rounded-lg text-gray-400 bg-gray-100 dark:bg-gray-800 shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-900">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <FAQSection title="Pour les Clients / Utilisateurs" items={userFaq} />
      <FAQSection title="Pour les Gérants" items={managerFaq} />
    </div>
  );
}
