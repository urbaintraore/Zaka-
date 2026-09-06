import { useState, useRef, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseVoiceSearchProps {
  onTranscript: (text: string) => void;
  lang?: string;
}

export function useVoiceSearch({ onTranscript, lang = 'fr-FR' }: UseVoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
    triggerHaptic('light');
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: {
          message: "La recherche vocale n'est pas supportée par votre navigateur actuel.",
          type: 'warning'
        }
      }));
      return;
    }

    // Stop existing if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        triggerHaptic('medium');
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: {
            message: "🎙️ Écoute en cours... Dites par exemple « Maquis à Ouaga » ou « Restaurant »",
            type: 'info'
          }
        }));
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          setInterimText(currentText);
          onTranscript(currentText);
          triggerHaptic('light');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimText('');
        if (event.error !== 'aborted') {
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: {
              message: event.error === 'not-allowed'
                ? "Microphone non autorisé pour la recherche vocale."
                : "Recherche vocale interrompue.",
              type: 'warning'
            }
          }));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
        triggerHaptic('success');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  }, [lang, onTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    interimText,
    startListening,
    stopListening,
    toggleListening
  };
}
