import { useEffect, useRef, useState } from 'react';
import { Publication } from '../types';
import { X, Download, Share2 } from 'lucide-react';

interface ShareableVisualProps {
  publication: Publication;
  establishmentName: string;
  onClose: () => void;
}

export function ShareableVisual({ publication, establishmentName, onClose }: ShareableVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 540;
    const height = 960;
    canvas.width = width;
    canvas.height = height;

    const generateAndDraw = async () => {
      setIsGenerating(true);

      // 1. Draw rich gradient background (Vibrant Ouaga Night: deep orange/crimson to dark midnight blue)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#110500'); // extremely dark orange-black
      bgGrad.addColorStop(0.5, '#1e0a02'); // deep chocolate crimson
      bgGrad.addColorStop(1, '#020617'); // slate midnight black
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Decorative ambient circles
      ctx.fillStyle = 'rgba(234, 88, 12, 0.1)';
      ctx.beginPath();
      ctx.arc(width, 0, 200, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
      ctx.beginPath();
      ctx.arc(0, height * 0.6, 250, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Zaka+ Header
      ctx.fillStyle = '#ea580c'; // Zaka orange
      ctx.font = 'black 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ZAKA+', width / 2, 70);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('LA VIE NOCTURNE DU FASO', width / 2, 95);

      // Divider lines
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 80, 115);
      ctx.lineTo(width / 2 + 80, 115);
      ctx.stroke();

      // 3. Draw visual frame for event image or vector fallback
      const frameY = 140;
      const frameW = width - 80; // 460
      const frameH = 300;
      const frameX = 40;

      // Frame Background (temporary placeholder background)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(frameX, frameY, frameW, frameH);
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.2)';
      ctx.strokeRect(frameX, frameY, frameW, frameH);

      // Function to draw fallback vector
      const drawFallbackVector = () => {
        ctx.strokeStyle = 'rgba(234, 88, 12, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Headphones
        ctx.arc(width / 2, frameY + 140, 60, Math.PI, 0, false);
        ctx.stroke();

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(width / 2 - 60, frameY + 140, 15, 0, Math.PI * 2);
        ctx.arc(width / 2 + 60, frameY + 140, 15, 0, Math.PI * 2);
        ctx.fill();

        // Soundwave lines
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
        for (let i = 0; i < 7; i++) {
          const waveH = 20 + Math.sin(i * 1.5) * 30;
          ctx.beginPath();
          ctx.moveTo(width / 2 - 120 + i * 40, frameY + 140 - waveH / 2);
          ctx.lineTo(width / 2 - 120 + i * 40, frameY + 140 + waveH / 2);
          ctx.stroke();
        }
      };

      // Try loading the publication image
      if (publication.imageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              // Draw cover image inside frame
              const imageRatio = img.width / img.height;
              const frameRatio = frameW / frameH;
              let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
              if (imageRatio > frameRatio) {
                sWidth = img.height * frameRatio;
                sx = (img.width - sWidth) / 2;
              } else {
                sHeight = img.width / frameRatio;
                sy = (img.height - sHeight) / 2;
              }
              ctx.drawImage(img, sx, sy, sWidth, sHeight, frameX, frameY, frameW, frameH);
              resolve();
            };
            img.onerror = () => {
              reject(new Error('Failed to load image'));
            };
            img.src = publication.imageUrl!;
          });
        } catch (err) {
          console.warn('Image load failed, drawing fallback vector', err);
          drawFallbackVector();
        }
      } else {
        drawFallbackVector();
      }

      // 4. Establishment badge
      ctx.fillStyle = 'rgba(234, 88, 12, 0.15)';
      ctx.font = 'bold 12px sans-serif';
      const cleanEstName = establishmentName.trim().toUpperCase();
      const badgeW = Math.min(width - 120, ctx.measureText(cleanEstName).width + 40);
      const badgeH = 32;
      const badgeX = (width - badgeW) / 2;
      const badgeY = frameY + frameH + 30;

      ctx.beginPath();
      ctx.roundRect?.(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#f97316';
      ctx.textAlign = 'center';
      ctx.fillText(cleanEstName, width / 2, badgeY + 20);

      // 5. Event/Promo Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      
      const words = publication.title.toUpperCase().split(' ');
      let line = '';
      let lineCount = 0;
      const titleY = badgeY + badgeH + 50;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 100 && n > 0) {
          ctx.fillText(line, width / 2, titleY + lineCount * 36);
          line = words[n] + ' ';
          lineCount++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, titleY + lineCount * 36);

      // 6. Date badge/Time (if applicable)
      let dateText = '';
      if (publication.startDate) {
        const d = new Date(publication.startDate);
        dateText = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
      } else {
        dateText = 'OFFRE DU MOMENT';
      }

      const dateY = titleY + (lineCount + 1) * 36 + 25;
      ctx.fillStyle = '#38bdf8'; // sky blue
      ctx.font = '900 14px sans-serif';
      ctx.fillText(dateText, width / 2, dateY);

      // 7. Fictive QR Code and website link
      const qrSize = 100;
      const qrX = width / 2 - qrSize / 2;
      const qrY = height - 190;

      // Draw Fictive QR code (concentric tech squares)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX + 6, qrY + 6, qrSize - 12, qrSize - 12);

      // Draw typical QR corner anchors
      ctx.fillStyle = '#000000';
      ctx.fillRect(qrX + 12, qrY + 12, 25, 25);
      ctx.fillRect(qrX + qrSize - 37, qrY + 12, 25, 25);
      ctx.fillRect(qrX + 12, qrY + qrSize - 37, 25, 25);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX + 17, qrY + 17, 15, 15);
      ctx.fillRect(qrX + qrSize - 32, qrY + 17, 15, 15);
      ctx.fillRect(qrX + 17, qrY + qrSize - 32, 15, 15);

      ctx.fillStyle = '#000000';
      ctx.fillRect(qrX + 22, qrY + 22, 5, 5);
      ctx.fillRect(qrX + qrSize - 27, qrY + 22, 5, 5);
      ctx.fillRect(qrX + 22, qrY + qrSize - 27, 5, 5);

      // Draw simulated QR data dots
      ctx.fillStyle = '#000000';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; r + c > 2 && r + c < 14 && c < 8; c++) {
          if ((r + c) % 3 === 0 || (r * c) % 2 === 1) {
            if (r < 3 && c < 3) continue;
            if (r < 3 && c > 4) continue;
            if (r > 4 && c < 3) continue;
            ctx.fillRect(qrX + 15 + c * 10, qrY + 15 + r * 10, 6, 6);
          }
        }
      }

      // Footer text
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('SCANNEZ POUR REJOINDRE SUR ZAKA+', width / 2, height - 70);

      ctx.fillStyle = '#ea580c';
      ctx.font = 'black 11px sans-serif';
      ctx.fillText('WWW.ZAKAPLUS.BF', width / 2, height - 45);

      // Generate visual URL
      try {
        const dataUrl = canvas.toDataURL('image/png');
        setImageSrc(dataUrl);
      } catch (e) {
        console.error('Failed to export canvas to data url', e);
      }
      setIsGenerating(false);
    };

    generateAndDraw();
  }, [publication, establishmentName]);

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.download = `zaka_${publication.type}_${publication.id.substring(0, 4)}.png`;
    link.href = imageSrc;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!imageSrc) return;
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'zaka_story.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Zaka+ - ${publication.title}`,
          text: `Retrouve cet événement de ${establishmentName} sur Zaka+ !`
        });
      } else {
        // Fallback: clipboard or download
        handleDownload();
        alert("Web Share non supporté sur ce navigateur. L'image a été téléchargée sur votre appareil !");
      }
    } catch (e) {
      console.error('Error sharing image', e);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col p-6 items-center border border-gray-100 dark:border-gray-800">
        
        <div className="w-full flex items-center justify-between mb-4">
          <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Aperçu Story 9:16</h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-900 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative w-64 aspect-[9/16] bg-gray-950 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
          <canvas ref={canvasRef} className="hidden" />
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-2">
              <span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Génération...</span>
            </div>
          ) : (
            imageSrc && <img src={imageSrc} alt="Generated visual story" className="w-full h-full object-contain" />
          )}
        </div>

        <div className="w-full grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>

          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-2 shadow-sm shadow-orange-600/20"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </button>
        </div>
      </div>
    </div>
  );
}
