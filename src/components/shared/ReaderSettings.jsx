'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Play, Pause, Square, Sun, Type } from 'lucide-react';

const getCleanTextForSpeech = (markdown) => {
  if (!markdown) return '';
  
  // 1. Strip code blocks completely
  let text = markdown.replace(/```[\s\S]*?```/g, '');
  
  // 2. Strip inline code tags
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // 3. Strip images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  
  // 4. Strip links (keep link text, strip URL)
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  
  // 5. Convert headers to text ending with a period to inject a natural voice pause
  text = text.replace(/^(#{1,6})\s+(.*?)$/gm, '$2.');
  
  // 6. Strip list bullets and numbering
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  
  // 7. Strip bold and italic markup
  text = text.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
  text = text.replace(/\*([\s\S]*?)\*/g, '$1');
  
  // 8. Condense whitespaces
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

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const getPreferredVoice = (voiceList) => {
  if (!voiceList || voiceList.length === 0) return null;
  
  const englishVoices = voiceList.filter(v => v.lang.startsWith('en'));
  if (englishVoices.length === 0) return voiceList[0];

  // Priority score calculation for each English voice
  const scored = englishVoices.map(voice => {
    const name = voice.name.toLowerCase();
    let score = 0;

    // Prioritize natural/neural voices
    if (name.includes('natural') || name.includes('neural')) {
      score += 100;
    }
    
    // Prioritize Google voices (highly natural cloud-based voices)
    if (name.includes('google')) {
      score += 80;
    }

    // Prioritize premium Apple voices
    if (name.includes('samantha') || name.includes('siri') || name.includes('daniel') || name.includes('karen')) {
      score += 60;
    }

    // Prioritize US or UK english as they are usually the best synthesized
    if (voice.lang === 'en-US' || voice.lang === 'en-GB' || voice.lang === 'en-UK') {
      score += 10;
    }

    // Penalize known robotic male/default SAPI5 voices
    if (name.includes('david') || name.includes('zira desktop') || name.includes('david desktop')) {
      score -= 50;
    }
    
    // Prioritize female over male if robotic
    if (name.includes('zira') || name.includes('female') || name.includes('samantha') || name.includes('hazel')) {
      score += 30;
    }
    if (name.includes('male') || name.includes('guy') || name.includes('george')) {
      score -= 10;
    }

    return { voice, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored[0].voice;
};

const forceCancelSpeech = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
    window._activeUtterances = [];
  } catch (err) {
    console.error('Error canceling speech:', err);
  }
};

export default function ReaderSettings({ content }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.8, 1, 1.2, 1.5, 2
  const [warmth, setWarmth] = useState('Off'); // Off, Low, Medium, High
  
  // Typography states
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [fontSize, setFontSize] = useState('prose-lg');
  const [lineHeight, setLineHeight] = useState('leading-relaxed');

  const [chunks, setChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  
  const utteranceRef = useRef(null);
  const isActiveRef = useRef(true);

  // Dispatch custom typography change event helper
  const dispatchTypeChange = useCallback((family, size, height) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('teachyblogs-typography-change', {
          detail: { fontFamily: family, fontSize: size, lineHeight: height }
        })
      );
    }
  }, []);

  // Load settings and voice preference on mount
  useEffect(() => {
    isActiveRef.current = true;
    
    const savedWarmth = localStorage.getItem('teachyblogs-reader-warmth');
    if (savedWarmth) setWarmth(savedWarmth);

    const savedVoice = localStorage.getItem('teachyblogs-reader-voice');
    if (savedVoice) setSelectedVoiceName(savedVoice);

    const savedFamily = localStorage.getItem('teachyblogs-font-family') || 'font-sans';
    setFontFamily(savedFamily);

    const savedSize = localStorage.getItem('teachyblogs-font-size') || 'prose-lg';
    setFontSize(savedSize);

    const savedHeight = localStorage.getItem('teachyblogs-line-height') || 'leading-relaxed';
    setLineHeight(savedHeight);

    // Initial sync delay to let parent mount first
    setTimeout(() => {
      dispatchTypeChange(savedFamily, savedSize, savedHeight);
    }, 50);

    return () => {
      isActiveRef.current = false;
      forceCancelSpeech();
    };
  }, [dispatchTypeChange]);

  // Sync state whenever typography variables change
  useEffect(() => {
    dispatchTypeChange(fontFamily, fontSize, lineHeight);
  }, [fontFamily, fontSize, lineHeight, dispatchTypeChange]);

  // Fetch available voices asynchronously
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const vList = window.speechSynthesis.getVoices();
      setVoices(vList);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Set default premium voice once loaded
  useEffect(() => {
    if (voices.length === 0) return;

    // Check if the current selectedVoiceName is valid (exists in the voices list)
    const isValid = voices.some(v => v.name === selectedVoiceName);

    if (!selectedVoiceName || !isValid) {
      const preferred = getPreferredVoice(voices);
      if (preferred) {
        setSelectedVoiceName(preferred.name);
      }
    }
  }, [voices, selectedVoiceName]);

  const handleWarmthChange = (level) => {
    setWarmth(level);
    localStorage.setItem('teachyblogs-reader-warmth', level);
  };

  const handleFontFamilyChange = (val) => {
    setFontFamily(val);
    localStorage.setItem('teachyblogs-font-family', val);
  };

  const handleFontSizeChange = (val) => {
    setFontSize(val);
    localStorage.setItem('teachyblogs-font-size', val);
  };

  const handleLineHeightChange = (val) => {
    setLineHeight(val);
    localStorage.setItem('teachyblogs-line-height', val);
  };

  // Reset and stop reading cleanly when content changes
  useEffect(() => {
    isActiveRef.current = false;
    forceCancelSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
    setChunks([]);
  }, [content]);

  // Sequential play helper
  const playChunk = useCallback((index, currentChunks = chunks, currentSpeed = speed, currentVoiceName = selectedVoiceName) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !isActiveRef.current) return;

    if (index >= currentChunks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      return;
    }

    setCurrentChunkIndex(index);

    const chunk = currentChunks[index];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utteranceRef.current = utterance;

    // Prevent garbage collection in Chrome
    if (typeof window !== 'undefined') {
      window._activeUtterances = window._activeUtterances || [];
      window._activeUtterances.push(utterance);
      if (window._activeUtterances.length > 50) {
        window._activeUtterances.shift();
      }
    }

    // Get fresh voice references directly from speechSynthesis to avoid stale references
    const freshVoices = window.speechSynthesis.getVoices();
    let selectedVoice = freshVoices.find(v => v.name === currentVoiceName);
    
    // Fallback if voice not found (e.g. dynamic load latency)
    if (!selectedVoice) {
      selectedVoice = getPreferredVoice(freshVoices);
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = currentSpeed;
    utterance.volume = 1; // Explicitly set full volume
    utterance.pitch = 1;  // Explicitly set normal pitch

    utterance.onend = () => {
      if (!isActiveRef.current) return;
      setTimeout(() => {
        if (!isActiveRef.current) return;
        playChunk(index + 1, currentChunks, currentSpeed, currentVoiceName);
      }, 250);
    };

    utterance.onerror = (e) => {
      if (!isActiveRef.current) return;
      console.error('Speech synthesis error, trying next sentence:', e);
      if (e.error === 'interrupted') return;
      playChunk(index + 1, currentChunks, currentSpeed, currentVoiceName);
    };

    window.speechSynthesis.speak(utterance);
  }, [chunks, speed, selectedVoiceName]);

  const handlePlay = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    isActiveRef.current = true;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    } else {
      const currentVoices = window.speechSynthesis.getVoices();
      if (currentVoices.length === 0) {
        setTimeout(handlePlay, 100);
        return;
      }

      // Ensure we have a valid selected voice
      let voiceToUse = selectedVoiceName;
      const isValid = currentVoices.some(v => v.name === voiceToUse);
      if (!voiceToUse || !isValid) {
        const preferred = getPreferredVoice(currentVoices);
        if (preferred) {
          voiceToUse = preferred.name;
          setSelectedVoiceName(preferred.name);
          localStorage.setItem('teachyblogs-reader-voice', preferred.name);
        }
      }

      forceCancelSpeech();

      const cleanText = getCleanTextForSpeech(content);
      if (!cleanText) return;

      const sentenceChunks = chunkText(cleanText);
      if (sentenceChunks.length === 0) return;

      setChunks(sentenceChunks);
      setIsPlaying(true);
      setIsPaused(false);
      
      // Delay playing slightly to ensure cancel command finishes clearing the audio channel
      setTimeout(() => {
        if (!isActiveRef.current) return;
        playChunk(0, sentenceChunks, speed, voiceToUse);
      }, 150);
    }
  };

  const handlePause = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !isPlaying) return;
    
    if (!isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    isActiveRef.current = false;
    forceCancelSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (isPlaying && !isPaused) {
      forceCancelSpeech();
      setTimeout(() => {
        if (!isActiveRef.current) return;
        playChunk(currentChunkIndex, chunks, newSpeed, selectedVoiceName);
      }, 150);
    }
  };

  const handleVoiceChange = (voiceName) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem('teachyblogs-reader-voice', voiceName);
    if (isPlaying && !isPaused) {
      forceCancelSpeech();
      setTimeout(() => {
        if (!isActiveRef.current) return;
        playChunk(currentChunkIndex, chunks, speed, voiceName);
      }, 150);
    }
  };

  const overlayStyle = {
    Off: null,
    Low: { backgroundColor: 'rgba(245, 158, 11, 0.03)', backdropFilter: 'sepia(0.08)' },
    Medium: { backgroundColor: 'rgba(245, 158, 11, 0.055)', backdropFilter: 'sepia(0.14)' },
    High: { backgroundColor: 'rgba(245, 158, 11, 0.085)', backdropFilter: 'sepia(0.20)' }
  }[warmth];

  const speedOptions = [0.8, 1, 1.2, 1.5, 2];
  const warmthOptions = ['Off', 'Low', 'Medium', 'High'];
  const sizeOptions = [
    { label: 'A-', value: 'prose-sm' },
    { label: 'A', value: 'prose-base' },
    { label: 'A+', value: 'prose-lg' },
    { label: 'A++', value: 'prose-xl' }
  ];
  const heightOptions = [
    { label: 'Normal', value: 'leading-normal' },
    { label: 'Relaxed', value: 'leading-relaxed' },
    { label: 'Loose', value: 'leading-loose' }
  ];
  
  // Filter only English voices for the selection dropdown
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));

  return (
    <>
      {/* Full screen Ambient Night Light filter */}
      {warmth !== 'Off' && (
        <div 
          className="fixed inset-0 pointer-events-none z-[99999] transition-all duration-300 mix-blend-multiply"
          style={overlayStyle}
        />
      )}

      {/* Settings Panel UI */}
      <div className="p-5 rounded-2xl glass-card transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 relative overflow-hidden">
        {/* Gradient accent header line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
            Reader Settings
          </h3>
        </div>

        <div className="space-y-4">
          {/* TTS Audio Controls */}
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-300 mb-2 ml-1">
              Audio Reader
            </span>
            <div className="flex items-center gap-2">
              {/* Play / Resume */}
              <button
                type="button"
                onClick={handlePlay}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isPlaying && !isPaused
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                    : 'border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
                }`}
                title="Play Reading"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>

              {/* Pause */}
              <button
                type="button"
                onClick={handlePause}
                disabled={!isPlaying}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  isPaused
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105'
                    : 'border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
                }`}
                title="Pause Reading"
              >
                <Pause className="w-4 h-4" />
              </button>

              {/* Stop */}
              <button
                type="button"
                onClick={handleStop}
                disabled={!isPlaying}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Stop Reading"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              {/* Pulsating Voice Waveform Indicator */}
              {isPlaying && !isPaused && (
                <div className="flex items-end gap-0.5 h-5 px-3 ml-2 pb-0.5">
                  <div className="w-0.5 bg-indigo-500 rounded-full animate-wave-1" />
                  <div className="w-0.5 bg-indigo-500 rounded-full animate-wave-2" />
                  <div className="w-0.5 bg-indigo-500 rounded-full animate-wave-3" />
                </div>
              )}
            </div>
          </div>

          {/* Voice Selector */}
          {englishVoices.length > 0 && (
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-350 mb-2 ml-1">
                Select Voice
              </span>
              <select
                value={selectedVoiceName}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border text-[11px] font-bold outline-none transition-all focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white border-zinc-200 text-zinc-800 dark:bg-[#1e293b] dark:border-white/[0.08] dark:text-white cursor-pointer"
              >
                {englishVoices.map((voice) => (
                  <option key={voice.name} value={voice.name} className="bg-white dark:bg-[#1e293b] text-zinc-800 dark:text-white">
                    {voice.name.replace('Microsoft', 'MS').replace('English (United States)', 'US').replace('English (United Kingdom)', 'UK')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reading Speed controls */}
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-300 mb-2 ml-1">
              Reading Speed
            </span>
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-zinc-100/60 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.04]">
              {speedOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSpeedChange(opt)}
                  className={`py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                    speed === opt
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-250'
                  }`}
                >
                  {opt}x
                </button>
              ))}
            </div>
          </div>

          {/* Screen Night Light controls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-300 ml-1">
                Night Light
              </span>
              {warmth !== 'Off' && (
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-zinc-100/60 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.04]">
              {warmthOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleWarmthChange(opt)}
                  className={`py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                    warmth === opt
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/10'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-250'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Typography Customizer Section */}
          <div className="border-t border-zinc-100 dark:border-white/[0.04] pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-3.5 h-3.5 text-indigo-500" />
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-300 ml-0.5">
                Typography
              </span>
            </div>

            <div className="space-y-3">
              {/* Font Family Select */}
              <div>
                <span className="block text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 ml-1">
                  Font Family
                </span>
                <select
                  value={fontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[10px] font-bold outline-none transition-all bg-white border-zinc-200 text-zinc-800 dark:bg-[#1e293b] dark:border-white/[0.08] dark:text-white cursor-pointer"
                >
                  <option value="font-sans">Sans-Serif (Standard)</option>
                  <option value="font-serif">Serif (Reading)</option>
                  <option value="font-dyslexic">Dyslexic Friendly</option>
                </select>
              </div>

              {/* Font Size Pills */}
              <div>
                <span className="block text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 ml-1">
                  Font Size
                </span>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-zinc-100/60 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.04]">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFontSizeChange(opt.value)}
                      className={`py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                        fontSize === opt.value
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                          : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height Spacing Pills */}
              <div>
                <span className="block text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 ml-1">
                  Line Spacing
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100/60 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.04]">
                  {heightOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleLineHeightChange(opt.value)}
                      className={`py-1 text-[9px] font-extrabold rounded-lg transition-all ${
                        lineHeight === opt.value
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/10'
                          : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
