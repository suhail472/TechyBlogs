'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Link2,
  Image as ImageIcon,
  Minus,
  CheckCircle2,
  Copy,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Tag,
  Globe,
  Bookmark,
  History,
  RotateCcw,
  Star,
  Check,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { postAPI, taxonomyAPI, authorAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { extractHeadings } from '@/utils/markdownEngine';
import katex from 'katex';

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

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'Urdu (اردو)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'ks', label: 'Kashmiri (کٲشُر)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
];

export default function BlogEditor({ id }) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Editor View Modes: 'split' (dual-pane), 'write' (source only), 'preview' (full preview)
  const [viewMode, setViewMode] = useState('split');
  const [zenMode, setZenMode] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('settings'); // 'settings', 'taxonomy', 'contextual', 'revisions', 'seo', 'outline', 'faqs'

  // Multi-Dimensional Taxonomy & Relations
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableContentTypes, setAvailableContentTypes] = useState([]);
  const [availableSeries, setAvailableSeries] = useState([]);
  const [availableCoverage, setAvailableCoverage] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [revisionsList, setRevisionsList] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Autosave State
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localBackupAvailable, setLocalBackupAvailable] = useState(false);
  const [debouncedContent, setDebouncedContent] = useState('');

  // Textarea Ref for cursor insertion
  const textareaRef = useRef(null);

  // Modal Assistants
  const [activeModal, setActiveModal] = useState(null); // 'table', 'math', 'mermaid', 'callout', 'quiz', 'image', 'link'

  // Modal States
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3, align: 'left', hasHeader: true });
  const [mathConfig, setMathConfig] = useState({ formula: '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', display: true });
  const [mermaidConfig, setMermaidConfig] = useState({
    type: 'flowchart',
    code: 'graph TD\n    A[User Request] --> B[Next.js Server Component]\n    B --> C[MongoDB Database]\n    C --> B\n    B --> D[Streaming HTML to Client]',
  });
  const [calloutConfig, setCalloutConfig] = useState({ type: 'note', title: '', content: 'Enter the important note details here.' });
  const [quizConfig, setQuizConfig] = useState({
    question: 'What is the primary benefit of React Server Components?',
    options: ['Zero client bundle size for server-rendered code', 'Faster CSS compilation', 'Automatic database creation', 'Better local storage sync'],
    answer: 0,
  });
  const [imageModalConfig, setImageModalConfig] = useState({ url: '', alt: '', caption: '', alignment: 'center' });
  const [linkConfig, setLinkConfig] = useState({ url: '', text: '', openInNewTab: true });

  // Source builder input states
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceType, setNewSourceType] = useState('official');

  // Review pros/cons input states
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    contentType: 'article',
    primaryTopic: '',
    topics: [],
    primaryRegion: '',
    regions: [],
    tags: [],
    language: 'en',
    series: '',
    seriesOrder: 1,
    coverage: '',
    sources: [],
    editorial: {
      breaking: false,
      locationName: '',
      correction: { hasCorrection: false, note: '', correctedAt: null },
    },
    reviewData: { rating: 4.5, pros: [], cons: [], entityName: '' },
    tutorialData: { difficulty: 'intermediate', prerequisites: [], technologies: [] },
    primaryAuthor: '',
    categories: ['Technology'],
    status: 'draft',
    scheduledAt: '',
    featured: false,
    faqs: [],
    metaDescription: '',
    keywords: '',
    seo: {
      title: '',
      description: '',
      canonicalUrl: '',
      socialTitle: '',
      socialDescription: '',
      indexable: true,
    },
    changeSummary: '',
  });

  // Fetch initial taxonomies and existing article
  useEffect(() => {
    fetchMetadata();
    if (id) {
      fetchBlog();
      fetchRevisions();
    } else {
      checkLocalBackup('new');
    }
  }, [id]);

  const checkLocalBackup = (postId) => {
    try {
      const backup = localStorage.getItem(`teachy_draft_${postId}`);
      if (backup) {
        setLocalBackupAvailable(true);
      }
    } catch (e) {}
  };

  const restoreLocalBackup = () => {
    try {
      const backup = localStorage.getItem(`teachy_draft_${id || 'new'}`);
      if (backup) {
        const parsed = JSON.parse(backup);
        setFormData((prev) => ({ ...prev, ...parsed }));
        setImagePreview(parsed.image || null);
        setLocalBackupAvailable(false);
        addToast({ message: 'Local draft backup restored successfully', type: 'success' });
      }
    } catch (err) {
      addToast({ message: 'Failed to restore backup: ' + err.message, type: 'error' });
    }
  };

  const discardLocalBackup = () => {
    try {
      localStorage.removeItem(`teachy_draft_${id || 'new'}`);
      setLocalBackupAvailable(false);
      addToast({ message: 'Local backup discarded', type: 'info' });
    } catch (e) {}
  };

  // Periodic Local Draft Autosave
  useEffect(() => {
    if (!formData.title && !formData.content) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`teachy_draft_${id || 'new'}`, JSON.stringify(formData));
        setLastSavedTime(new Date());
      } catch (e) {}
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, id]);

  // Debounced live preview content (120ms) for high-performance 60fps typing on large documents
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(formData.content);
    }, 120);
    return () => clearTimeout(timer);
  }, [formData.content]);

  const fetchMetadata = async () => {
    try {
      const [topRes, regRes, ctRes, serRes, covRes, authRes] = await Promise.all([
        taxonomyAPI.getAll({ kind: 'topic' }),
        taxonomyAPI.getAll({ kind: 'region' }),
        taxonomyAPI.getAll({ kind: 'content_type' }),
        taxonomyAPI.getAll({ kind: 'series' }),
        taxonomyAPI.getAll({ kind: 'coverage' }),
        authorAPI.getAll(),
      ]);
      if (topRes.success) setAvailableTopics(topRes.data || []);
      if (regRes.success) setAvailableRegions(regRes.data || []);
      if (ctRes.success) setAvailableContentTypes(ctRes.data || []);
      if (serRes.success) setAvailableSeries(serRes.data || []);
      if (covRes.success) setAvailableCoverage(covRes.data || []);
      if (authRes.success) setAvailableAuthors(authRes.data || []);
    } catch (err) {
      console.error('Failed to load editorial taxonomy:', err);
    }
  };

  const fetchRevisions = async () => {
    if (!id) return;
    setLoadingRevisions(true);
    try {
      const res = await postAPI.getRevisions(id);
      if (res.success) {
        setRevisionsList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load revisions:', err);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const fetchBlog = async () => {
    try {
      const post = await postAPI.getPostById(id);
      if (post) {
        setFormData({
          title: post.title || '',
          subtitle: post.subtitle || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          image: post.image || '',
          contentType: post.contentType || 'article',
          primaryTopic: post.primaryTopic?._id || post.primaryTopic || '',
          topics: (post.topics || []).map((t) => t._id || t),
          primaryRegion: post.primaryRegion?._id || post.primaryRegion || '',
          regions: (post.regions || []).map((r) => r._id || r),
          tags: post.tags || [],
          language: post.language || 'en',
          series: post.series?._id || post.series || '',
          seriesOrder: post.seriesOrder || 1,
          coverage: post.coverage?._id || post.coverage || '',
          sources: post.sources || [],
          editorial: {
            breaking: post.editorial?.breaking || post.breaking || false,
            locationName: post.editorial?.locationName || '',
            correction: post.editorial?.correction || { hasCorrection: false, note: '', correctedAt: null },
          },
          reviewData: post.reviewData || { rating: 4.5, pros: [], cons: [], entityName: '' },
          tutorialData: post.tutorialData || { difficulty: 'intermediate', prerequisites: [], technologies: [] },
          primaryAuthor: post.primaryAuthor?._id || post.primaryAuthor || '',
          categories: post.categories || ['Technology'],
          status: post.status || 'draft',
          scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
          featured: post.featured || false,
          faqs: post.faqs || [],
          metaDescription: post.metaDescription || '',
          keywords: post.keywords || '',
          seo: {
            title: post.seo?.title || '',
            description: post.seo?.description || '',
            canonicalUrl: post.seo?.canonicalUrl || '',
            socialTitle: post.seo?.socialTitle || '',
            socialDescription: post.seo?.socialDescription || '',
            indexable: post.seo?.indexable ?? true,
          },
          changeSummary: '',
        });
        setImagePreview(post.image || null);
        setIsSlugManual(true);
      }
    } catch (err) {
      addToast({ message: 'Failed to fetch article: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreRevision = async (version) => {
    if (!window.confirm(`Are you sure you want to restore revision version v${version}? Current unsaved content will be overwritten.`)) {
      return;
    }
    try {
      const res = await postAPI.restoreRevision(id, version);
      if (res.success) {
        addToast({ message: `Restored revision v${version}`, type: 'success' });
        fetchBlog();
        fetchRevisions();
      }
    } catch (err) {
      addToast({ message: 'Rollback failed: ' + err.message, type: 'error' });
    }
  };

  // Auto-generate slug from title if not manually customized
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, title };
      if (!isSlugManual) {
        next.slug = title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Image Upload via Cloudinary / Local API
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Please upload an image file', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast({ message: 'Image size should be less than 5MB', type: 'error' });
      return;
    }

    setImageUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setImagePreview(data.url);
        setFormData((prev) => ({ ...prev, image: data.url }));
        setHasUnsavedChanges(true);
        addToast({ message: 'Cover image uploaded successfully', type: 'success' });
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      addToast({ message: err.message || 'Failed to upload image', type: 'error' });
    } finally {
      setImageUploading(false);
    }
  };

  // Tags Management
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,|,$/g, '');
      if (val && !formData.tags.includes(val)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, val] }));
        setTagInput('');
        setHasUnsavedChanges(true);
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  // Sources Management
  const handleAddSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      addToast({ message: 'Source name and valid URL are required', type: 'error' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sources: [...prev.sources, { name: newSourceName.trim(), url: newSourceUrl.trim(), type: newSourceType, accessedAt: new Date() }],
    }));
    setNewSourceName('');
    setNewSourceUrl('');
    setHasUnsavedChanges(true);
  };

  const handleRemoveSource = (index) => {
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  };

  // Review Pros/Cons Management
  const handleAddPro = () => {
    if (!newPro.trim()) return;
    setFormData((prev) => ({
      ...prev,
      reviewData: { ...prev.reviewData, pros: [...prev.reviewData.pros, newPro.trim()] },
    }));
    setNewPro('');
    setHasUnsavedChanges(true);
  };

  const handleAddCon = () => {
    if (!newCon.trim()) return;
    setFormData((prev) => ({
      ...prev,
      reviewData: { ...prev.reviewData, cons: [...prev.reviewData.cons, newCon.trim()] },
    }));
    setNewCon('');
    setHasUnsavedChanges(true);
  };

  // Textarea Cursor Helpers
  const insertTextAtCursor = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = formData.content;
    const selection = previousContent.substring(start, end);

    const replacement = before + selection + after;
    const newContent = previousContent.substring(0, start) + replacement + previousContent.substring(end);

    setFormData((prev) => ({ ...prev, content: newContent }));
    setHasUnsavedChanges(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // Keyboard Shortcuts
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertTextAtCursor('**', '**');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertTextAtCursor('*', '*');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setActiveModal('link');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave(formData.status);
    }
  };

  // Main Submit Action
  const handleSave = async (targetStatus = 'draft') => {
    if (!formData.title.trim()) {
      addToast({ message: 'Title is required', type: 'error' });
      return;
    }
    if (!formData.content.trim()) {
      addToast({ message: 'Content is required', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
        metaDescription: formData.seo.description || formData.excerpt,
        categories: formData.categories.length ? formData.categories : ['Technology'],
      };

      if (id) {
        await postAPI.updatePost(id, payload);
        addToast({ message: `Article updated as ${targetStatus}`, type: 'success' });
        fetchRevisions();
      } else {
        const created = await postAPI.createPost(payload);
        addToast({ message: `Article created as ${targetStatus}`, type: 'success' });
        localStorage.removeItem('teachy_draft_new');
        router.push(`/admin/edit/${created._id}`);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      addToast({ message: err.message || 'Saving failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const wordCount = useMemo(() => {
    return formData.content.trim().split(/\s+/).filter(Boolean).length;
  }, [formData.content]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const headingsOutline = useMemo(() => {
    return extractHeadings(formData.content);
  }, [formData.content]);

  return (
    <div className={`min-h-screen bg-zinc-50 dark:bg-[#0b0f19] text-zinc-900 dark:text-zinc-100 ${zenMode ? 'fixed inset-0 z-50 overflow-hidden' : 'pt-24 pb-20'}`}>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-black font-display truncate max-w-sm md:max-w-md">
              {formData.title || 'Untitled Story'}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="capitalize font-semibold text-indigo-500">{formData.contentType}</span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{readingTime}m read</span>
              {lastSavedTime && (
                <>
                  <span>•</span>
                  <span className="text-emerald-500 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Saved locally
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'write' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'split' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}
            >
              Preview
            </button>
          </div>

          <button
            type="button"
            onClick={() => setZenMode(!zenMode)}
            className={`p-2 rounded-xl border transition-colors ${zenMode ? 'bg-indigo-600 text-white border-indigo-600' : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            title="Zen Mode"
          >
            {zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={submitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {localBackupAvailable && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>A newer unsaved local draft is available from your previous writing session.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreLocalBackup}
                className="px-3 py-1 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={discardLocalBackup}
                className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Writing Area */}
          <div className={viewMode === 'preview' ? 'lg:col-span-12' : 'lg:col-span-8 space-y-6'}>
            {/* Title & Subtitle */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 space-y-4 shadow-sm">
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Story Title..."
                className="w-full text-2xl md:text-3xl font-black font-display bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-zinc-400"
              />
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, subtitle: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="Subtitle or narrative hook (optional)..."
                className="w-full text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-zinc-400"
              />
            </div>

            {/* Markdown Toolbar */}
            {viewMode !== 'preview' && (
              <div className="sticky top-[69px] z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/10 p-2.5 flex flex-wrap items-center gap-1 shadow-sm">
                {/* Headings */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-200 dark:border-white/10">
                  <button type="button" onClick={() => insertTextAtCursor('# ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('## ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('### ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('#### ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Heading 4"><Heading4 className="w-4 h-4" /></button>
                </div>

                {/* Inline Formatting */}
                <div className="flex items-center gap-0.5 px-2 border-r border-zinc-200 dark:border-white/10">
                  <button type="button" onClick={() => insertTextAtCursor('**', '**')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Bold (Ctrl+B)"><Bold className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('*', '*')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Italic (Ctrl+I)"><Italic className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('~~', '~~')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('`', '`')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Inline Code"><Code className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('> ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Blockquote"><Quote className="w-4 h-4" /></button>
                </div>

                {/* Lists */}
                <div className="flex items-center gap-0.5 px-2 border-r border-zinc-200 dark:border-white/10">
                  <button type="button" onClick={() => insertTextAtCursor('- ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Bullet List"><List className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('1. ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('- [ ] ', '\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Task List"><CheckSquare className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertTextAtCursor('\n---\n\n')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Horizontal Divider"><Minus className="w-4 h-4" /></button>
                </div>

                {/* Rich Modal Inserters */}
                <div className="flex items-center gap-1 pl-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal('table')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <TableIcon className="w-3.5 h-3.5" /> Table
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('math')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Sigma className="w-3.5 h-3.5" /> Math LaTeX
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('mermaid')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5" /> Diagram
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('callout')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" /> Callout
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('quiz')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Quiz
                  </button>
                </div>
              </div>
            )}

            {/* Split Dual-Pane Mode */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Markdown Input Area */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 flex flex-col shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Markdown Source</span>
                    <span className="text-[10px] font-mono">GFM + Math + Mermaid</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={formData.content}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, content: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Write article in Markdown... (Headings, GFM tables, math $$, diagrams ```mermaid, callouts :::note)"
                    className="flex-1 p-5 font-mono text-sm leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-h-[600px]"
                  />
                </div>

                {/* Live Rendered Preview Pane */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 flex flex-col shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Live High-Fidelity Preview</span>
                    <span className="text-indigo-500 font-semibold">Real-time</span>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto max-h-[750px]">
                    <MarkdownRenderer content={debouncedContent} />
                  </div>
                </div>
              </div>
            )}

            {/* Single Pane Write Mode */}
            {viewMode === 'write' && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 flex flex-col shadow-sm overflow-hidden min-h-[650px]">
                <textarea
                  ref={textareaRef}
                  value={formData.content}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, content: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Write article in Markdown... (Headings, GFM tables, math $$, diagrams ```mermaid, callouts :::note)"
                  className="flex-1 p-6 font-mono text-sm leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-h-[650px]"
                />
              </div>
            )}

            {/* Single Pane Full Preview Mode */}
            {viewMode === 'preview' && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-8 md:p-12 shadow-sm max-w-4xl mx-auto">
                <header className="mb-10 pb-8 border-b border-zinc-200 dark:border-white/10 space-y-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="" className="w-full aspect-[16/9] rounded-2xl object-cover shadow-lg mb-6" />
                  )}
                  <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
                    {formData.title || 'Untitled Story'}
                  </h1>
                  {formData.subtitle && (
                    <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                      {formData.subtitle}
                    </p>
                  )}
                </header>
                <MarkdownRenderer content={debouncedContent} />
              </div>
            )}
          </div>

          {/* Publishing & Settings Sidebar */}
          {viewMode !== 'preview' && (
            <div className="lg:col-span-4 space-y-6">
              {/* Sidebar Tab Selector */}
              <div className="bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl flex flex-wrap items-center justify-between text-xs font-bold gap-1">
                {[
                  { id: 'settings', label: 'Settings' },
                  { id: 'taxonomy', label: 'Taxonomy' },
                  { id: 'contextual', label: 'Editorial' },
                  { id: 'revisions', label: 'Revisions' },
                  { id: 'seo', label: 'SEO' },
                  { id: 'outline', label: 'TOC' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSidebarTab(tab.id)}
                    className={`flex-1 py-2 px-2.5 rounded-xl transition-all text-center ${
                      activeSidebarTab === tab.id
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Story Settings */}
              {activeSidebarTab === 'settings' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 space-y-6 shadow-sm">
                  {/* Status & Publication */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Publishing Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
                    >
                      <option value="draft">Draft (Private)</option>
                      <option value="in_review">In Review (Editorial)</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published (Public)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {/* Primary Author */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Author Profile</label>
                    <select
                      value={formData.primaryAuthor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryAuthor: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
                    >
                      <option value="">Select Author</option>
                      {availableAuthors.map((author) => (
                        <option key={author._id} value={author._id}>{author.name} ({author.role || 'Author'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Featured Image */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Cover Image</label>
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-zinc-200 dark:border-white/10 mb-3">
                        <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData((prev) => ({ ...prev, image: '' }));
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors mb-3">
                        {imageUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                            <span className="text-xs font-bold">Upload Cover Image</span>
                            <span className="text-[10px] text-zinc-400">PNG, JPG, WebP up to 5MB</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, image: e.target.value }));
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder="Or paste image URL..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    />
                  </div>

                  {/* Flags (Featured & Breaking) */}
                  <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-white/10">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Feature on Homepage Hero</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-red-600 dark:text-red-400">
                      <input
                        type="checkbox"
                        checked={formData.editorial.breaking}
                        onChange={(e) => setFormData((prev) => ({ ...prev, editorial: { ...prev.editorial, breaking: e.target.checked } }))}
                        className="rounded border-zinc-300 text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Mark as Breaking News Ticker</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Multi-Dimensional Taxonomy */}
              {activeSidebarTab === 'taxonomy' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 space-y-5 shadow-sm">
                  {/* Content Type */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Content Type</label>
                    <select
                      value={formData.contentType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contentType: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
                    >
                      {CONTENT_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Primary Topic */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Primary Topic</span>
                    </label>
                    <select
                      value={formData.primaryTopic}
                      onChange={(e) => {
                        const topId = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          primaryTopic: topId,
                          topics: topId ? Array.from(new Set([...prev.topics, topId])) : prev.topics,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
                    >
                      <option value="">Select Primary Topic</option>
                      {availableTopics.map((top) => (
                        <option key={top._id} value={top._id}>
                          {top.ancestors?.length ? `${top.ancestors.map((a) => a.name).join(' → ')} → ` : ''}
                          {top.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Primary Region / Geography */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Primary Region / Location</span>
                    </label>
                    <select
                      value={formData.primaryRegion}
                      onChange={(e) => {
                        const regId = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          primaryRegion: regId,
                          regions: regId ? Array.from(new Set([...prev.regions, regId])) : prev.regions,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
                    >
                      <option value="">Select Primary Region</option>
                      {availableRegions.map((reg) => (
                        <option key={reg._id} value={reg._id}>
                          {reg.ancestors?.length ? `${reg.ancestors.map((a) => a.name).join(' → ')} → ` : ''}
                          {reg.name} {reg.isHub ? '⭐ (Hub)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>Article Language</span>
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
                    >
                      {LANGUAGES.map((lng) => (
                        <option key={lng.code} value={lng.code}>{lng.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Series */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-purple-500" />
                      <span>Series (Optional)</span>
                    </label>
                    <select
                      value={formData.series}
                      onChange={(e) => setFormData((prev) => ({ ...prev, series: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold mb-2"
                    >
                      <option value="">— Not in a series —</option>
                      {availableSeries.map((ser) => (
                        <option key={ser._id} value={ser._id}>{ser.name || ser.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Tags</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type tag and press Enter..."
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs mb-2"
                    />
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-medium"
                        >
                          <span>#{tag}</span>
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Contextual Editorial Fields */}
              {activeSidebarTab === 'contextual' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 space-y-6 shadow-sm">
                  {/* News Fields */}
                  {formData.contentType === 'news' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 font-display flex items-center gap-1.5">
                        <Radio className="w-4 h-4" /> News Editorial Metadata
                      </h4>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Dateline / Reporting Location</label>
                        <input
                          type="text"
                          value={formData.editorial.locationName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, editorial: { ...prev.editorial, locationName: e.target.value } }))}
                          placeholder="e.g. Srinagar, New Delhi"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                        />
                      </div>

                      {/* Sources Builder */}
                      <div className="pt-2 border-t border-zinc-200 dark:border-white/10">
                        <label className="block text-xs font-bold text-zinc-400 mb-2">Sources & Attribution</label>
                        <div className="space-y-2 mb-3">
                          <input
                            type="text"
                            value={newSourceName}
                            onChange={(e) => setNewSourceName(e.target.value)}
                            placeholder="Source Name (e.g. University Bulletin)"
                            className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                          />
                          <input
                            type="url"
                            value={newSourceUrl}
                            onChange={(e) => setNewSourceUrl(e.target.value)}
                            placeholder="Source URL (https://...)"
                            className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddSource}
                            className="w-full py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-100"
                          >
                            + Add Source
                          </button>
                        </div>
                        {formData.sources.map((src, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs mb-1.5">
                            <div className="truncate mr-2">
                              <span className="font-bold">{src.name}</span>
                              <span className="text-[10px] text-zinc-400 block truncate">{src.url}</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveSource(i)} className="text-red-500 hover:text-red-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Editorial Correction Note */}
                      <div className="pt-2 border-t border-zinc-200 dark:border-white/10">
                        <label className="flex items-center gap-2 text-xs font-bold mb-2">
                          <input
                            type="checkbox"
                            checked={formData.editorial.correction?.hasCorrection}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                editorial: {
                                  ...prev.editorial,
                                  correction: { ...prev.editorial.correction, hasCorrection: e.target.checked, correctedAt: new Date() },
                                },
                              }))
                            }
                            className="rounded border-zinc-300 text-amber-500"
                          />
                          <span>Attach Editorial Correction Note</span>
                        </label>
                        {formData.editorial.correction?.hasCorrection && (
                          <textarea
                            rows={2}
                            value={formData.editorial.correction?.note || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                editorial: { ...prev.editorial, correction: { ...prev.editorial.correction, note: e.target.value } },
                              }))
                            }
                            placeholder="State what was corrected and when..."
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tutorial Fields */}
                  {formData.contentType === 'tutorial' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 font-display flex items-center gap-1.5">
                        <Code className="w-4 h-4" /> Tutorial Metadata
                      </h4>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Difficulty Level</label>
                        <select
                          value={formData.tutorialData?.difficulty || 'intermediate'}
                          onChange={(e) => setFormData((prev) => ({ ...prev, tutorialData: { ...prev.tutorialData, difficulty: e.target.value } }))}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="all-levels">All Levels</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Review Fields */}
                  {formData.contentType === 'review' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 font-display flex items-center gap-1.5">
                        <Star className="w-4 h-4" /> Review Scorecard
                      </h4>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Entity / Product Name</label>
                        <input
                          type="text"
                          value={formData.reviewData?.entityName || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, reviewData: { ...prev.reviewData, entityName: e.target.value } }))}
                          placeholder="e.g. Next.js 15, MacBook Pro M4"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Rating (0 - 5 Stars): {formData.reviewData?.rating || 4.5}</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={formData.reviewData?.rating || 4.5}
                          onChange={(e) => setFormData((prev) => ({ ...prev, reviewData: { ...prev.reviewData, rating: parseFloat(e.target.value) } }))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Standard Note for generic articles */}
                  {!['news', 'tutorial', 'review'].includes(formData.contentType) && (
                    <div className="text-xs text-zinc-400 py-6 text-center">
                      <Info className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                      <p>No special contextual fields required for this content format.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Version Revisions */}
              {activeSidebarTab === 'revisions' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-display flex items-center gap-1.5">
                      <History className="w-4 h-4" /> Version Snapshots ({revisionsList.length})
                    </h3>
                    <button type="button" onClick={fetchRevisions} className="text-xs text-indigo-500 hover:text-indigo-600">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingRevisions ? (
                    <div className="py-8 text-center text-xs text-zinc-400">Loading version history...</div>
                  ) : revisionsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400 italic">No previous revisions recorded yet. Revisions are created automatically upon save and publish.</div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {revisionsList.map((rev) => (
                        <div key={rev.version} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">v{rev.version}</span>
                            <span className="text-[10px] text-zinc-400">{new Date(rev.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-2">{rev.changeSummary || 'Content updated'}</p>
                          <button
                            type="button"
                            onClick={() => handleRestoreRevision(rev.version)}
                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-[10px] hover:bg-indigo-100 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore this version
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: SEO & Meta */}
              {activeSidebarTab === 'seo' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 space-y-4 shadow-sm">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Custom Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setIsSlugManual(true);
                        setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Meta Description (160 chars)</label>
                    <textarea
                      value={formData.seo.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, description: e.target.value } }))}
                      rows={3}
                      maxLength={180}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    />
                    <div className="text-[10px] text-right text-zinc-400 mt-1">{formData.seo.description.length}/180</div>
                  </div>
                </div>
              )}

              {/* Tab 6: Document Outline */}
              {activeSidebarTab === 'outline' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 space-y-4 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-display">
                    Document Headings Outline ({headingsOutline.length})
                  </h3>
                  {headingsOutline.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">No headings detected. Use # H1, ## H2, ### H3 in your markdown to generate the Table of Contents.</p>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      {headingsOutline.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 py-1 text-zinc-600 dark:text-zinc-300"
                          style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                        >
                          <span className="font-mono text-[10px] text-indigo-500 font-bold">H{h.level}</span>
                          <span className="truncate">{h.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
