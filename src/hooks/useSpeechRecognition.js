import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechRecognition — Web Speech API hook for voice input.
 *
 * Uses the browser's built-in SpeechRecognition API (Chrome/Edge).
 * Supports continuous recognition and multiple languages.
 *
 * Returns: { transcript, isListening, start, stop, reset, isSupported, error }
 */
export default function useSpeechRecognition({ lang = 'en-IN', continuous = true } = {}) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize recognition instance
  useEffect(() => {
    if (!isSupported) return;

    // Stop any existing instance before creating a new one (e.g. on lang change)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* already stopped */ }
      recognitionRef.current = null;
      setIsListening(false);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      // 'no-speech' is not a real error — just means silence
      if (event.error === 'no-speech') return;
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, lang, continuous]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      // Already started — ignore
      if (err.name !== 'InvalidStateError') {
        setError(err.message);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    start,
    stop,
    reset,
    isSupported,
    error,
  };
}
