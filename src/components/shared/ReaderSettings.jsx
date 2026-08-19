'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Play, Pause, Square, Sun, Type, Sliders, ChevronDown, Sparkles, Maximize2, Minimize2 } from 'lucide-react';

const getCleanTextForSpeech = (markdown) => {
  if (!markdown) return '';
  let text = markdown.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/^(#{1,6})\s+(.*?)$/gm, '$2.');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
  text = text.replace(/\*([\s\S]*?)\*/g, '$1');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
};

const chunkText = (text, maxLength = 180) => {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (let sentence of sentences) {
    sentence = sentence.trim();
    if (!sentence) continue;

    if (sentence.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      const words = sentence.split(' ');
      for (const word of words) {
        if ((currentChunk + ' ' + word).length > maxLength) {
          chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          currentChunk = currentChunk ? currentChunk + ' ' + word : word;
        }
      }
    } else {
      if ((currentChunk + ' ' + sentence).length > maxLength) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
};

const getPreferredVoice = (voiceList) => {
  if (!voiceList || voiceList.length === 0) return null;
  const englishVoices = voiceList.filter((v) => v.lang.startsWith('en'));
  if (englishVoices.length === 0) return voiceList[0];

  const scored = englishVoices.map((voice) => {
    const name = voice.name.toLowerCase();
    let score = 0;
    if (name.includes('natural') || name.includes('neural')) score += 100;
    if (name.includes('google')) score += 80;
    if (name.includes('samantha') || name.includes('siri') || name.includes('daniel')) score += 60;
    if (voice.lang === 'en-US' || voice.lang === 'en-GB') score += 10;
    if (name.includes('david') || name.includes('zira desktop')) score -= 50;
    return { voice, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].voice;
};

export default function ReaderSettings({
  content = '',
  focusMode = false,
  onToggleFocusMode = null,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [warmth, setWarmth] = useState('Off');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFocusToggle = () => {
    if (onToggleFocusMode) {
      onToggleFocusMode();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('teachyblogs-focus-mode-toggle'));
    }
  };

  // Typography state — Defaults: Manrope Sans, A+ (prose-lg), Generous spacing (leading-loose)
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [fontSize, setFontSize] = useState('prose-lg');
  const [lineHeight, setLineHeight] = useState('leading-loose');

  const synthRef = useRef(null);
  const chunksRef = useRef([]);
  const isPlayingRef = useRef(false);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        const preferred = getPreferredVoice(availableVoices);
        if (preferred) setSelectedVoiceName(preferred.name);
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    if (typeof window !== 'undefined') {
      const savedWarmth = localStorage.getItem('teachyblogs-reader-warmth') || 'Off';
      const savedFamily = localStorage.getItem('teachyblogs-font-family') || 'font-sans';
      const savedSize = localStorage.getItem('teachyblogs-font-size') || 'prose-lg';
      const savedHeight = localStorage.getItem('teachyblogs-line-height') || 'leading-loose';
      setWarmth(savedWarmth);
      setFontFamily(savedFamily);
      setFontSize(savedSize);
      setLineHeight(savedHeight);
    }
  }, []);

  useEffect(() => {
    const rawText = getCleanTextForSpeech(content);
    chunksRef.current = chunkText(rawText);
  }, [content]);

  const forceCancelSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  const playChunk = useCallback(
    (index, chunks, currentSpeed, voiceName) => {
      if (!synthRef.current || index >= chunks.length || !isActiveRef.current) {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentChunkIndex(0);
        isPlayingRef.current = false;
        return;
      }

      forceCancelSpeech();
      const text = chunks[index];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = currentSpeed;
      utterance.pitch = 1.0;

      if (voiceName) {
        const matched = voices.find((v) => v.name === voiceName);
        if (matched) utterance.voice = matched;
      }

      utterance.onend = () => {
        if (!isActiveRef.current) return;
        const nextIndex = index + 1;
        setCurrentChunkIndex(nextIndex);
        if (nextIndex < chunks.length) {
          playChunk(nextIndex, chunks, currentSpeed, voiceName);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentChunkIndex(0);
          isPlayingRef.current = false;
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          setIsPlaying(false);
          setIsPaused(false);
          isPlayingRef.current = false;
        }
      };

      setCurrentChunkIndex(index);
      setIsPlaying(true);
      setIsPaused(false);
      isPlayingRef.current = true;
      synthRef.current.speak(utterance);
    },
    [voices, forceCancelSpeech]
  );

  const handlePlay = () => {
    if (!synthRef.current) return;
    isActiveRef.current = true;
    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      playChunk(currentChunkIndex, chunksRef.current, speed, selectedVoiceName);
    }
  };

  const handlePause = () => {
    if (!synthRef.current || !isPlaying) return;
    synthRef.current.pause();
    setIsPaused(true);
  };

  const handleStop = () => {
    isActiveRef.current = false;
    forceCancelSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
    isPlayingRef.current = false;
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (isPlaying && !isPaused) {
      forceCancelSpeech();
      setTimeout(() => {
        if (!isActiveRef.current) return;
        playChunk(currentChunkIndex, chunksRef.current, newSpeed, selectedVoiceName);
      }, 150);
    }
  };

  const handleVoiceChange = (voiceName) => {
    setSelectedVoiceName(voiceName);
    if (isPlaying && !isPaused) {
      forceCancelSpeech();
      setTimeout(() => {
        if (!isActiveRef.current) return;
        playChunk(currentChunkIndex, chunksRef.current, speed, voiceName);
      }, 150);
    }
  };

  const handleWarmthChange = (val) => {
    setWarmth(val);
    localStorage.setItem('teachyblogs-reader-warmth', val);
  };

  const broadcastTypography = (family, size, height) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('teachyblogs-typography-change', {
          detail: { fontFamily: family, fontSize: size, lineHeight: height },
        })
      );
    }
  };

  const handleFontFamilyChange = (val) => {
    setFontFamily(val);
    localStorage.setItem('teachyblogs-font-family', val);
    broadcastTypography(val, fontSize, lineHeight);
  };

  const handleFontSizeChange = (val) => {
    setFontSize(val);
    localStorage.setItem('teachyblogs-font-size', val);
    broadcastTypography(fontFamily, val, lineHeight);
  };

  const handleLineHeightChange = (val) => {
    setLineHeight(val);
    localStorage.setItem('teachyblogs-line-height', val);
    broadcastTypography(fontFamily, fontSize, val);
  };

  const overlayStyle = {
    Off: null,
    Low: { backgroundColor: 'rgba(245, 158, 11, 0.03)', backdropFilter: 'sepia(0.08)' },
    Medium: { backgroundColor: 'rgba(245, 158, 11, 0.055)', backdropFilter: 'sepia(0.14)' },
    High: { backgroundColor: 'rgba(245, 158, 11, 0.085)', backdropFilter: 'sepia(0.20)' },
  }[warmth];

  const speedOptions = [0.8, 1, 1.2, 1.5, 2];
  const warmthOptions = ['Off', 'Low', 'Medium', 'High'];
  const sizeOptions = [
    { label: 'A−', value: 'prose-sm' },
    { label: 'A', value: 'prose-base' },
    { label: 'A+', value: 'prose-lg' },
    { label: 'A++', value: 'prose-xl' },
  ];
  const heightOptions = [
    { label: 'Compact', value: 'leading-normal' },
    { label: 'Comfortable', value: 'leading-relaxed' },
    { label: 'Generous', value: 'leading-loose' },
  ];

  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));

  return (
    <>
      {/* Night Light Ambient Layer */}
      {warmth !== 'Off' && (
        <div
          className="fixed inset-0 pointer-events-none z-[99999] transition-all duration-300 mix-blend-multiply"
          style={overlayStyle}
        />
      )}

      {/* Refined Reading Toolbar */}
      <div className="rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 p-4 transition-all">
        {/* Main Horizontal Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Audio Player Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlay}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                isPlaying && !isPaused
                  ? 'bg-red-600 text-white shadow-red-600/20 scale-102'
                  : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 hover:border-red-500'
              }`}
              title="Listen to this article"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPlaying && !isPaused ? 'Playing' : isPaused ? 'Resume' : 'Listen'}</span>
            </button>

            {isPlaying && (
              <>
                <button
                  type="button"
                  onClick={handlePause}
                  className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title="Pause audio"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleStop}
                  className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title="Stop audio"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </>
            )}

            {/* Speed Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-xl">
              {speedOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSpeedChange(opt)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
                    speed === opt
                      ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  {opt}×
                </button>
              ))}
            </div>
          </div>

          {/* Focus Mode & Settings Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFocusToggle}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm border ${
                focusMode
                  ? 'bg-amber-600 dark:bg-amber-500 text-white border-amber-600 dark:border-amber-500 shadow-amber-600/20'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
              title={focusMode ? 'Exit Distraction-Free Focus Mode' : 'Enter Distraction-Free Focus Mode (Full Width Canvas)'}
            >
              {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                isExpanded
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-sm'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-zinc-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Reader Customization Panel */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-zinc-200/80 dark:border-white/10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* Voice Selection */}
            {englishVoices.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Audio Voice
                </label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {englishVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name.replace('Microsoft', 'MS').replace('English (United States)', 'US').replace('English (United Kingdom)', 'UK')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Typography Font Choice */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5">
                Reading Typeface
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFontFamilyChange('font-serif')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-serif font-bold border transition-all ${
                    fontFamily === 'font-serif'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10'
                  }`}
                >
                  Lora Serif
                </button>
                <button
                  type="button"
                  onClick={() => handleFontFamilyChange('font-sans')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-sans font-bold border transition-all ${
                    fontFamily === 'font-sans'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10'
                  }`}
                >
                  Manrope Sans
                </button>
              </div>
            </div>

            {/* Night Light Warmth */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5">
                Night Light Warmth
              </label>
              <div className="grid grid-cols-4 gap-1">
                {warmthOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleWarmthChange(opt)}
                    className={`py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                      warmth === opt
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Line Height */}
            <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Scale:</span>
                <div className="flex gap-1">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFontSizeChange(opt.value)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        fontSize === opt.value
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Spacing:</span>
                <div className="flex gap-1">
                  {heightOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleLineHeightChange(opt.value)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        lineHeight === opt.value
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFocusToggle}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    focusMode
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-amber-500'
                  }`}
                >
                  {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{focusMode ? 'Exit Zen Focus' : 'Zen Focus Mode'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
