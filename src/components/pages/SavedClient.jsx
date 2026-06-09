'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bookmark, Trash2, ArrowUpRight, Clock, Loader2, Play, Pause, Square, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';
import { postAPI } from '@/services/api';
import { getReadingTime } from '@/utils/readingTime';
import useToastStore from '@/store/useToastStore';

// TTS Helper Functions
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

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const getPreferredVoice = (voiceList) => {
  if (!voiceList || voiceList.length === 0) return null;
  const englishVoices = voiceList.filter(v => v.lang.startsWith('en'));
  if (englishVoices.length === 0) return voiceList[0];

  const scored = englishVoices.map(voice => {
    const name = voice.name.toLowerCase();
    let score = 0;
    if (name.includes('natural') || name.includes('neural')) score += 100;
    if (name.includes('google')) score += 80;
    if (name.includes('samantha') || name.includes('siri') || name.includes('daniel') || name.includes('karen')) score += 60;
    if (voice.lang === 'en-US' || voice.lang === 'en-GB' || voice.lang === 'en-UK') score += 10;
    if (name.includes('david') || name.includes('zira desktop') || name.includes('david desktop')) score -= 50;
    if (name.includes('zira') || name.includes('female') || name.includes('samantha') || name.includes('hazel')) score += 30;
    if (name.includes('male') || name.includes('guy') || name.includes('george')) score -= 10;
    return { voice, score };
  });

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

export default function SavedClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkSlugs, setBookmarkSlugs] = useState([]);
  const [readingProgresses, setReadingProgresses] = useState({});
  const [fontFamily, setFontFamily] = useState('font-sans');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFamily = localStorage.getItem('teachyblogs-font-family') || 'font-sans';
      setFontFamily(savedFamily);
    }
  }, []);

  const handleFontFamilyChange = (val) => {
    setFontFamily(val);
    localStorage.setItem('teachyblogs-font-family', val);
  };

  // Audiobook Playlist States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState(-1);
  const [chunks, setChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [speed, setSpeed] = useState(1);

  const utteranceRef = useRef(null);
  const isActiveRef = useRef(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    loadBookmarkedPosts();
  }, []);

  // Sync available voices on load
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoicesList = () => {
      const vList = window.speechSynthesis.getVoices();
      setVoices(vList);
      if (vList.length > 0) {
        const savedVoice = localStorage.getItem('teachyblogs-reader-voice');
        const isValid = vList.some(v => v.name === savedVoice);
        if (savedVoice && isValid) {
          setSelectedVoiceName(savedVoice);
        } else {
          const pref = getPreferredVoice(vList);
          if (pref) setSelectedVoiceName(pref.name);
        }
      }
    };
    loadVoicesList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoicesList;
    }
    return () => {
      isActiveRef.current = false;
      forceCancelSpeech();
    };
  }, []);

  const loadBookmarkedPosts = async () => {
    if (typeof window === 'undefined') return;

    const slugs = JSON.parse(localStorage.getItem('techy-blogs-bookmarks') || '[]');
    setBookmarkSlugs(slugs);

    // Load progress percentages
    const progresses = {};
    slugs.forEach(s => {
      progresses[s] = parseInt(localStorage.getItem(`techy-reading-progress-${s}`) || '0');
    });
    setReadingProgresses(progresses);

    if (slugs.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await postAPI.getAllPosts({ limit: 100 });
      const allPosts = response.posts || [];
      const saved = allPosts.filter(p => slugs.includes(p.slug));
      setPosts(saved);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = (slug) => {
    const updated = bookmarkSlugs.filter(s => s !== slug);
    setBookmarkSlugs(updated);
    setPosts(posts.filter(p => p.slug !== slug));
    localStorage.setItem('techy-blogs-bookmarks', JSON.stringify(updated));
    localStorage.removeItem(`techy-reading-progress-${slug}`);

    // If currently playing, stop it
    if (activePostIndex !== -1 && posts[activePostIndex]?.slug === slug) {
      handleStopPlaylist();
    }
  };

  const clearAll = () => {
    bookmarkSlugs.forEach(s => localStorage.removeItem(`techy-reading-progress-${s}`));
    setBookmarkSlugs([]);
    setPosts([]);
    localStorage.setItem('techy-blogs-bookmarks', JSON.stringify([]));
    handleStopPlaylist();
  };

  // Audiobook Playlist player actions
  const playPlaylistChunk = useCallback((postIndex, chunkIndex, currentChunks = chunks, currentSpeed = speed, currentVoiceName = selectedVoiceName) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !isActiveRef.current) return;

    if (chunkIndex >= currentChunks.length) {
      // Finished current article, proceed to the next one
      const nextIndex = postIndex + 1;
      if (nextIndex < posts.length) {
        addToast(`Finished reading, starting: ${posts[nextIndex].title}`, 'info');
        playNextPost(nextIndex, currentSpeed, currentVoiceName);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setActivePostIndex(-1);
        setCurrentChunkIndex(0);
        addToast('Audiobook queue completed!', 'success');
      }
      return;
    }

    setCurrentChunkIndex(chunkIndex);

    const chunk = currentChunks[chunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utteranceRef.current = utterance;

    // Prevent GC in Chrome
    if (typeof window !== 'undefined') {
      window._activeUtterances = window._activeUtterances || [];
      window._activeUtterances.push(utterance);
      if (window._activeUtterances.length > 50) {
        window._activeUtterances.shift();
      }
    }

    const freshVoices = window.speechSynthesis.getVoices();
    let selectedVoice = freshVoices.find(v => v.name === currentVoiceName);
    if (!selectedVoice) {
      selectedVoice = getPreferredVoice(freshVoices);
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = currentSpeed;
    utterance.volume = 1;
    utterance.pitch = 1;

    utterance.onend = () => {
      if (!isActiveRef.current) return;
      setTimeout(() => {
        if (!isActiveRef.current) return;
        playPlaylistChunk(postIndex, chunkIndex + 1, currentChunks, currentSpeed, currentVoiceName);
      }, 250);
    };

    utterance.onerror = (e) => {
      if (!isActiveRef.current) return;
      console.error('Speech error:', e);
      if (e.error === 'interrupted') return;
      playPlaylistChunk(postIndex, chunkIndex + 1, currentChunks, currentSpeed, currentVoiceName);
    };

    window.speechSynthesis.speak(utterance);
  }, [chunks, speed, selectedVoiceName, posts, addToast]);

  const playNextPost = (index, currentSpeed = speed, currentVoiceName = selectedVoiceName) => {
    if (index >= posts.length || index < 0) return;
    
    setActivePostIndex(index);
    const post = posts[index];
    const text = getCleanTextForSpeech(post.content);
    const postChunks = chunkText(text);

    if (postChunks.length === 0) {
      // If empty content, skip to next
      playNextPost(index + 1, currentSpeed, currentVoiceName);
      return;
    }

    setChunks(postChunks);
    setCurrentChunkIndex(0);

    setTimeout(() => {
      if (!isActiveRef.current) return;
      playPlaylistChunk(index, 0, postChunks, currentSpeed, currentVoiceName);
    }, 150);
  };

  const handleStartPlaylist = () => {
    if (posts.length === 0) return;
    isActiveRef.current = true;
    
    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      forceCancelSpeech();
      
      // Determine index to play (start with first or previously selected)
      const indexToStart = activePostIndex >= 0 && activePostIndex < posts.length ? activePostIndex : 0;
      playNextPost(indexToStart, speed, selectedVoiceName);
    }
  };

  const handlePausePlaylist = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !isPlaying) return;
    if (!isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStopPlaylist = () => {
    isActiveRef.current = false;
    forceCancelSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setActivePostIndex(-1);
    setCurrentChunkIndex(0);
    setChunks([]);
  };

  const handleSkipForward = () => {
    if (activePostIndex + 1 < posts.length) {
      forceCancelSpeech();
      playNextPost(activePostIndex + 1, speed, selectedVoiceName);
    }
  };

  const handleSkipBackward = () => {
    if (activePostIndex - 1 >= 0) {
      forceCancelSpeech();
      playNextPost(activePostIndex - 1, speed, selectedVoiceName);
    }
  };

  return (
    <div className={`pt-36 pb-36 px-6 md:px-12 max-w-7xl mx-auto relative ${fontFamily}`}>
      <TopLoader />

      {/* Ambient blobs */}
      <div className="absolute top-[10%] left-[-150px] w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
      <div className="absolute top-[50%] right-[-200px] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 blur-[130px] rounded-full pointer-events-none -z-10 animate-blob-drift-reverse" />

      <div className="container mx-auto">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
          >
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-amber-500 font-black tracking-widest uppercase text-xs font-display px-4 py-2 rounded-full bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15">
                <Bookmark className="w-3.5 h-3.5" />
                Reading List
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
                Saved Articles
              </h1>
              <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed font-sans">
                Your personally bookmarked articles for later reading.
              </p>
            </div>
            
            <div className="flex gap-2 shrink-0 items-center">
              {posts.length > 0 && (
                <select
                  value={fontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border text-[11px] font-bold outline-none bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white cursor-pointer"
                >
                  <option value="font-sans">Sans-Serif</option>
                  <option value="font-serif">Serif Mode</option>
                  <option value="font-dyslexic">Dyslexic Friendly</option>
                </select>
              )}
              {posts.length > 0 && (
                <button
                  onClick={handleStartPlaylist}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/15 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Queue
                </button>
              )}
              {posts.length > 0 && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>
          </motion.div>
        </header>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-zinc-400 font-bold text-sm">Loading saved articles...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-24 text-center">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 font-bold text-lg mb-2">No saved articles yet</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium mb-6">
              Click the bookmark icon on any article to save it for later.
            </p>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/15 transition-all hover:-translate-y-0.5"
            >
              Browse Articles
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {posts.map((post, idx) => {
              const progress = readingProgresses[post.slug] || 0;
              const isCurrentPlaying = activePostIndex === idx;

              return (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.2) }}
                  className={`group relative rounded-2xl overflow-hidden premium-card transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                    isCurrentPlaying 
                      ? 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/5' 
                      : 'hover:shadow-blue-500/[0.06]'
                  }`}
                >
                  {/* Remove bookmark button */}
                  <button
                    onClick={(e) => { e.preventDefault(); removeBookmark(post.slug); }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-amber-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Active queue playlist card mask */}
                      {isCurrentPlaying && (
                        <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="px-4 py-2 rounded-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                            <span className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 bg-white rounded-full animate-wave-1 h-3" />
                              <span className="w-0.5 bg-white rounded-full animate-wave-2 h-3" />
                              <span className="w-0.5 bg-white rounded-full animate-wave-3 h-3" />
                            </span>
                            Now Listening
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex gap-1">
                          {(post.categories || []).slice(0, 2).map(cat => (
                            <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10 dark:border-indigo-500/15">
                              {cat}
                            </span>
                          ))}
                        </div>
                        {progress > 0 && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            progress >= 95 
                              ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' 
                              : 'text-blue-500 bg-blue-500/5 border-blue-500/10'
                          }`}>
                            {progress >= 95 ? 'Completed' : `${progress}% read`}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-display leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {post.excerpt}
                      </p>

                      {/* Visual Reading Progress Bar */}
                      {progress > 0 && (
                        <div className="mt-4 w-full h-1 bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress >= 95 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadingTime(post.content)} min
                        </span>
                        
                        {/* Queue click action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            isActiveRef.current = true;
                            setIsPlaying(true);
                            setIsPaused(false);
                            forceCancelSpeech();
                            playNextPost(idx, speed, selectedVoiceName);
                          }}
                          className="text-[9px] font-extrabold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-wider"
                        >
                          Play This
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audiobook Sticky Footer Player Panel */}
      <AnimatePresence>
        {activePostIndex !== -1 && posts[activePostIndex] && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200 dark:border-zinc-800/80 backdrop-blur-xl shadow-2xl px-6 py-4"
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Playing Info */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/10">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </div>
                <div className="truncate max-w-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Audiobook Queue Player</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{posts[activePostIndex].title}</p>
                </div>
              </div>

              {/* Central Playlist Player Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkipBackward}
                  disabled={activePostIndex === 0}
                  className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-350 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous Post"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                {isPlaying && !isPaused ? (
                  <button
                    onClick={handlePausePlaylist}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 transition-colors"
                    title="Pause Playback"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleStartPlaylist}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 transition-colors"
                    title="Resume Playback"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                )}

                <button
                  onClick={handleSkipForward}
                  disabled={activePostIndex === posts.length - 1}
                  className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-350 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next Post"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={handleStopPlaylist}
                  className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-350 transition-colors"
                  title="Stop Playback"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Progress/Timeline info */}
              <div className="flex items-center gap-4 w-full md:w-auto text-[10px] font-bold text-zinc-400 uppercase tracking-widest justify-end">
                <span>Article progress: {chunks.length > 0 ? Math.round((currentChunkIndex / chunks.length) * 100) : 0}%</span>
                <div className="h-1.5 w-24 bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${chunks.length > 0 ? (currentChunkIndex / chunks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
