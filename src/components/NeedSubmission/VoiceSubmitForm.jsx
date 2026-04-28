import { useState, useEffect } from 'react';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import { classifyVoiceReport } from '../../services/gemini';
import { addNeed } from '../../services/firestore';
import { useOrg } from '../../context/OrgContext';
import { getFewShotExamples, formatFewShotBlock } from '../../services/corrections';
import LoadingSpinner from '../common/LoadingSpinner';

const LANGUAGES = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'Hindi',   flag: '🇮🇳' },
  { code: 'kn-IN', label: 'Kannada', flag: '🇮🇳' },
  { code: 'te-IN', label: 'Telugu',  flag: '🇮🇳' },
  { code: 'mr-IN', label: 'Marathi', flag: '🇮🇳' },
];

export default function VoiceSubmitForm() {
  const [lang, setLang] = useState('en-IN');
  const { transcript, isListening, start, stop, reset, isSupported, error: speechError } =
    useSpeechRecognition({ lang });

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { currentOrg } = useOrg();

  // Waveform animation
  const [bars, setBars] = useState(Array(24).fill(4));

  useEffect(() => {
    if (isListening) {
      const intervalId = setInterval(() => {
        setBars((prev) =>
          prev.map(() => Math.max(4, Math.random() * 32))
        );
      }, 80);
      return () => clearInterval(intervalId);
    } else {
      setBars(Array(24).fill(4));
    }
  }, [isListening]);

  const handleProcess = async () => {
    if (!transcript.trim()) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const examples = await getFewShotExamples(currentOrg?.id);
      const fewShotBlock = formatFewShotBlock(examples);
      const classified = await classifyVoiceReport({ transcript, fewShotBlock });
      setResult(classified);
    } catch (err) {
      console.error('Voice classification error:', err);
      setError(err.message || 'Failed to process voice report');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);

    try {
      await addNeed({
        source: 'voice',
        rawImageUrl: null,
        location: result.location || 'Not specified',
        description: result.description,
        affectedGroup: result.affectedGroup || '',
        reporterName: result.reporterName || null,
        urgency: result.urgency,
        needType: result.needType,
        aiReason: result.reason,
        aiConfidence: result.confidence,
        aiUnreadParts: null,
        voiceLanguage: result.language,
        voiceTranscript: result.originalTranscript || transcript,
        volunteersNeeded: result.volunteersNeeded || 1,
      }, currentOrg?.id);
      setSaved(true);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save need');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setError(null);
    setSaved(false);
    setProcessing(false);
  };

  const urgencyColor = {
    HIGH: '#fb7185',
    MEDIUM: '#fbbf24',
    LOW: '#34d399',
  };

  // Browser doesn't support speech recognition
  if (!isSupported) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-3xl mb-3">🎙️</div>
        <p className="text-sm text-text-primary font-semibold mb-1">Voice Input Not Available</p>
        <p className="text-xs text-text-secondary">
          Your browser doesn't support the Web Speech API. Try Chrome or Edge on desktop/Android.
        </p>
      </div>
    );
  }

  // Saved successfully
  if (saved) {
    return (
      <div className="glass-card-elevated p-6 text-center animate-slide-up">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-sm font-semibold text-text-primary mb-1">Voice Report Submitted</p>
        <p className="text-xs text-text-secondary mb-4">
          AI classified from {result?.language || 'voice'} speech input. Need added to the board.
        </p>
        <button className="btn-primary px-6 py-2.5" onClick={handleReset}>
          Submit Another
        </button>
      </div>
    );
  }

  // Show result for review
  if (result) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎙️</span>
          <h3 className="text-sm font-bold text-text-primary">Voice Report — AI Extraction</h3>
        </div>

        {/* Language detected */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Detected language:</span>
          <span className="font-semibold text-accent">{result.language}</span>
        </div>

        {/* Original transcript */}
        <div className="glass-card p-4">
          <span className="detail-label">📝 Original Transcript</span>
          <p className="text-xs text-text-secondary mt-1 italic leading-relaxed">
            "{result.originalTranscript || transcript}"
          </p>
        </div>

        {/* Extracted fields */}
        <div className="glass-card p-4">
          <div className="detail-row">
            <span className="detail-label">📍 Location</span>
            <span className="detail-value">{result.location || 'Not specified'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">📝 Description (English)</span>
            <span className="detail-value">{result.description}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">👥 Affected Group</span>
            <span className="detail-value">{result.affectedGroup || '—'}</span>
          </div>
        </div>

        {/* AI Classification */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{
                background: `${urgencyColor[result.urgency]}15`,
                color: urgencyColor[result.urgency],
                border: `1px solid ${urgencyColor[result.urgency]}30`,
              }}
            >
              {result.urgency}
            </span>
            <span className="badge badge-type">{result.needType}</span>
            <span className="text-[10px] text-text-muted">
              {result.volunteersNeeded} volunteer{result.volunteersNeeded > 1 ? 's' : ''} needed
            </span>
          </div>
          <p className="text-xs text-text-secondary italic">🧠 {result.reason}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-sm text-urgent-high">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="btn-primary flex-1 py-3"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '✅ Confirm & Submit'}
          </button>
          <button className="btn-secondary py-3" onClick={handleReset}>
            ✕ Discard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-text-primary mb-1">🎙️ Voice Report</h2>
        <p className="text-xs text-text-secondary">
          Speak a crisis report in any language. AI will extract, translate, and classify.
        </p>
      </div>

      {/* Language selector */}
      <div>
        <label className="form-label">Input Language</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                if (!isListening) setLang(l.code);
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                lang === l.code
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:bg-white/[0.06]'
              }`}
              disabled={isListening}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform + Mic Button */}
      <div className="flex flex-col items-center py-6">
        {/* Waveform bars */}
        <div className="flex items-end gap-[3px] h-10 mb-5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-100"
              style={{
                width: 3,
                height: h,
                background: isListening
                  ? `rgba(251, 113, 133, ${0.4 + (h / 32) * 0.6})`
                  : 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>

        {/* Mic button */}
        <button
          onClick={isListening ? stop : start}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${
            isListening
              ? 'bg-urgent-high/20 border-2 border-urgent-high shadow-lg shadow-urgent-high/20 animate-pulse'
              : 'bg-white/[0.04] border-2 border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>
        <p className="text-xs text-text-muted mt-3">
          {isListening ? 'Listening... Tap to stop' : 'Tap to start speaking'}
        </p>
      </div>

      {/* Live transcript */}
      {transcript && (
        <div className="glass-card p-4">
          <span className="detail-label mb-1 block">Live Transcript</span>
          <p className="text-sm text-text-primary leading-relaxed">
            {transcript}
          </p>
        </div>
      )}

      {/* Speech error */}
      {speechError && (
        <div className="p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high">
          Speech error: {speechError}. Try using Chrome on desktop or Android.
        </div>
      )}

      {/* Processing */}
      {processing && (
        <LoadingSpinner text="AI is analyzing your voice report..." />
      )}

      {error && (
        <div className="p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-sm text-urgent-high">
          {error}
        </div>
      )}

      {/* Process button — only when we have transcript and not listening */}
      {transcript && !isListening && !processing && (
        <button className="btn-primary w-full py-3 text-base" onClick={handleProcess}>
          🧠 Process with AI
        </button>
      )}
    </div>
  );
}
