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
  ChevronUp,
  Check,
  AlertTriangle,
  Flame,
  Activity,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Terminal,
  Play,
  FileCode,
  Search,
  Share2,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { postAPI, taxonomyAPI, authorAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import ArticleLivePreview from './ArticleLivePreview';
import { extractHeadings } from '@/utils/markdownEngine';
import { getReadingTime } from '@/utils/readingTime';

const AUTOSAVE_DEBOUNCE_MS = 20000; // 20 seconds debounce
const AUTOSAVE_MAX_INTERVAL_MS = 60000; // 60 seconds maximum forced interval

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
  const [imageUploading, setImageUploading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Keyword input state
  const [keywordInput, setKeywordInput] = useState('');

  // Workspace View Modes: 'write' (wide canvas), 'split' (resizable dual-pane), 'preview' (full public simulation)
  const [viewMode, setViewMode] = useState('write');
  const [inspectorOpen, setInspectorOpen] = useState(false); // Closed by default
  const [focusMode, setFocusMode] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage for editor in split mode (25-75)
  const isDraggingSplitRef = useRef(false);

  // Inserter Modals: null, 'image', 'link'
  const [activeModal, setActiveModal] = useState(null);
  const [modalInput, setModalInput] = useState({ url: '', alt: '', text: '' });

  // Accordion open states inside inspector
  const [openSections, setOpenSections] = useState({
    health: true,
    publication: true,
    classification: true,
    priority: false,
    review_tutorial: false,
    seo: true,
    seo_social: false,
    faqs: true,
    media: false,
    sources: false,
    revisions: false,
  });

  // Multi-Dimensional Taxonomy & Relations
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [revisionsList, setRevisionsList] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Autosave & Persistence State
  const [isOnline, setIsOnline] = useState(true);
  const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle', 'saved', 'saving', 'local', 'offline', 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(20);
  const [recoveryDraft, setRecoveryDraft] = useState(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const maxIntervalTimerRef = useRef(null);
  const lastSyncTimeRef = useRef(Date.now());
  const localDraftKey = useMemo(() => (id ? `teachyblogs:draft:${id}` : `teachyblogs:draft:new`), [id]);

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
      title: '',
      description: '',
      keywords: [],
      canonicalUrl: '',
      socialTitle: '',
      socialDescription: '',
      socialImage: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      robots: {
        index: true,
        follow: true,
      },
    },
  });

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (hasUnsavedChanges) triggerDebouncedSave();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setAutosaveStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasUnsavedChanges]);

  // Load existing article and check for newer local draft
  useEffect(() => {
    const loadArticleAndCheckDraft = async () => {
      if (!id) {
        // Check new article local draft
        try {
          const localStr = localStorage.getItem(localDraftKey);
          if (localStr) {
            const localData = JSON.parse(localStr);
            if (localData?.formData && (localData.formData.title || localData.formData.content)) {
              setRecoveryDraft(localData);
            }
          }
        } catch (e) {}
        return;
      }

      setLoading(true);
      try {
        const res = await postAPI.getPost(id);
        if (res.post) {
          const p = res.post;
          const serverForm = {
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
            faqs: (p.faqs || []).map((f, i) => ({ ...f, order: f.order ?? i })),
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
            seo: {
              title: p.seo?.title || p.title || '',
              description: p.seo?.description || p.metaDescription || p.excerpt || '',
              keywords: Array.isArray(p.seo?.keywords) ? p.seo.keywords : (p.keywords ? p.keywords.split(',').map((s) => s.trim()) : []),
              canonicalUrl: p.seo?.canonicalUrl || '',
              socialTitle: p.seo?.socialTitle || '',
              socialDescription: p.seo?.socialDescription || '',
              socialImage: p.seo?.socialImage || '',
              twitterTitle: p.seo?.twitterTitle || '',
              twitterDescription: p.seo?.twitterDescription || '',
              twitterImage: p.seo?.twitterImage || '',
              robots: p.seo?.robots || { index: true, follow: true },
            },
          };

          setFormData(serverForm);
          setIsSlugManual(true);
          setLastSavedTime(new Date(p.updatedAt || p.createdAt || Date.now()));

          // Check if local storage has a newer unsaved draft
          try {
            const localStr = localStorage.getItem(localDraftKey);
            if (localStr) {
              const localData = JSON.parse(localStr);
              const localTime = new Date(localData.updatedAt || 0).getTime();
              const serverTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
              if (localTime > serverTime + 2000 && localData.formData) {
                setRecoveryDraft(localData);
              }
            }
          } catch (e) {}
        }
      } catch (err) {
        addToast('Failed to load article: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadArticleAndCheckDraft();
  }, [id, localDraftKey]);

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
      } catch (err) {}
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
    } catch (err) {}
    finally {
      setLoadingRevisions(false);
    }
  }, [id]);

  // --- SMART AUTOSAVE ENGINE ---

  // 1. Immediate Local Storage Write
  const persistLocally = useCallback((updatedForm) => {
    try {
      localStorage.setItem(
        localDraftKey,
        JSON.stringify({
          id,
          formData: updatedForm,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn('LocalStorage draft write failed:', e);
    }
  }, [localDraftKey, id]);

  // 2. Server Sync Function
  const syncDraftToServer = useCallback(
    async (isBackground = true) => {
      if (!isOnline) {
        setAutosaveStatus('offline');
        return;
      }

      if (!formData.title?.trim()) return; // Don't autosave untitled blank drafts to DB

      setAutosaveStatus('saving');
      try {
        const payload = {
          ...formData,
          isAutosave: isBackground,
        };

        if (id) {
          await postAPI.updatePost(id, payload);
        }

        setAutosaveStatus('saved');
        setHasUnsavedChanges(false);
        setLastSavedTime(new Date());
        lastSyncTimeRef.current = Date.now();
      } catch (err) {
        setAutosaveStatus('error');
      }
    },
    [formData, id, isOnline]
  );

  // 3. Trigger debounced autosave on change
  const triggerDebouncedSave = useCallback(() => {
    setHasUnsavedChanges(true);
    setAutosaveStatus('local');

    // Reset debounce timer
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      syncDraftToServer(true);
    }, AUTOSAVE_DEBOUNCE_MS);

    // Enforce maximum save interval (60s)
    const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
    if (timeSinceLastSync >= AUTOSAVE_MAX_INTERVAL_MS) {
      if (maxIntervalTimerRef.current) clearTimeout(maxIntervalTimerRef.current);
      syncDraftToServer(true);
    }
  }, [syncDraftToServer]);

  // Update Form State Helper (writes locally immediately & triggers debounced save)
  const updateForm = useCallback(
    (updater) => {
      setFormData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        persistLocally(next);
        return next;
      });
      triggerDebouncedSave();
    },
    [persistLocally, triggerDebouncedSave]
  );

  // Keyboard Shortcuts & Unload Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S / Cmd+S: Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave('draft');
      }
      // Ctrl+\ / Cmd+\: Toggle Inspector
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setInspectorOpen((prev) => !prev);
      }
      // Ctrl+Shift+P / Cmd+Shift+P: Toggle Preview
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        handleModeSwitch(viewMode === 'preview' ? 'write' : 'preview');
      }
      // Escape: close modals / inspector
      if (e.key === 'Escape') {
        if (activeModal) setActiveModal(null);
        else if (inspectorOpen) setInspectorOpen(false);
        else if (publishModalOpen) setPublishModalOpen(false);
      }
    };

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, inspectorOpen, publishModalOpen, activeModal, hasUnsavedChanges, viewMode]);

  // Mode Switch with Save Trigger
  const handleModeSwitch = (newMode) => {
    if (hasUnsavedChanges && (newMode === 'preview' || newMode === 'split')) {
      syncDraftToServer(true);
    }
    setViewMode(newMode);
  };

  // Title change with non-destructive slug generation
  const handleTitleChange = (e) => {
    const title = e.target.value;
    updateForm((prev) => {
      const updates = { title };
      if (!isSlugManual || !prev.slug) {
        updates.slug = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();
      }
      if (!prev.seo?.title) {
        updates.seo = { ...prev.seo, title };
      }
      return { ...prev, ...updates };
    });
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

  // SEO Health Breakdown (Required vs Recommended)
  const seoHealth = useMemo(() => {
    const required = [
      { id: 'title', label: 'Story Headline', valid: !!formData.title?.trim() },
      { id: 'content', label: 'Markdown Body', valid: !!formData.content?.trim() },
      { id: 'author', label: 'Author Byline', valid: !!formData.author?.trim() },
      { id: 'section', label: 'Primary Section', valid: !!formData.primarySection },
    ];
    const recommended = [
      { id: 'meta_title', label: 'SEO Title (50-60 chars)', valid: (formData.seo?.title || formData.title)?.length >= 40 },
      { id: 'meta_desc', label: 'Meta Description (140-160 chars)', valid: (formData.seo?.description || formData.subtitle)?.length >= 100 },
      { id: 'slug', label: 'Custom URL Slug', valid: !!formData.slug?.trim() },
      { id: 'keywords', label: 'SEO Keywords Added', valid: (formData.seo?.keywords?.length || 0) > 0 },
      { id: 'cover', label: 'Cover Image Media', valid: !!formData.image },
      { id: 'faqs', label: 'Structured FAQ Items', valid: (formData.faqs?.length || 0) > 0 },
    ];

    const reqPassed = required.filter((r) => r.valid).length;
    const recPassed = recommended.filter((r) => r.valid).length;
    const isReadyToPublish = reqPassed === required.length;

    return { required, recommended, reqPassed, recPassed, isReadyToPublish };
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

    updateForm({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  // Modal Inserter Submit Handlers
  const handleInsertImage = () => {
    if (!modalInput.url) return;
    const alt = modalInput.alt || 'Article visual';
    insertTextAtCursor(`\n![${alt}](${modalInput.url})\n`);
    setActiveModal(null);
    setModalInput({ url: '', alt: '', text: '' });
  };

  const handleInsertLink = () => {
    if (!modalInput.url) return;
    const text = modalInput.text || 'Link description';
    insertTextAtCursor(`[${text}](${modalInput.url})`);
    setActiveModal(null);
    setModalInput({ url: '', alt: '', text: '' });
  };

  // Keyword Chip Management
  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const kw = keywordInput.trim().toLowerCase();
      if (kw && !formData.seo.keywords.includes(kw)) {
        updateForm((prev) => ({
          ...prev,
          seo: { ...prev.seo, keywords: [...(prev.seo.keywords || []), kw] },
        }));
      }
      setKeywordInput('');
    } else if (e.key === 'Backspace' && !keywordInput && formData.seo?.keywords?.length > 0) {
      updateForm((prev) => ({
        ...prev,
        seo: { ...prev.seo, keywords: prev.seo.keywords.slice(0, -1) },
      }));
    }
  };

  const handleRemoveKeyword = (kwToRemove) => {
    updateForm((prev) => ({
      ...prev,
      seo: { ...prev.seo, keywords: prev.seo.keywords.filter((k) => k !== kwToRemove) },
    }));
  };

  // FAQ Builder Handlers
  const handleAddFaq = () => {
    updateForm((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '', order: prev.faqs.length }],
    }));
  };

  const handleUpdateFaq = (index, field, value) => {
    updateForm((prev) => {
      const nextFaqs = [...prev.faqs];
      nextFaqs[index] = { ...nextFaqs[index], [field]: value };
      return { ...prev, faqs: nextFaqs };
    });
  };

  const handleRemoveFaq = (index) => {
    updateForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const handleMoveFaq = (index, direction) => {
    updateForm((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.faqs.length) return prev;
      const nextFaqs = [...prev.faqs];
      const temp = nextFaqs[index];
      nextFaqs[index] = nextFaqs[targetIndex];
      nextFaqs[targetIndex] = temp;
      return { ...prev, faqs: nextFaqs.map((f, i) => ({ ...f, order: i })) };
    });
  };

  // Manual Save Draft (immediate server sync)
  const handleManualSave = async (targetStatus = 'draft') => {
    if (!formData.title?.trim()) {
      addToast('Story headline is required', 'error');
      return;
    }
    if (!formData.content?.trim()) {
      addToast('Article content body is required', 'error');
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
        isAutosave: false, // Record formal version on manual save
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
      setAutosaveStatus('saved');
      setLastSavedTime(new Date());
      setPublishModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Saving failed', 'error');
      setAutosaveStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish Workflow (Forces server save before publish confirmation)
  const handlePublishClick = async () => {
    if (hasUnsavedChanges) {
      setSubmitting(true);
      try {
        await syncDraftToServer(false);
      } catch (err) {
        addToast('Your latest changes could not be saved. The article was not published.', 'error');
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }
    setPublishModalOpen(true);
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
        updateForm({ image: data.url });
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

  // Render Toolbar Component (shared between Write and Split modes) - Single sleek line
  const renderToolbar = () => (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#12151c]/95 backdrop-blur-md py-1.5 px-2 border-y border-zinc-200/80 dark:border-white/10 flex items-center overflow-x-auto no-scrollbar gap-1 whitespace-nowrap shadow-xs">
      {/* Headings */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-zinc-200 dark:border-white/10 shrink-0">
        <button type="button" onClick={() => insertTextAtCursor('# ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('## ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('### ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></button>
      </div>

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-200 dark:border-white/10 shrink-0">
        <button type="button" onClick={() => insertTextAtCursor('**', '**')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Bold (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('*', '*')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Italic (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('~~', '~~')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('`', '`')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Inline Code"><Code className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('> ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Blockquote"><Quote className="w-3.5 h-3.5" /></button>
      </div>

      {/* Media & Link Inserts */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-200 dark:border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => setActiveModal('image')}
          className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-600 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 font-bold text-xs transition-colors"
          title="Insert Article Image"
        >
          <ImageIcon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>Image</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('link')}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1 text-xs"
          title="Insert Hyperlink"
        >
          <Link2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Link</span>
        </button>
      </div>

      {/* Lists & Dividers */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-200 dark:border-white/10 shrink-0">
        <button type="button" onClick={() => insertTextAtCursor('- ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('1. ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('- [ ] ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Task List"><CheckSquare className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('\n---\n\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Horizontal Divider"><Minus className="w-3.5 h-3.5" /></button>
      </div>

      {/* Rich Component Inserters */}
      <div className="flex items-center gap-1 pl-1 text-xs text-zinc-500 font-bold shrink-0">
        <button type="button" onClick={() => insertTextAtCursor('\n| Column 1 | Column 2 |\n|---|---|\n| Item 1 | Item 2 |\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
          <TableIcon className="w-3 h-3 text-purple-500" /> Table
        </button>

        <button type="button" onClick={() => insertTextAtCursor('```javascript\n// Code snippet\nconsole.log("TeachyBlogs Engineering");\n```\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
          <FileCode className="w-3 h-3 text-amber-500" /> Code Block
        </button>

        <button type="button" onClick={() => insertTextAtCursor('$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
          <Sigma className="w-3 h-3 text-emerald-500" /> Math LaTeX
        </button>

        <button type="button" onClick={() => insertTextAtCursor('```mermaid\ngraph TD\n  A[Input] --> B[Processing]\n  B --> C[Result]\n```\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
          <GitBranch className="w-3 h-3 text-indigo-500" /> Diagram
        </button>

        <button type="button" onClick={() => insertTextAtCursor(':::note\nImportant editorial takeaway or context note.\n:::\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
          <Info className="w-3 h-3 text-blue-500" /> Callout
        </button>

        <button type="button" onClick={() => insertTextAtCursor('```js playground\n// Interactive executable sandbox\nconst msg = "Welcome to TeachyBlogs Sandbox";\nconsole.log(msg);\n```\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
          <Play className="w-3 h-3 text-rose-500" /> Sandbox
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#FAFAFA] dark:bg-[#0c0e12] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans ${focusMode ? 'fixed inset-0 z-50 overflow-hidden' : ''}`}>
      {/* 0. LOCAL DRAFT RECOVERY BANNER */}
      <AnimatePresence>
        {recoveryDraft && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 font-medium z-40"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Unsynced local draft found.</strong> Your browser contains a newer version from{' '}
                {new Date(recoveryDraft.updatedAt).toLocaleTimeString()}.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData(recoveryDraft.formData);
                  setRecoveryDraft(null);
                  setHasUnsavedChanges(true);
                  addToast('Local draft restored', 'info');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
              >
                Restore Local Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(localDraftKey);
                  setRecoveryDraft(null);
                }}
                className="px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-500/10 transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <span>•</span>

              {/* Smart Autosave Status Indicator */}
              {autosaveStatus === 'saving' ? (
                <span className="text-blue-500 font-bold flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                </span>
              ) : autosaveStatus === 'local' ? (
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Saved locally
                </span>
              ) : autosaveStatus === 'offline' ? (
                <span className="text-rose-500 font-bold flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5" /> Offline · Saved locally
                </span>
              ) : autosaveStatus === 'saved' || lastSavedTime ? (
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Saved just now
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => handleModeSwitch('write')}
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
            onClick={() => handleModeSwitch('split')}
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
            onClick={() => handleModeSwitch('preview')}
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
            {!seoHealth.isReadyToPublish && (
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
            onClick={() => handleManualSave('draft')}
            disabled={submitting}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Publish Trigger */}
          <button
            type="button"
            onClick={handlePublishClick}
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
            <div className={`w-full ${focusMode ? 'max-w-6xl px-4 md:px-8' : 'max-w-5xl'} space-y-6 transition-all duration-300`}>
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
                    updateForm({ subtitle: e.target.value });
                  }}
                  placeholder="Add editorial subtitle or narrative dek..."
                  className="w-full text-lg md:text-xl font-medium font-sans bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-zinc-600 dark:text-zinc-300"
                />
              </div>

              {/* Toolbar */}
              {renderToolbar()}

              {/* Full-width Markdown Body Textarea */}
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => {
                  updateForm({ content: e.target.value });
                }}
                placeholder="Start typing your story in Markdown..."
                className={`w-full ${focusMode ? 'min-h-[75vh]' : 'min-h-[600px]'} font-mono text-sm leading-relaxed bg-transparent border-none outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400`}
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
                    updateForm({ subtitle: e.target.value });
                  }}
                  placeholder="Subtitle dek..."
                  className="w-full text-xs font-medium text-zinc-500 bg-transparent border-none outline-none"
                />
              </div>

              {/* Toolbar inside split pane */}
              {renderToolbar()}

              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => {
                  updateForm({ content: e.target.value });
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
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-[53px] bottom-0 right-0 z-40 w-full sm:w-[420px] bg-white dark:bg-[#12151c] border-l border-zinc-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
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
                {/* 1. SEO & Publish Health */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('health')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>SEO & Publish Readiness</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {seoHealth.reqPassed}/{seoHealth.required.length} Required
                    </span>
                  </button>

                  {openSections.health && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                          Mandatory Criteria
                        </span>
                        <div className="space-y-1">
                          {seoHealth.required.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className={item.valid ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}>{item.label}</span>
                              {item.valid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <span className="text-[9px] font-mono text-rose-500 font-bold uppercase">Required</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                          Recommended SEO
                        </span>
                        <div className="space-y-1">
                          {seoHealth.recommended.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className={item.valid ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}>{item.label}</span>
                              {item.valid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <span className="text-[9px] font-mono text-amber-500 font-bold uppercase">Recommended</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SEO & METADATA WORKSPACE */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('seo')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-blue-500" />
                      <span>SEO & Metadata Workspace</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.seo ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.seo && (
                    <div className="p-3.5 space-y-4 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      {/* Meta Title */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Meta Title</label>
                          <div className="flex items-center gap-1.5">
                            {formData.seo?.title?.length > 0 && (
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  formData.seo.title.length < 50
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : formData.seo.title.length <= 60
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}
                              >
                                {formData.seo.title.length < 50 ? 'Too short' : formData.seo.title.length <= 60 ? 'Good' : 'Too long'}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-zinc-400">
                              {formData.seo?.title?.length || 0} / 60
                            </span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formData.seo?.title || ''}
                          onChange={(e) => updateForm({ seo: { ...formData.seo, title: e.target.value } })}
                          placeholder={formData.title || 'Search title...'}
                          className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 text-xs outline-none focus:border-red-500"
                        />
                      </div>

                      {/* Meta Description */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Meta Description</label>
                          <div className="flex items-center gap-1.5">
                            {formData.seo?.description?.length > 0 && (
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  formData.seo.description.length < 140
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : formData.seo.description.length <= 160
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}
                              >
                                {formData.seo.description.length < 140 ? 'Too short' : formData.seo.description.length <= 160 ? 'Good' : 'Too long'}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-zinc-400">
                              {formData.seo?.description?.length || 0} / 160
                            </span>
                          </div>
                        </div>
                        <textarea
                          rows={3}
                          value={formData.seo?.description || ''}
                          onChange={(e) => updateForm({ seo: { ...formData.seo, description: e.target.value } })}
                          placeholder={formData.subtitle || 'Search snippet summary...'}
                          className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 text-xs outline-none focus:border-red-500 resize-none"
                        />
                      </div>

                      {/* SEO Keywords Chip Tag Editor */}
                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                          SEO Keywords (Press Enter to add)
                        </label>
                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 flex flex-wrap items-center gap-1.5 min-h-[42px]">
                          {formData.seo?.keywords?.map((kw, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 text-[11px] font-medium px-2 py-0.5 rounded-lg"
                            >
                              <span>{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(kw)}
                                className="hover:text-red-900 dark:hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={handleAddKeyword}
                            placeholder={formData.seo?.keywords?.length ? '' : 'e.g. next.js, react, web performance'}
                            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400"
                          />
                        </div>
                      </div>

                      {/* URL Slug (Preserves manual edits) */}
                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">URL Slug</label>
                        <div className="flex items-center rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 overflow-hidden focus-within:border-red-500">
                          <span className="px-2.5 text-zinc-400 font-mono text-[11px] border-r border-zinc-200 dark:border-white/10">/blog/</span>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => {
                              setIsSlugManual(true);
                              updateForm({ slug: e.target.value.toLowerCase().replace(/[^\w-]/g, '') });
                            }}
                            placeholder="article-slug"
                            className="flex-1 p-2 bg-transparent border-none outline-none text-xs font-mono text-zinc-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Canonical URL */}
                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-0.5">Canonical URL</label>
                        <input
                          type="text"
                          value={formData.seo?.canonicalUrl || ''}
                          onChange={(e) => updateForm({ seo: { ...formData.seo, canonicalUrl: e.target.value } })}
                          placeholder="https://www.teachyblogs.com/blog/..."
                          className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
                        />
                        <p className="text-[10px] text-zinc-400 mt-1">Use this when the article's primary URL differs from this page.</p>
                      </div>

                      {/* Robots Directives */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Search Indexing</label>
                          <select
                            value={formData.seo?.robots?.index !== false ? 'index' : 'noindex'}
                            onChange={(e) =>
                              updateForm({ seo: { ...formData.seo, robots: { ...formData.seo.robots, index: e.target.value === 'index' } } })
                            }
                            className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                          >
                            <option value="index">Index (Recommended)</option>
                            <option value="noindex">No Index</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Link Following</label>
                          <select
                            value={formData.seo?.robots?.follow !== false ? 'follow' : 'nofollow'}
                            onChange={(e) =>
                              updateForm({ seo: { ...formData.seo, robots: { ...formData.seo.robots, follow: e.target.value === 'follow' } } })
                            }
                            className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                          >
                            <option value="follow">Follow (Recommended)</option>
                            <option value="nofollow">No Follow</option>
                          </select>
                        </div>
                      </div>

                      {/* Google Search Snippet Preview */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                          Search Preview
                        </span>
                        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 space-y-1 shadow-xs">
                          <div className="text-[11px] text-zinc-500 font-sans truncate">
                            teachyblogs.com › blog › {formData.slug || 'article-slug'}
                          </div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline line-clamp-1">
                            {formData.seo?.title || formData.title || 'Untitled Article'} | TeachyBlogs
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed font-sans">
                            {formData.seo?.description || formData.subtitle || formData.content?.substring(0, 140) || 'Article summary snippet for search results...'}
                          </div>
                        </div>
                      </div>

                      {/* Social / Open Graph Sub-Accordion */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => toggleAccordion('seo_social')}
                          className="w-full py-2 flex items-center justify-between font-bold text-xs text-zinc-800 dark:text-zinc-200"
                        >
                          <div className="flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-purple-500" />
                            <span>Social / Open Graph Cards</span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.seo_social ? 'rotate-180' : ''}`} />
                        </button>

                        {openSections.seo_social && (
                          <div className="pt-2 space-y-3">
                            <div>
                              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">OG Social Title</label>
                              <input
                                type="text"
                                value={formData.seo?.socialTitle || ''}
                                onChange={(e) => updateForm({ seo: { ...formData.seo, socialTitle: e.target.value } })}
                                placeholder={formData.seo?.title || formData.title || 'Social card title'}
                                className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">OG Social Description</label>
                              <textarea
                                rows={2}
                                value={formData.seo?.socialDescription || ''}
                                onChange={(e) => updateForm({ seo: { ...formData.seo, socialDescription: e.target.value } })}
                                placeholder={formData.seo?.description || formData.subtitle || 'Social summary'}
                                className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none resize-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">OG Social Image URL</label>
                              <input
                                type="text"
                                value={formData.seo?.socialImage || ''}
                                onChange={(e) => updateForm({ seo: { ...formData.seo, socialImage: e.target.value } })}
                                placeholder={formData.image || 'https://...'}
                                className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
                              />
                            </div>

                            {/* Mini Social Card Preview */}
                            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 mt-2">
                              <div className="aspect-[1.91/1] bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {formData.seo?.socialImage || formData.image ? (
                                  <img src={formData.seo?.socialImage || formData.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-zinc-400" />
                                )}
                              </div>
                              <div className="p-3 space-y-1">
                                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">TEACHYBLOGS.COM</span>
                                <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                                  {formData.seo?.socialTitle || formData.seo?.title || formData.title || 'Article Title'}
                                </h4>
                                <p className="text-[11px] text-zinc-500 line-clamp-1">
                                  {formData.seo?.socialDescription || formData.seo?.description || formData.subtitle || 'Article description...'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. STRUCTURED FAQ BUILDER */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('faqs')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>FAQ Builder & Schema ({formData.faqs?.length || 0})</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.faqs ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.faqs && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      {formData.faqs?.length === 0 ? (
                        <p className="text-zinc-400 text-xs text-center py-2">No FAQ items created yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {formData.faqs.map((faq, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase">
                                  Question #{idx + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFaq(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white disabled:opacity-30"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFaq(idx, 'down')}
                                    disabled={idx === formData.faqs.length - 1}
                                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white disabled:opacity-30"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFaq(idx)}
                                    className="p-1 text-rose-500 hover:text-rose-700"
                                    title="Remove Question"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                                placeholder="What is Next.js 15?"
                                className="w-full p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-bold outline-none"
                              />

                              <textarea
                                rows={2}
                                value={faq.answer}
                                onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                                placeholder="Next.js 15 introduces React 19 support..."
                                className="w-full p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none resize-none font-sans"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="w-full py-2 border border-dashed border-zinc-300 dark:border-white/15 rounded-xl font-bold text-xs text-zinc-600 dark:text-zinc-300 hover:border-red-500 hover:text-red-600 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add FAQ Question</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Publication Settings */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('publication')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <span>Publication & Author</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.publication ? 'rotate-180' : ''}`} />
                  </button>

                  {openSections.publication && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => updateForm({ status: e.target.value })}
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
                          onChange={(e) => updateForm({ author: e.target.value })}
                          placeholder="e.g. Suheel Hilal"
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Classification & Taxonomy */}
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
                          onChange={(e) => updateForm({ contentType: e.target.value })}
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
                          onChange={(e) => updateForm({ primarySection: e.target.value, categories: [e.target.value] })}
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
                          onChange={(e) => updateForm({ primaryRegion: e.target.value || null })}
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

                {/* 6. Editorial Priorities */}
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
                          onChange={(e) =>
                            updateForm({
                              breaking: e.target.checked,
                              editorial: { ...formData.editorial, breaking: e.target.checked },
                            })
                          }
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
                          onChange={(e) =>
                            updateForm({
                              developing: e.target.checked,
                              editorial: { ...formData.editorial, developing: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-amber-500 rounded"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 7. Cover Media */}
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
                            onClick={() => updateForm({ image: '' })}
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
                          onChange={(e) => updateForm({ image: e.target.value })}
                          placeholder="https://..."
                          className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. Revisions History */}
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
                          <div className="text-center py-4 text-zinc-400">No formal version milestones logged yet.</div>
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
                                    updateForm({
                                      title: rev.title || formData.title,
                                      content: rev.content || formData.content,
                                    });
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
          {autosaveStatus === 'saving' ? (
            <span className="text-blue-500 font-bold flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving draft...
            </span>
          ) : autosaveStatus === 'local' ? (
            <span className="text-amber-500 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Saved locally
            </span>
          ) : autosaveStatus === 'offline' ? (
            <span className="text-rose-500 font-bold flex items-center gap-1.5">
              <WifiOff className="w-3 h-3" /> Offline · Saved locally
            </span>
          ) : lastSavedTime ? (
            <span className="text-emerald-500 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved just now
            </span>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </footer>

      {/* 5. MODAL: INSERT IMAGE */}
      <AnimatePresence>
        {activeModal === 'image' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  <h3 className="font-display text-sm font-bold text-zinc-900 dark:text-white">
                    Insert Image in Story
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={modalInput.url}
                    onChange={(e) => setModalInput((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Alt Text / Description</label>
                  <input
                    type="text"
                    value={modalInput.alt}
                    onChange={(e) => setModalInput((prev) => ({ ...prev, alt: e.target.value }))}
                    placeholder="Brief description of the graphic or photo..."
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  disabled={!modalInput.url}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  Insert Image
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: INSERT LINK */}
      <AnimatePresence>
        {activeModal === 'link' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  <h3 className="font-display text-sm font-bold text-zinc-900 dark:text-white">
                    Insert Hyperlink
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={modalInput.url}
                    onChange={(e) => setModalInput((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/..."
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Link Anchor Text</label>
                  <input
                    type="text"
                    value={modalInput.text}
                    onChange={(e) => setModalInput((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="Display text..."
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  disabled={!modalInput.url}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  Insert Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. PUBLISH CONFIRMATION & HEALTH CHECK MODAL */}
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
                {seoHealth.required.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs font-semibold">
                    <span className={item.valid ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}>
                      {item.label}
                    </span>
                    {item.valid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className="text-[10px] text-rose-500 font-mono uppercase">Required</span>
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
                  onClick={() => handleManualSave('published')}
                  disabled={submitting || !seoHealth.isReadyToPublish}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-red-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
