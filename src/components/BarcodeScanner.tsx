import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export function BarcodeScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    // Slight delay to ensure the DOM element is mounted and styled
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner(
        "pos-qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText) => {
          scanner?.clear();
          onScan(decodedText);
        },
        (error) => {
          // ignore scan errors (they happen every frame when no code is found)
        }
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Scanner un code-barres</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <div id="pos-qr-reader" ref={scannerRef} className="w-full h-64 overflow-hidden rounded-xl"></div>
          <p className="text-xs text-center text-gray-500 mt-4">Placez le code-barres au centre du cadre</p>
        </div>
      </div>
    </div>
  );
}
