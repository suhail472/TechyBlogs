'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Save,
  Upload,
  Plus,
  X,
  Loader2,
  Send,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Eye,
  FileText,
  HelpCircle,
  Columns,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  Sigma,
  GitBranch,
  Info,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Minus,
  CheckCircle2,
  MapPin,
  Tag,
  Globe,
  Bookmark,
  History,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Check,
  AlertTriangle,
  Flame,
  Activity,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { postAPI, taxonomyAPI, authorAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import ArticleLivePreview from './ArticleLivePreview';
import { extractHeadings } from '@/utils/markdownEngine';
import { getReadingTime } from '@/utils/readingTime';

const CONTENT_TYPES = [
  { id: 'article', label: 'Standard Article', desc: 'In-depth longform technical or general writing' },
  { id: 'news', label: 'News / Reporting', desc: 'Timely reporting, breaking stories, and location updates' },
  { id: 'tutorial', label: 'Technical Tutorial', desc: 'Hands-on implementation with code and difficulty levels' },
  { id: 'guide', label: 'Comprehensive Guide', desc: 'Educational how-tos and step-by-step handbooks' },
  { id: 'review', label: 'Product / Tech Review', desc: 'Hardware, software, and gear reviews with scorecards' },
  { id: 'opinion', label: 'Opinion & Editorial', desc: 'Columnist viewpoints, essays, and perspectives' },
  { id: 'analysis', label: 'Deep Analysis', desc: 'Data-driven insights, policy, and industry analysis' },
  { id: 'feature', label: 'Feature Story', desc: 'Spotlights, interviews, and investigative reports' },
  { id: 'explainer', label: 'Explainer', desc: 'Clear breakdowns of complex phenomena' },
  { id: 'report', label: 'Research Report', desc: 'Data studies and whitepapers' },
  { id: 'announcement', label: 'Announcement', desc: 'Official bulletins and platform updates' },
];

export default function BlogEditor({ id }) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Workspace View Modes: 'write' (wide canvas), 'split' (resizable dual-pane), 'preview' (full public simulation)
  const [viewMode, setViewMode] = useState('write');
  const [inspectorOpen, setInspectorOpen] = useState(false); // Closed by default
  const [focusMode, setFocusMode] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage for editor in split mode (30-70)
  const isDraggingSplitRef = useRef(false);

  // Accordion open states inside inspector
  const [openSections, setOpenSections] = useState({
    health: true,
    publication: true,
    classification: true,
    priority: false,
    review_tutorial: false,
    seo: false,
    media: false,
    sources: false,
    corrections: false,
    faqs: false,
    revisions: false,
  });

  // Multi-Dimensional Taxonomy & Relations
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [revisionsList, setRevisionsList] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Autosave & Validation State
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localBackupAvailable, setLocalBackupAvailable] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const textareaRef = useRef(null);

  // Form Data State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    content: '',
    categories: ['Technology'],
    primarySection: 'Technology',
    secondarySections: [],
    primaryTopic: null,
    secondaryTopics: [],
    primaryRegion: null,
    districts: [],
    contentType: 'article',
    author: 'Editorial Bureau',
    authorRole: 'Staff Correspondent',
    status: 'draft',
    visibility: 'public',
    image: '',
    imageAlt: '',
    imageCaption: '',
    imageCredit: '',
    publishedAt: null,
    scheduledAt: null,
    breaking: false,
    developing: false,
    editorNote: '',
    sources: [],
    faqs: [],
    editorial: {
      breaking: false,
      developing: false,
      locationName: '',
      correction: { hasCorrection: false, note: '', correctedAt: null },
    },
    contentMetadata: {
      tutorialMetadata: { difficulty: 'intermediate', estimatedTime: '', prerequisites: [] },
      reviewMetadata: { rating: 4.5, pros: [], cons: [], verdict: '' },
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: '',
    },
  });

  // Load existing article if editing
  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await postAPI.getPost(id);
        if (res.post) {
          const p = res.post;
          setFormData({
            title: p.title || '',
            subtitle: p.subtitle || '',
            slug: p.slug || '',
            content: p.content || '',
            categories: p.categories || ['Technology'],
            primarySection: p.primarySection?.name || p.primarySection || 'Technology',
            secondarySections: p.secondarySections || [],
            primaryTopic: p.primaryTopic?._id || p.primaryTopic || null,
            secondaryTopics: p.secondaryTopics || [],
            primaryRegion: p.primaryRegion?._id || p.primaryRegion || null,
            districts: p.districts || [],
            contentType: p.contentType || 'article',
            author: p.author || 'Editorial Bureau',
            authorRole: p.primaryAuthor?.role || 'Staff Correspondent',
            status: p.status || 'draft',
            visibility: p.visibility || 'public',
            image: p.image || '',
            imageAlt: p.imageAlt || '',
            imageCaption: p.imageCaption || '',
            imageCredit: p.imageCredit || '',
            publishedAt: p.publishedAt || null,
            scheduledAt: p.scheduledAt || null,
            breaking: !!(p.editorial?.breaking || p.breaking),
            developing: !!(p.editorial?.developing || p.developing),
            editorNote: p.editorNote || '',
            sources: p.sources || [],
            faqs: p.faqs || [],
            editorial: p.editorial || {
              breaking: false,
              developing: false,
              locationName: '',
              correction: { hasCorrection: false, note: '', correctedAt: null },
            },
            contentMetadata: p.contentMetadata || {
              tutorialMetadata: { difficulty: 'intermediate', estimatedTime: '', prerequisites: [] },
              reviewMetadata: { rating: 4.5, pros: [], cons: [], verdict: '' },
            },
            seo: p.seo || {
              metaTitle: p.title || '',
              metaDescription: p.excerpt || '',
              canonicalUrl: '',
            },
          });
          setIsSlugManual(true);
        }
      } catch (err) {
        addToast('Failed to load article: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  // Load taxonomy and authors
  useEffect(() => {
    const fetchTaxonomyAndAuthors = async () => {
      try {
        const [taxRes, authRes] = await Promise.allSettled([
          taxonomyAPI.getAll(),
          authorAPI.getAll(),
        ]);

        if (taxRes.status === 'fulfilled' && taxRes.value?.data) {
          const allTax = taxRes.value.data;
          setAvailableTopics(allTax.filter((t) => t.kind === 'topic' || t.kind === 'section'));
          setAvailableRegions(allTax.filter((t) => t.kind === 'region' || t.kind === 'edition'));
        }

        if (authRes.status === 'fulfilled' && authRes.value?.data) {
          setAvailableAuthors(authRes.value.data);
        }
      } catch (err) {
        // Silently fail
      }
    };
    fetchTaxonomyAndAuthors();
  }, []);

  // Fetch revisions if editing
  const fetchRevisions = useCallback(async () => {
    if (!id) return;
    setLoadingRevisions(true);
    try {
      const res = await postAPI.getRevisions(id);
      if (res.success) {
        setRevisionsList(res.revisions || []);
      }
    } catch (err) {
      // Silently fail
    } finally {
      setLoadingRevisions(false);
    }
  }, [id]);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S / Cmd+S: Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave('draft');
      }
      // Ctrl+\ / Cmd+\: Toggle Inspector
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setInspectorOpen((prev) => !prev);
      }
      // Ctrl+Shift+P / Cmd+Shift+P: Toggle Preview
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setViewMode((prev) => (prev === 'preview' ? 'write' : 'preview'));
      }
      // Escape: close modals / inspector
      if (e.key === 'Escape') {
        if (inspectorOpen) setInspectorOpen(false);
        if (publishModalOpen) setPublishModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, inspectorOpen, publishModalOpen]);

  // Auto-generate slug from title if not manual
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const updates = { title };
    if (!isSlugManual) {
      updates.slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      if (!formData.seo.metaTitle) {
        updates.seo = { ...formData.seo, metaTitle: title };
      }
    }
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Draggable Split Divider Handlers
  const handleMouseDownSplit = () => {
    isDraggingSplitRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e) => {
      if (!isDraggingSplitRef.current) return;
      const containerWidth = window.innerWidth;
      const newRatio = (e.clientX / containerWidth) * 100;
      if (newRatio >= 25 && newRatio <= 75) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      isDraggingSplitRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Word & Character count calculations
  const { wordCount, charCount, readingTime } = useMemo(() => {
    const raw = formData.content || '';
    const cleanText = raw.replace(/[#*`~\[\]()>-]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanText ? cleanText.split(' ').filter(Boolean).length : 0;
    const chars = raw.length;
    const readMin = getReadingTime(raw);
    return { wordCount: words, charCount: chars, readingTime: readMin };
  }, [formData.content]);

  // Article Health / Publish Readiness Check
  const healthCheck = useMemo(() => {
    const items = [
      { id: 'title', label: 'Story Headline', valid: !!formData.title?.trim() },
      { id: 'content', label: 'Article Markdown Body', valid: !!formData.content?.trim() },
      { id: 'author', label: 'Journalist Author Byline', valid: !!formData.author?.trim() },
      { id: 'section', label: 'Primary Desk / Section', valid: !!formData.primarySection },
      { id: 'type', label: 'Content Classification', valid: !!formData.contentType },
      { id: 'cover', label: 'Cover Image Media', valid: !!formData.image },
      { id: 'seo_title', label: 'SEO Meta Title', valid: !!formData.seo?.metaTitle },
      { id: 'seo_desc', label: 'SEO Meta Description', valid: !!formData.seo?.metaDescription },
    ];
    const passed = items.filter((i) => i.valid).length;
    const total = items.length;
    const isReady = passed >= 6 && items[0].valid && items[1].valid; // headline & content mandatory
    return { items, passed, total, isReady };
  }, [formData]);

  // Insert markdown helper at cursor
  const insertTextAtCursor = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = formData.content.substring(start, end);
    const replacement = before + selected + after;
    const newContent = formData.content.substring(0, start) + replacement + formData.content.substring(end);

    setFormData((prev) => ({ ...prev, content: newContent }));
    setHasUnsavedChanges(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  // Save handler
  const handleSave = async (targetStatus = 'draft') => {
    if (!formData.title?.trim()) {
      addToast('Story headline is required', 'error');
      return;
    }
    if (!formData.content?.trim()) {
      addToast('Article content body is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
        publishedAt: targetStatus === 'published' && !formData.publishedAt ? new Date() : formData.publishedAt,
      };

      let res;
      if (id) {
        res = await postAPI.updatePost(id, payload);
        addToast(`Story updated as ${targetStatus}`, 'success');
      } else {
        res = await postAPI.createPost(payload);
        addToast(`Story created as ${targetStatus}`, 'success');
        if (res.post?._id) {
          router.push(`/admin/edit/${res.post._id}`);
        }
      }

      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());
      setPublishModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Saving failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cover Image Upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error');
      return;
    }
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
        setHasUnsavedChanges(true);
        addToast('Cover image uploaded successfully', 'success');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      addToast('Image upload failed: ' + err.message, 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const toggleAccordion = (sectionKey) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0c0e12]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <span className="text-zinc-400 font-bold text-xs font-mono uppercase tracking-wider">
            Loading Article Studio Workstation...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#FAFAFA] dark:bg-[#0c0e12] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans ${focusMode ? 'fixed inset-0 z-50 overflow-hidden' : ''}`}>
      {/* 1. TOP WORKSPACE BAR */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#12151c]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Back & Title breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {!focusMode && (
            <Link
              href="/admin"
              className="p-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition-colors shrink-0"
              title="Back to Stories (Esc)"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}

          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {formData.title || 'Untitled Story'}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
              <span className="uppercase text-red-600 dark:text-red-400 font-bold">{formData.status}</span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{readingTime}m read</span>
              {hasUnsavedChanges ? (
                <span className="text-amber-500 font-bold">• Unsaved changes</span>
              ) : lastSavedTime ? (
                <span className="text-emerald-500 font-bold">• Auto-saved</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'write'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'split'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Right: Actions & Inspector Trigger */}
        <div className="flex items-center gap-2">
          {/* Inspector Toggle */}
          <button
            type="button"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              inspectorOpen
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                : 'border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
            title="Toggle Editorial Inspector (Ctrl+\)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspector</span>
            {!healthCheck.isReady && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          {/* Focus Mode Trigger */}
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            className={`p-1.5 rounded-xl border transition-colors ${
              focusMode
                ? 'bg-red-600 text-white border-red-600'
                : 'border-zinc-200/80 dark:border-white/10 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
            title="Focus Distraction-Free Mode"
          >
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={submitting}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Publish Trigger */}
          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            disabled={submitting}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm shadow-red-600/20 transition-all flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CANVAS */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* VIEW MODE 1: WRITE (Wide distraction-free document canvas) */}
        {viewMode === 'write' && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-6">
              {/* Document Header (Headline & Dek) */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Story Headline..."
                  className="w-full text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-zinc-950 dark:text-white"
                />
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, subtitle: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Add editorial subtitle or narrative dek..."
                  className="w-full text-lg md:text-xl font-medium font-sans bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-zinc-600 dark:text-zinc-300"
                />
              </div>

              {/* Restrained Markdown Toolbar */}
              <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#12151c]/90 backdrop-blur-md py-2 border-y border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center gap-1">
                <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-200 dark:border-white/10">
                  <button type="button" onClick={() => insertTextAtCursor('# ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('## ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('### ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></button>
                </div>

                <div className="flex items-center gap-0.5 px-2 border-r border-zinc-200 dark:border-white/10">
                  <button type="button" onClick={() => insertTextAtCursor('**', '**')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Bold (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('*', '*')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Italic (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('`', '`')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Inline Code"><Code className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('> ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Blockquote"><Quote className="w-3.5 h-3.5" /></button>
                </div>

                <div className="flex items-center gap-0.5 px-2 border-r border-zinc-200 dark:border-white/10">
                  <button type="button" onClick={() => insertTextAtCursor('- ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('1. ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('- [ ] ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Task List"><CheckSquare className="w-3.5 h-3.5" /></button>
                </div>

                <div className="flex items-center gap-1 pl-2 text-xs text-zinc-500 font-bold">
                  <button type="button" onClick={() => insertTextAtCursor('\n| Column 1 | Column 2 |\n|---|---|\n| Item 1 | Item 2 |\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
                    <TableIcon className="w-3 h-3" /> Table
                  </button>
                  <button type="button" onClick={() => insertTextAtCursor('$$\n', '\n$$')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
                    <Sigma className="w-3 h-3" /> Math
                  </button>
                  <button type="button" onClick={() => insertTextAtCursor('```mermaid\ngraph TD\n  A[Start] --> B[Finish]\n```\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> Diagram
                  </button>
                  <button type="button" onClick={() => insertTextAtCursor(':::note\n', '\n:::')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Callout
                  </button>
                </div>
              </div>

              {/* Full-width Markdown Body Textarea */}
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, content: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="Start typing your story in Markdown..."
                className="w-full min-h-[600px] font-mono text-sm leading-relaxed bg-transparent border-none outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                spellCheck="false"
              />
            </div>
          </div>
        )}

        {/* VIEW MODE 2: SPLIT (Resizable Dual-Pane) */}
        {viewMode === 'split' && (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* Left Source Pane */}
            <div
              style={{ width: `${splitRatio}%` }}
              className="flex flex-col border-r border-zinc-200/80 dark:border-white/10 h-full overflow-hidden bg-white dark:bg-[#0c0e12]"
            >
              <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 space-y-2">
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Headline..."
                  className="w-full text-xl font-bold font-display bg-transparent border-none outline-none text-zinc-950 dark:text-white"
                />
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, subtitle: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Subtitle dek..."
                  className="w-full text-xs font-medium text-zinc-500 bg-transparent border-none outline-none"
                />
              </div>
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, content: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="Write Markdown..."
                className="flex-1 p-4 font-mono text-xs leading-relaxed bg-transparent border-none outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                spellCheck="false"
              />
            </div>

            {/* Draggable Divider Handle */}
            <div
              onMouseDown={handleMouseDownSplit}
              className="w-1.5 hover:w-2 bg-zinc-200/80 hover:bg-red-500 dark:bg-white/10 dark:hover:bg-red-500 cursor-col-resize transition-all flex items-center justify-center"
              title="Drag to resize split panes"
            >
              <GripVertical className="w-3 h-3 text-zinc-400 pointer-events-none opacity-40" />
            </div>

            {/* Right Live Article Preview Pane */}
            <div
              style={{ width: `${100 - splitRatio}%` }}
              className="h-full overflow-y-auto bg-[#FAFAFA] dark:bg-[#0c0e12]"
            >
              <ArticleLivePreview formData={formData} />
            </div>
          </div>
        )}

        {/* VIEW MODE 3: PREVIEW (Full-Width True Public Article Simulation) */}
        {viewMode === 'preview' && (
          <div className="flex-1 overflow-y-auto h-full">
            <ArticleLivePreview formData={formData} />
          </div>
        )}

        {/* 3. COLLAPSIBLE EDITORIAL INSPECTOR DRAWER */}
        <AnimatePresence>
          {inspectorOpen && (
            <motion.aside
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-[53px] bottom-0 right-0 z-40 w-full sm:w-[380px] bg-white dark:bg-[#12151c] border-l border-zinc-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-600" />
                  <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                    Editorial Inspector
                  </h3>
                </div>
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body (Accordion Groups) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
                {/* 1. Article Health & Readiness */}
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-zinc-400">
                      Publish Readiness
                    </span>
                    <span className="font-mono font-bold text-[10px] text-zinc-600 dark:text-zinc-300">
                      {healthCheck.passed} / {healthCheck.total} Passed
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${healthCheck.isReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${(healthCheck.passed / healthCheck.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 2. Publication Settings */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('publication')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <span>Publication & Status</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.publication ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.publication && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, status: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="in_review">In Review</option>
                          <option value="approved">Approved</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Author Byline</label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, author: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="e.g. Suheel Hilal"
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Classification & Taxonomy */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('classification')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <span>Classification & Desks</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.classification ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.classification && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Content Type</label>
                        <select
                          value={formData.contentType}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, contentType: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
                        >
                          {CONTENT_TYPES.map((ct) => (
                            <option key={ct.id} value={ct.id}>{ct.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Primary Desk / Section</label>
                        <select
                          value={formData.primarySection}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, primarySection: e.target.value, categories: [e.target.value] }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                        >
                          <option value="Technology">Technology</option>
                          <option value="Education">Education</option>
                          <option value="News">News</option>
                          <option value="Business">Business</option>
                          <option value="Travel">Travel</option>
                          <option value="Kashmir">Kashmir Regional</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Regional Bureau</label>
                        <select
                          value={formData.primaryRegion || ''}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, primaryRegion: e.target.value || null }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                        >
                          <option value="">Global Edition (No Bureau)</option>
                          <option value="kashmir">Kashmir Regional Bureau</option>
                          <option value="india">India Edition</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Editorial Priorities */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('priority')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <span>Editorial Priority Flags</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.priority ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.priority && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      <label className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-white/10 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-red-600" />
                          <span className="font-bold">Breaking News Indicator</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.breaking}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              breaking: e.target.checked,
                              editorial: { ...prev.editorial, breaking: e.target.checked },
                            }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-white/10 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-500" />
                          <span className="font-bold">Developing Story Flag</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.developing}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              developing: e.target.checked,
                              editorial: { ...prev.editorial, developing: e.target.checked },
                            }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-4 h-4 text-amber-500 rounded"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 5. SEO & Social Meta */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('seo')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <span>SEO & Metadata</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.seo ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.seo && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Meta Title</label>
                          <span className={`text-[10px] font-mono ${(formData.seo.metaTitle?.length || 0) > 60 ? 'text-rose-500' : 'text-zinc-400'}`}>
                            {formData.seo.metaTitle?.length || 0} / 60
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formData.seo.metaTitle || ''}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, seo: { ...prev.seo, metaTitle: e.target.value } }));
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Search engine title..."
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Meta Description</label>
                          <span className={`text-[10px] font-mono ${(formData.seo.metaDescription?.length || 0) > 160 ? 'text-rose-500' : 'text-zinc-400'}`}>
                            {formData.seo.metaDescription?.length || 0} / 160
                          </span>
                        </div>
                        <textarea
                          value={formData.seo.metaDescription || ''}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }));
                            setHasUnsavedChanges(true);
                          }}
                          rows={3}
                          placeholder="Search snippet summary..."
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Cover Media */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('media')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <span>Cover Artwork & Media</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.media ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.media && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      {formData.image ? (
                        <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-zinc-200 dark:border-white/10">
                          <img src={formData.image} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                            className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                            title="Remove cover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-red-500 transition-colors">
                          <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                          <span className="font-bold text-xs">Upload Cover Image</span>
                          <span className="text-[10px] text-zinc-400">PNG, JPG, WebP up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      )}

                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Direct Image URL</label>
                        <input
                          type="text"
                          value={formData.image}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, image: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="https://..."
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Revisions History */}
                {id && (
                  <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        toggleAccordion('revisions');
                        if (!openSections.revisions) fetchRevisions();
                      }}
                      className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Audit Revisions History</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.revisions ? 'rotate-180' : ''}`} />
                    </button>

                    {openSections.revisions && (
                      <div className="p-3.5 space-y-2 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                        {loadingRevisions ? (
                          <div className="text-center py-4 text-zinc-400">Loading audit log...</div>
                        ) : revisionsList.length === 0 ? (
                          <div className="text-center py-4 text-zinc-400">No revisions logged yet.</div>
                        ) : (
                          revisionsList.map((rev) => (
                            <div key={rev.version} className="p-2 rounded-lg border border-zinc-200/60 dark:border-white/5 flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-[11px]">v{rev.version}</span>
                                <p className="text-[10px] text-zinc-400">{new Date(rev.createdAt).toLocaleString()}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Restore revision v${rev.version}?`)) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      title: rev.title || prev.title,
                                      content: rev.content || prev.content,
                                    }));
                                    addToast(`Restored version v${rev.version}`, 'info');
                                  }
                                }}
                                className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-colors"
                              >
                                Restore
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* 4. PERSISTENT BOTTOM STATUS BAR */}
      <footer className="bg-white dark:bg-[#12151c] border-t border-zinc-200/80 dark:border-white/10 px-6 py-2 flex items-center justify-between text-xs text-zinc-400 font-mono select-none">
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span>•</span>
          <span>{readingTime} min read</span>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges ? (
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved changes
            </span>
          ) : lastSavedTime ? (
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </footer>

      {/* 5. PUBLISH CONFIRMATION & HEALTH CHECK MODAL */}
      <AnimatePresence>
        {publishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-600">
                  Editorial Confirmation
                </span>
                <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white">
                  Publish Story to TeachyBlogs?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                  This will make this article publicly readable across the frontpage, section verticals, and RSS feeds.
                </p>
              </div>

              {/* Health checklist breakdown */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">
                  Pre-Flight Verification:
                </span>
                {healthCheck.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs font-semibold">
                    <span className={item.valid ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}>
                      {item.label}
                    </span>
                    {item.valid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className="text-[10px] text-amber-500 font-mono uppercase">Optional</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('published')}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-red-600/20 transition-all flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Confirm & Publish</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
