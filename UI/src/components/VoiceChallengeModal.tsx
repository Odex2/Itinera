import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Mic, MicOff, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';

interface VoiceChallengeModalProps {
  /** Audio URL or base64 data URI for the spoken AI question */
  audioSrc: string;
  /** The challenge question text (shown as subtitle) */
  question: string;
  /** Correct answer + keywords for backend validation */
  correctAnswer: string;
  acceptableKeywords: string[];
  /** XP for this challenge */
  xpBonus: number;
  onResult: (correct: boolean, xpAwarded: number, transcript: string) => void;
  onClose: () => void;
}

type Phase = 'listening' | 'recording' | 'processing' | 'result';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function VoiceChallengeModal({
  audioSrc,
  question,
  correctAnswer,
  acceptableKeywords,
  xpBonus,
  onResult,
  onClose,
}: VoiceChallengeModalProps) {
  const [phase, setPhase] = useState<Phase>('listening');
  const [transcript, setTranscript] = useState('');
  const [correct, setCorrect] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Auto-play the AI question ───────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {
      // Autoplay blocked — user will click play manually
    });
  }, []);

  // ── Start recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Safari/iOS supports only audio/mp4, Chrome/Firefox prefer webm
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm')             ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/mp4')              ? 'audio/mp4' :
        '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        submitAnswer(blob, mimeType);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setPhase('recording');
    } catch (err) {
      console.error('[VoiceChallenge] Mic access denied:', err);
      setError('Permesso microfono negato. Abilita il microfono e riprova.');
    }
  }, []);

  // ── Stop recording ──────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setPhase('processing');
    }
  }, []);

  // ── Submit to backend ───────────────────────────────────────────────────
  const submitAnswer = useCallback(
    async (blob: Blob, mimeType: string) => {
      try {
        // Convert blob to base64
        const buffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
        );

        const res = await fetch(`${API_BASE}/api/ai/answer-challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeQuestion: question,
            correctAnswer,
            acceptableKeywords,
            audio: base64,
            audioFilename: mimeType.includes('mp4') ? 'recording.mp4' : 'recording.webm',
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setTranscript(data.transcript || '');
        setCorrect(data.correct);
        setXpAwarded(data.xpAwarded || 0);
        setExplanation(data.explanation || '');
        setPhase('result');
        onResult(data.correct, data.xpAwarded || 0, data.transcript || '');
      } catch (err) {
        console.error('[VoiceChallenge] Submit failed:', err);
        setError('Errore durante la valutazione. Riprova.');
        setPhase('listening');
      }
    },
    [question, correctAnswer, acceptableKeywords, onResult],
  );

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Sfida vocale"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-3 mb-3 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">Sfida Vocale</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-6 space-y-5">
          {/* Audio player for AI question */}
          <div>
            <p className="text-stone-500 text-xs font-medium uppercase tracking-wider mb-2">
              Ascolta la domanda
            </p>
            <audio ref={audioRef} src={audioSrc} controls className="w-full h-10" />
            <p className="text-stone-700 text-sm mt-2 italic">{question}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Push to Talk */}
          {(phase === 'listening' || phase === 'recording') && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-stone-500 text-sm">
                {phase === 'listening'
                  ? 'Tieni premuto per rispondere'
                  : 'Sto registrando... rilascia per inviare'}
              </p>
              <button
                onPointerDown={startRecording}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  phase === 'recording'
                    ? 'bg-red-500 animate-pulse shadow-red-300'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                }`}
                aria-label={phase === 'recording' ? 'Rilascia per inviare' : 'Tieni premuto per parlare'}
              >
                {phase === 'recording' ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
            </div>
          )}

          {/* Processing */}
          {phase === 'processing' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              <p className="text-stone-500 text-sm">Sto valutando la tua risposta...</p>
            </div>
          )}

          {/* Result */}
          {phase === 'result' && (
            <div className="space-y-4">
              {/* Transcript */}
              {transcript && (
                <div className="bg-stone-50 rounded-xl px-4 py-3">
                  <p className="text-stone-400 text-xs font-medium uppercase mb-1">Hai detto:</p>
                  <p className="text-stone-700 text-sm">"{transcript}"</p>
                </div>
              )}

              {/* Correct/Incorrect */}
              <div
                className={`rounded-xl px-4 py-4 flex items-start gap-3 ${
                  correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {correct ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-bold ${correct ? 'text-green-700' : 'text-red-700'}`}>
                    {correct ? 'Risposta corretta!' : 'Non proprio...'}
                  </p>
                  {explanation && <p className="text-stone-600 text-sm mt-1">{explanation}</p>}
                  <p className="text-amber-600 font-semibold text-sm mt-2">+{xpAwarded} XP</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors"
              >
                Continua
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}