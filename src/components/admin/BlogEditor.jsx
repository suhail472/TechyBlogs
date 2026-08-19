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
  Lock,
  ExternalLink,
  Keyboard,
  CheckCheck,
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

const generateFaqId = () => `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Centralized Publication Readiness Validation Engine
 */
export function getPublicationReadiness(article) {
  const blockingIssues = [];
  const warnings = [];
  const completed = [];

  // 1. Headline (Mandatory)
  if (!article.title || !article.title.trim()) {
    blockingIssues.push({
      id: 'title',
      label: 'Headline',
      message: 'Add an article headline before publishing.',
      sectionId: null,
      fieldId: 'story-headline-input',
    });
  } else {
    completed.push({ id: 'title', label: 'Story Headline' });
  }

  // 2. Article Body (Mandatory)
  const bodyText = (article.content || '').trim();
  if (!bodyText) {
    blockingIssues.push({
      id: 'content',
      label: 'Article Content Body',
      message: 'Add article Markdown content before publishing.',
      sectionId: null,
      fieldId: 'story-content-textarea',
    });
  } else {
    completed.push({ id: 'content', label: 'Article Content Body' });
  }

  // 3. Author (Mandatory)
  if (!article.author || !article.author.trim()) {
    blockingIssues.push({
      id: 'author',
      label: 'Author Byline',
      message: 'Assign an author to the article.',
      sectionId: 'publication',
      fieldId: 'author-input',
    });
  } else {
    completed.push({ id: 'author', label: `Author: ${article.author}` });
  }

  // 4. Primary Section (Mandatory)
  if (!article.primarySection || !article.primarySection.trim()) {
    blockingIssues.push({
      id: 'section',
      label: 'Primary Section',
      message: 'Select a primary editorial desk / section.',
      sectionId: 'classification',
      fieldId: 'primary-section-select',
    });
  } else {
    completed.push({ id: 'section', label: `Desk: ${article.primarySection}` });
  }

  // 5. Content Type (Mandatory)
  if (!article.contentType || !article.contentType.trim()) {
    blockingIssues.push({
      id: 'contentType',
      label: 'Content Type',
      message: 'Select an editorial content classification.',
      sectionId: 'classification',
      fieldId: 'content-type-select',
    });
  } else {
    completed.push({ id: 'contentType', label: `Type: ${article.contentType}` });
  }

  // 6. Cover Image (Mandatory)
  if (!article.image || !article.image.trim()) {
    blockingIssues.push({
      id: 'image',
      label: 'Cover Image',
      message: 'Upload or provide a featured cover image.',
      sectionId: 'media',
      fieldId: 'cover-image-input',
    });
  } else {
    completed.push({ id: 'image', label: 'Cover Image Attached' });
  }

  // 7. URL Slug (Mandatory)
  if (!article.slug || !article.slug.trim()) {
    blockingIssues.push({
      id: 'slug',
      label: 'URL Slug',
      message: 'Provide a valid URL slug for the article.',
      sectionId: 'seo',
      fieldId: 'slug-input',
    });
  } else {
    completed.push({ id: 'slug', label: `Slug (/blog/${article.slug})` });
  }

  // 8. Meta Description (Mandatory)
  const metaDesc = (article.seo?.description || article.metaDescription || article.subtitle || '').trim();
  if (!metaDesc) {
    blockingIssues.push({
      id: 'metaDescription',
      label: 'Meta Description',
      message: 'Add an SEO meta description (recommended 140–160 chars).',
      sectionId: 'seo',
      fieldId: 'meta-description-textarea',
    });
  } else if (metaDesc.length < 50) {
    warnings.push({
      id: 'metaDescription_short',
      label: 'Meta Description Length',
      message: `Meta description is short (${metaDesc.length}/160 chars). Recommended 140–160 chars.`,
      sectionId: 'seo',
      fieldId: 'meta-description-textarea',
    });
    completed.push({ id: 'metaDescription', label: 'Meta Description (Short)' });
  } else if (metaDesc.length > 160) {
    warnings.push({
      id: 'metaDescription_long',
      label: 'Meta Description Length',
      message: `Meta description exceeds 160 chars (${metaDesc.length}/160). Search engines may truncate it.`,
      sectionId: 'seo',
      fieldId: 'meta-description-textarea',
    });
    completed.push({ id: 'metaDescription', label: 'Meta Description' });
  } else {
    completed.push({ id: 'metaDescription', label: 'Meta Description (Optimal)' });
  }

  // 9. SEO Title (Mandatory check for usable title)
  const effectiveSeoTitle = (article.seo?.title || article.title || '').trim();
  if (!effectiveSeoTitle) {
    blockingIssues.push({
      id: 'seoTitle',
      label: 'SEO Title',
      message: 'Provide a search title for the article.',
      sectionId: 'seo',
      fieldId: 'meta-title-input',
    });
  } else if (effectiveSeoTitle.length < 30) {
    warnings.push({
      id: 'seoTitle_short',
      label: 'SEO Title Length',
      message: `SEO title is short (${effectiveSeoTitle.length}/60 chars). Recommended 50–60 chars.`,
      sectionId: 'seo',
      fieldId: 'meta-title-input',
    });
  } else if (effectiveSeoTitle.length > 60) {
    warnings.push({
      id: 'seoTitle_long',
      label: 'SEO Title Length',
      message: `SEO title exceeds 60 chars (${effectiveSeoTitle.length}/60 chars).`,
      sectionId: 'seo',
      fieldId: 'meta-title-input',
    });
  }

  // 10. FAQ Validation (If FAQs exist, each must be complete)
  if (article.faqs && article.faqs.length > 0) {
    article.faqs.forEach((faq, idx) => {
      const q = (faq.question || '').trim();
      const a = (faq.answer || '').trim();
      if (!q && !a) {
        blockingIssues.push({
          id: `faq_empty_${idx}`,
          label: `FAQ #${idx + 1}`,
          message: `FAQ #${idx + 1} is empty. Complete question & answer or remove it.`,
          sectionId: 'faqs',
          fieldId: `faq-question-${idx}`,
        });
      } else if (!q) {
        blockingIssues.push({
          id: `faq_no_q_${idx}`,
          label: `FAQ #${idx + 1} Question`,
          message: `FAQ #${idx + 1} has an answer but is missing a question.`,
          sectionId: 'faqs',
          fieldId: `faq-question-${idx}`,
        });
      } else if (!a) {
        blockingIssues.push({
          id: `faq_no_a_${idx}`,
          label: `FAQ #${idx + 1} Answer`,
          message: `FAQ #${idx + 1} has a question but is missing an answer.`,
          sectionId: 'faqs',
          fieldId: `faq-answer-${idx}`,
        });
      }
    });
  }

  // 11. Recommendations / Warnings
  if (!article.seo?.keywords || article.seo.keywords.length === 0) {
    warnings.push({
      id: 'keywords',
      label: 'SEO Keywords',
      message: 'Consider adding 2-5 relevant SEO keyword tags.',
      sectionId: 'seo',
      fieldId: 'keywords-input',
    });
  }

  if (!article.seo?.socialImage && !article.image) {
    warnings.push({
      id: 'socialImage',
      label: 'Social Share Image',
      message: 'Add an Open Graph social card image.',
      sectionId: 'seo',
      fieldId: 'social-image-input',
    });
  }

  const canPublish = blockingIssues.length === 0;

  return {
    canPublish,
    blockingIssues,
    warnings,
    completed,
  };
}

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
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage for editor in split mode (25-75)
  const isDraggingSplitRef = useRef(false);

  // Inserter Modals: null, 'image', 'link'
  const [activeModal, setActiveModal] = useState(null);
  const [modalInput, setModalInput] = useState({ url: '', alt: '', text: '' });

  // Keyboard Shortcuts Modal
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

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
  const [recoveryDraft, setRecoveryDraft] = useState(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [readinessModalOpen, setReadinessModalOpen] = useState(false);

  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const maxIntervalTimerRef = useRef(null);
  const lastSyncTimeRef = useRef(Date.now());
  const localDraftKey = useMemo(() => (id ? `teachyblogs:draft:${id}` : `teachyblogs:draft:new`), [id]);

  // Form Data State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    excerpt: '',
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

  // Central Publication Readiness Evaluation
  const readiness = useMemo(() => getPublicationReadiness(formData), [formData]);

  // Timer Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (maxIntervalTimerRef.current) clearTimeout(maxIntervalTimerRef.current);
    };
  }, []);

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
            excerpt: p.excerpt || p.subtitle || '',
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
            faqs: (p.faqs || []).map((f, i) => ({
              id: f.id || f._id || generateFaqId(),
              question: f.question || '',
              answer: f.answer || '',
              order: f.order ?? i,
            })),
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
          excerpt: formData.excerpt || formData.subtitle || formData.seo?.description || formData.title || 'Article dispatch',
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
      // Ctrl+Enter / Cmd+Enter: Open Publish / Readiness workflow
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePublishClick();
      }
      // Ctrl+Shift+P / Cmd+Shift+P: Toggle Preview
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        handleModeSwitch(viewMode === 'preview' ? 'write' : 'preview');
      }
      // Ctrl+Shift+I or Ctrl+\: Toggle Inspector
      else if (((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) || ((e.ctrlKey || e.metaKey) && e.key === '\\')) {
        e.preventDefault();
        setInspectorOpen((prev) => !prev);
      }
      // Ctrl+/ or Cmd+/: Show Keyboard Shortcuts Cheat Sheet
      else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
      // Escape: close modals / inspector
      else if (e.key === 'Escape') {
        if (shortcutsModalOpen) setShortcutsModalOpen(false);
        else if (activeModal) setActiveModal(null);
        else if (readinessModalOpen) setReadinessModalOpen(false);
        else if (publishModalOpen) setPublishModalOpen(false);
        else if (inspectorOpen) setInspectorOpen(false);
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
  }, [formData, inspectorOpen, publishModalOpen, readinessModalOpen, shortcutsModalOpen, activeModal, hasUnsavedChanges, viewMode]);

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

  // Word & Character count calculations (Accurate Markdown Parsing)
  const { wordCount, charCount, readingTime } = useMemo(() => {
    const raw = formData.content || '';
    // Strip markdown formatting symbols and code blocks from word calculation
    const cleanText = raw
      .replace(/```[\s\S]*?```/g, ' ') // code blocks
      .replace(/\$\$[\s\S]*?\$\$/g, ' ') // math blocks
      .replace(/:::[a-z]+[\s\S]*?:::/g, ' ') // callouts & quizzes
      .replace(/!\[.*?\]\(.*?\)/g, ' ') // images
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links
      .replace(/[#*`~\[\]()>-]/g, ' ') // formatting markers
      .replace(/\s+/g, ' ')
      .trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const chars = raw.length;
    const readMin = getReadingTime(raw);
    return { wordCount: words, charCount: chars, readingTime: readMin };
  }, [formData.content]);

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

  // FAQ Builder Handlers (With Stable UUID & Immutable Array Reorder)
  const handleAddFaq = () => {
    updateForm((prev) => ({
      ...prev,
      faqs: [
        ...(prev.faqs || []),
        { id: generateFaqId(), question: '', answer: '', order: (prev.faqs || []).length },
      ],
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
      faqs: prev.faqs.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })),
    }));
  };

  const handleMoveFaq = (index, direction) => {
    updateForm((prev) => {
      const faqs = [...(prev.faqs || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= faqs.length) return prev;

      // Immutable swap
      const itemToMove = faqs[index];
      const itemToSwap = faqs[targetIndex];
      faqs[index] = itemToSwap;
      faqs[targetIndex] = itemToMove;

      // Normalize orders strictly
      const normalized = faqs.map((f, i) => ({
        ...f,
        order: i,
      }));

      return { ...prev, faqs: normalized };
    });
  };

  // Click-to-Fix Handler (Navigates directly to inspector section and focuses element)
  const handleFixIssue = (issue) => {
    setReadinessModalOpen(false);
    setPublishModalOpen(false);

    if (issue.sectionId) {
      setInspectorOpen(true);
      setOpenSections((prev) => ({ ...prev, [issue.sectionId]: true }));
    }

    setTimeout(() => {
      if (issue.fieldId) {
        const el = document.getElementById(issue.fieldId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
          el.classList.add('ring-2', 'ring-red-500');
          setTimeout(() => el.classList.remove('ring-2', 'ring-red-500'), 2500);
        }
      }
    }, 200);
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
        excerpt: formData.excerpt || formData.subtitle || formData.seo?.description || formData.title || 'Article dispatch',
        status: targetStatus,
        isAutosave: false, // Record formal version milestone on manual save
        publishedAt: targetStatus === 'published' && !formData.publishedAt ? new Date() : formData.publishedAt,
      };

      let res;
      if (id) {
        res = await postAPI.updatePost(id, payload);
        addToast(`Story updated as ${targetStatus}`, 'success');
      } else {
        res = await postAPI.createPost(payload);
        addToast(`Story created as ${targetStatus}`, 'success');
        const newId = res?._id || res?.post?._id;
        if (newId) {
          router.push(`/admin/edit/${newId}`);
        }
      }

      setHasUnsavedChanges(false);
      setAutosaveStatus('saved');
      setLastSavedTime(new Date());
      setPublishModalOpen(false);
      setReadinessModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Saving failed', 'error');
      setAutosaveStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish Workflow (Strictly gated by readiness + pre-publish server sync)
  const handlePublishClick = async () => {
    // 1. Strict Gate Evaluation
    const check = getPublicationReadiness(formData);
    if (!check.canPublish) {
      setReadinessModalOpen(true);
      return;
    }

    // 2. Pre-Publish Dirty Sync
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

    // 3. Open Confirmation Modal
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
        <button type="button" onClick={() => insertTextAtCursor('# ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Heading 1" aria-label="Heading 1"><Heading1 className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('## ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Heading 2" aria-label="Heading 2"><Heading2 className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('### ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Heading 3" aria-label="Heading 3"><Heading3 className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('#### ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Heading 4" aria-label="Heading 4"><Heading4 className="w-3.5 h-3.5" /></button>
      </div>

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-200 dark:border-white/10 shrink-0">
        <button type="button" onClick={() => insertTextAtCursor('**', '**')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Bold (Ctrl+B)" aria-label="Bold"><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('*', '*')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Italic (Ctrl+I)" aria-label="Italic"><Italic className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('~~', '~~')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Strikethrough" aria-label="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('`', '`')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Inline Code" aria-label="Inline Code"><Code className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('> ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" title="Blockquote" aria-label="Blockquote"><Quote className="w-3.5 h-3.5" /></button>
      </div>

      {/* Media & Link Inserts */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-200 dark:border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => setActiveModal('image')}
          className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-600 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 font-bold text-xs transition-colors"
          title="Insert Article Image"
          aria-label="Insert Image"
        >
          <ImageIcon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>Image</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('link')}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1 text-xs transition-colors"
          title="Insert Hyperlink"
          aria-label="Insert Hyperlink"
        >
          <Link2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Link</span>
        </button>
      </div>

      {/* Lists & Dividers */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-200 dark:border-white/10 shrink-0">
        <button type="button" onClick={() => insertTextAtCursor('- ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Bullet List" aria-label="Bullet List"><List className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('1. ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Numbered List" aria-label="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('- [ ] ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Task Checklist" aria-label="Task Checklist"><CheckSquare className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertTextAtCursor('\n---\n\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Horizontal Divider" aria-label="Horizontal Divider"><Minus className="w-3.5 h-3.5" /></button>
      </div>

      {/* Rich Component Inserters */}
      <div className="flex items-center gap-1 pl-1 text-xs text-zinc-500 font-bold shrink-0">
        <button type="button" onClick={() => insertTextAtCursor('\n| Column 1 | Column 2 |\n|---|---|\n| Item 1 | Item 2 |\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1" title="Insert Table" aria-label="Table">
          <TableIcon className="w-3 h-3 text-purple-500" /> Table
        </button>

        <button type="button" onClick={() => insertTextAtCursor('```javascript\n// Code snippet\nconsole.log("TeachyBlogs Editorial Workstation");\n```\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1" title="Insert Code Block" aria-label="Code Block">
          <FileCode className="w-3 h-3 text-amber-500" /> Code Block
        </button>

        <button type="button" onClick={() => insertTextAtCursor('$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1" title="Insert Math LaTeX" aria-label="Math LaTeX">
          <Sigma className="w-3 h-3 text-emerald-500" /> Math LaTeX
        </button>

        <button type="button" onClick={() => insertTextAtCursor('```mermaid\ngraph TD\n  A[Client Request] --> B[Next.js App Router]\n  B --> C{Cache Hit?}\n  C -->|Yes| D[Edge CDN]\n  C -->|No| E[MongoDB Atlas]\n  E --> D\n```\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1" title="Insert Mermaid Diagram" aria-label="Mermaid Diagram">
          <GitBranch className="w-3 h-3 text-indigo-500" /> Diagram
        </button>

        <button type="button" onClick={() => insertTextAtCursor(':::note\nImportant editorial takeaway or contextual notice.\n:::\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1" title="Insert Editorial Callout" aria-label="Callout">
          <Info className="w-3 h-3 text-blue-500" /> Callout
        </button>

        <button type="button" onClick={() => insertTextAtCursor(':::quiz What is Next.js 15 App Router standard?\n( ) Legacy Pages\n(*) Modern Server-First App Router\n( ) Pure SPA\n:::\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1" title="Insert Interactive Quiz" aria-label="Interactive Quiz">
          <HelpCircle className="w-3 h-3 text-cyan-500" /> Quiz
        </button>

        <button type="button" onClick={() => insertTextAtCursor('```js playground\n// Interactive executable sandbox\nconst headline = "TeachyBlogs Engine";\nconsole.log(headline);\n```\n')} className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1" title="Insert JavaScript Sandbox" aria-label="Playground Sandbox">
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
                  setFormData((prev) => ({
                    ...prev,
                    ...recoveryDraft.formData,
                    faqs: (recoveryDraft.formData?.faqs || []).map((f, i) => ({
                      id: f.id || f._id || generateFaqId(),
                      question: f.question || '',
                      answer: f.answer || '',
                      order: f.order ?? i,
                    })),
                  }));
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

        {/* Right: Actions, Readiness Indicator & Inspector Trigger */}
        <div className="flex items-center gap-2">
          {/* Live Readiness Pill */}
          <button
            type="button"
            onClick={() => setReadinessModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-white/10 text-[11px] font-bold font-mono transition-colors hover:bg-zinc-100 dark:hover:bg-white/5"
            title="View Publication Readiness Checklist"
          >
            {readiness.canPublish ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Ready to publish</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400">{readiness.blockingIssues.length} issues blocking</span>
              </>
            )}
          </button>

          {/* Inspector Toggle */}
          <button
            type="button"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              inspectorOpen
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                : 'border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
            title="Toggle Editorial Inspector (Ctrl+Shift+I or Ctrl+\)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspector</span>
            {!readiness.canPublish && (
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

          {/* Strictly Gated Publish Trigger */}
          {readiness.canPublish ? (
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={submitting}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm shadow-red-600/20 transition-all flex items-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Publish</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setReadinessModalOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Click to see requirements preventing publication"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Publish</span>
            </button>
          )}
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
                  id="story-headline-input"
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Story Headline..."
                  className="w-full text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-zinc-950 dark:text-white"
                />
                <input
                  id="story-subtitle-input"
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
                id="story-content-textarea"
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
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body (Accordion Groups) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
                {/* 1. SEO & Publish Health Summary */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('health')}
                    className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between font-bold text-zinc-900 dark:text-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Publication Health</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {readiness.completed.length} / {readiness.completed.length + readiness.blockingIssues.length} Ready
                    </span>
                  </button>

                  {openSections.health && (
                    <div className="p-3.5 space-y-3 bg-white dark:bg-[#12151c] border-t border-zinc-200/60 dark:border-white/5">
                      {readiness.blockingIssues.length > 0 && (
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-500 block mb-1.5">
                            Blocking Publication ({readiness.blockingIssues.length})
                          </span>
                          <div className="space-y-1.5">
                            {readiness.blockingIssues.map((issue) => (
                              <div
                                key={issue.id}
                                className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-between gap-2"
                              >
                                <span className="text-rose-700 dark:text-rose-400 font-medium text-[11px]">
                                  ✕ {issue.message}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFixIssue(issue)}
                                  className="text-[10px] font-bold text-rose-600 hover:underline shrink-0"
                                >
                                  Fix ↗
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {readiness.warnings.length > 0 && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500 block mb-1.5">
                            Recommendations ({readiness.warnings.length})
                          </span>
                          <div className="space-y-1">
                            {readiness.warnings.map((w) => (
                              <div key={w.id} className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1">
                                <span>⚠</span>
                                <span>{w.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                          id="meta-title-input"
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
                          id="meta-description-textarea"
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
                            id="keywords-input"
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
                            id="slug-input"
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
                          className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-mono"
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
                                id="social-image-input"
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

                {/* 3. STRUCTURED FAQ BUILDER (Fixed Reordering & Stable Keys) */}
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
                              key={faq.id || `faq_${idx}`}
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
                                    className={`p-1 rounded transition-colors ${
                                      idx === 0
                                        ? 'opacity-30 cursor-not-allowed text-zinc-400'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                    title="Move FAQ up"
                                    aria-label={`Move FAQ ${idx + 1} up`}
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFaq(idx, 'down')}
                                    disabled={idx === formData.faqs.length - 1}
                                    className={`p-1 rounded transition-colors ${
                                      idx === formData.faqs.length - 1
                                        ? 'opacity-30 cursor-not-allowed text-zinc-400'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                    title="Move FAQ down"
                                    aria-label={`Move FAQ ${idx + 1} down`}
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFaq(idx)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded ml-1 transition-colors"
                                    title="Remove Question"
                                    aria-label={`Remove FAQ ${idx + 1}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <input
                                id={`faq-question-${idx}`}
                                type="text"
                                value={faq.question}
                                onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                                placeholder="What is Next.js 15?"
                                className="w-full p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-bold outline-none"
                              />

                              <textarea
                                id={`faq-answer-${idx}`}
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
                          id="author-input"
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
                          id="content-type-select"
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
                          id="primary-section-select"
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
                        <div className="relative rounded-xl overflow-hidden aspect-[1200/630] border border-zinc-200 dark:border-white/10">
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
                          <span className="text-[10px] text-zinc-400">1200×630 (PNG, JPG, WebP up to 5MB)</span>
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
                          id="cover-image-input"
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
      <footer className="bg-white dark:bg-[#12151c] border-t border-zinc-200/80 dark:border-white/10 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-zinc-400 font-mono select-none">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span className="hidden sm:inline">{charCount.toLocaleString()} characters</span>
          <span className="hidden sm:inline">•</span>
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

          <button
            type="button"
            onClick={() => setShortcutsModalOpen(true)}
            className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Keyboard Shortcuts Cheat Sheet (Ctrl+/)"
            aria-label="Keyboard Shortcuts Cheat Sheet"
          >
            <Keyboard className="w-3 h-3" />
            <span>Ctrl + /</span>
          </button>
        </div>
      </footer>

      {/* 5. MODAL: KEYBOARD SHORTCUTS CHEAT SHEET */}
      <AnimatePresence>
        {shortcutsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="shortcuts-dialog-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-red-600" />
                  <h3 id="shortcuts-dialog-title" className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                    Editorial Workstation Keyboard Shortcuts
                  </h3>
                </div>
                <button onClick={() => setShortcutsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white" aria-label="Close shortcuts dialog">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Save Draft</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Ctrl + S</kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Publish Story</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Ctrl + Enter</kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Toggle Preview</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Ctrl + Shift + P</kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Toggle Inspector</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Ctrl + Shift + I</kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Shortcuts Cheat Sheet</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Ctrl + /</kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Close Modal / Drawer</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Esc</kbd>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShortcutsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: INSERT IMAGE */}
      <AnimatePresence>
        {activeModal === 'image' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="image-modal-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  <h3 id="image-modal-title" className="font-display text-sm font-bold text-zinc-900 dark:text-white">
                    Insert Image in Story
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white" aria-label="Close image modal">
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

      {/* 7. MODAL: INSERT LINK */}
      <AnimatePresence>
        {activeModal === 'link' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="link-modal-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  <h3 id="link-modal-title" className="font-display text-sm font-bold text-zinc-900 dark:text-white">
                    Insert Hyperlink
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white" aria-label="Close link modal">
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

      {/* 8. PUBLICATION READINESS / GATE PANEL MODAL */}
      <AnimatePresence>
        {readinessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="readiness-modal-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${readiness.canPublish ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    {readiness.canPublish ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 id="readiness-modal-title" className="font-display text-base font-bold text-zinc-900 dark:text-white">
                      {readiness.canPublish ? 'Article Ready for Publication' : "Article Isn't Ready to Publish"}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {readiness.canPublish
                        ? 'All mandatory editorial and SEO requirements have been satisfied.'
                        : 'Please resolve the following critical items before publishing.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReadinessModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                  aria-label="Close publication readiness modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Blocking Issues */}
                {readiness.blockingIssues.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500 block">
                      Blocking Requirements ({readiness.blockingIssues.length})
                    </span>
                    <div className="space-y-2">
                      {readiness.blockingIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold">✕</span>
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100">{issue.label}</p>
                              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">{issue.message}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFixIssue(issue)}
                            className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white font-bold text-[11px] shrink-0 transition-colors"
                          >
                            Fix Issue ↗
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {readiness.warnings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 block">
                      Recommendations ({readiness.warnings.length})
                    </span>
                    <div className="space-y-2">
                      {readiness.warnings.map((w) => (
                        <div
                          key={w.id}
                          className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">⚠</span>
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100">{w.label}</p>
                              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">{w.message}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFixIssue(w)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white font-bold text-[11px] shrink-0 transition-colors"
                          >
                            Inspect ↗
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Items */}
                {readiness.completed.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-white/5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 block">
                      Completed Checklist ({readiness.completed.length})
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {readiness.completed.map((c) => (
                        <div key={c.id} className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setReadinessModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                {readiness.canPublish ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReadinessModalOpen(false);
                      handlePublishClick();
                    }}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Proceed to Publish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFixIssue(readiness.blockingIssues[0])}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Fix First Issue: {readiness.blockingIssues[0]?.label}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. PUBLISH CONFIRMATION MODAL (When Valid) */}
      <AnimatePresence>
        {publishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600">
                  Ready to Publish
                </span>
                <h3 id="publish-modal-title" className="font-display text-xl font-bold text-zinc-900 dark:text-white">
                  Publish Story to TeachyBlogs?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                  This article is validated and ready. Publishing makes it immediately accessible across public editorial feeds, search indexes, and RSS.
                </p>
              </div>

              {/* Pre-flight checklist preview */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-medium">
                  <span>Headline & Markdown Body</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-medium">
                  <span>Author & Desk Classification</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-medium">
                  <span>Cover Image & SEO Metadata</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-medium">
                  <span>Structured FAQ Schema ({formData.faqs?.length || 0} items)</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
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
