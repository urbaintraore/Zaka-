import React from 'react';
import { FileText, Barcode, FileBarChart } from 'lucide-react';

export const GerantFAB: React.FC<{ onAction: (action: string) => void }> = ({ onAction }) => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      <button onClick={() => onAction('expense')} className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700">
        <FileText className="w-6 h-6" />
      </button>
      <button onClick={() => onAction('scan')} className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700">
        <Barcode className="w-6 h-6" />
      </button>
      <button onClick={() => onAction('report')} className="p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700">
        <FileBarChart className="w-6 h-6" />
      </button>
    </div>
  );
};
