'use client';

import { useEffect, useState, useMemo } from 'react';
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
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Eye,
  FileText,
  Star,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { postAPI, taxonomyAPI, authorAPI, workflowAPI } from '@/services/api';
import { getCookie } from '@/lib/cookies';
import dynamic from 'next/dynamic';
import BlogPreview from './BlogPreview';
import useToastStore from '@/store/useToastStore';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse flex items-center justify-center text-xs font-bold text-zinc-400">Loading Rich Editorial Editor...</div>,
});
import 'react-quill-new/dist/quill.snow.css';

const CONTENT_TYPES = [
  { id: 'article', label: 'Standard Article', desc: 'In-depth longform technical or general writing' },
  { id: 'news', label: 'News / Reporting', desc: 'Timely reporting, breaking stories, and updates' },
  { id: 'tutorial', label: 'Technical Tutorial', desc: 'Code-heavy step-by-step guides with difficulty levels' },
  { id: 'guide', label: 'Comprehensive Guide', desc: 'Educational how-tos and regional travel guides' },
  { id: 'review', label: 'Product / Tech Review', desc: 'Hardware, software, and gear reviews with scorecards' },
  { id: 'opinion', label: 'Opinion & Editorial', desc: 'Columnist essays and perspectives' },
  { id: 'analysis', label: 'Deep Analysis', desc: 'Data-driven insights, policy, and industry analysis' },
  { id: 'feature', label: 'Feature Story', desc: 'Spotlights, interviews, and investigative reports' },
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

  // Taxonomy & Authors
  const [availableSections, setAvailableSections] = useState([]);
  const [availableEditions, setAvailableEditions] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);

  // Autosave & Tabs
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('edit');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    contentType: 'article',
    primarySection: '',
    editions: [],
    topics: [],
    primaryAuthor: '',
    categories: ['Technology'],
    tags: [],
    status: 'draft',
    scheduledAt: '',
    featured: false,
    breaking: false,
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
    // Type specific metadata
    source: { name: '', url: '' },
    correction: { text: '', date: '' },
    editorNote: '',
    reviewMetadata: { rating: 4.5, pros: [], cons: [], verdict: '' },
    tutorialMetadata: { difficulty: 'Intermediate', prerequisites: [], estimatedTime: '15 mins' },
  });

  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [newPrereq, setNewPrereq] = useState('');

  useEffect(() => {
    fetchMetadata();
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchMetadata = async () => {
    try {
      const [secRes, edRes, topRes, authRes] = await Promise.all([
        taxonomyAPI.getAll({ kind: 'section' }),
        taxonomyAPI.getAll({ kind: 'edition' }),
        taxonomyAPI.getAll({ kind: 'topic' }),
        authorAPI.getAll(),
      ]);
      if (secRes.success) setAvailableSections(secRes.data || []);
      if (edRes.success) setAvailableEditions(edRes.data || []);
      if (topRes.success) setAvailableTopics(topRes.data || []);
      if (authRes.success) setAvailableAuthors(authRes.data || []);
    } catch (err) {
      console.error('Failed to load editorial taxonomy:', err);
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
          primarySection: post.primarySection?._id || post.primarySection || '',
          editions: (post.editions || []).map((e) => e._id || e),
          topics: (post.topics || []).map((t) => t._id || t),
          primaryAuthor: post.primaryAuthor?._id || post.primaryAuthor || '',
          categories: post.categories || ['Technology'],
          tags: post.tags || [],
          status: post.status || 'draft',
          scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
          featured: post.featured || false,
          breaking: post.breaking || false,
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
          source: post.source || { name: '', url: '' },
          correction: post.correction || { text: '', date: '' },
          editorNote: post.editorNote || '',
          reviewMetadata: post.contentMetadata?.reviewMetadata || { rating: 4.5, pros: [], cons: [], verdict: '' },
          tutorialMetadata: post.contentMetadata?.tutorialMetadata || { difficulty: 'Intermediate', prerequisites: [], estimatedTime: '15 mins' },
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

  // Auto-generate slug when title changes
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: isSlugManual ? prev.slug : val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  // Featured image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'techyblogs_preset');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/du1vfgqcf/image/upload`, {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, image: data.secure_url }));
        setImagePreview(data.secure_url);
        addToast({ message: 'Cover image uploaded', type: 'success' });
      }
    } catch (err) {
      addToast({ message: 'Image upload failed', type: 'error' });
    } finally {
      setImageUploading(false);
    }
  };

  // Tag helpers
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (t) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== t) }));
  };

  // FAQ helpers
  const handleAddFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }],
    }));
  };

  const handleUpdateFaq = (index, field, value) => {
    const updated = [...formData.faqs];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, faqs: updated }));
  };

  const handleRemoveFaq = (index) => {
    setFormData((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

  // Submit story
  const handleSave = async (targetStatus = 'draft') => {
    if (!formData.title.trim()) {
      addToast({ message: 'Title is required', type: 'error' });
      return;
    }
    if (!formData.excerpt.trim()) {
      addToast({ message: 'Excerpt is required', type: 'error' });
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
        contentMetadata: {
          reviewMetadata: formData.reviewMetadata,
          tutorialMetadata: formData.tutorialMetadata,
        },
        metaDescription: formData.seo.description || formData.excerpt,
        categories: formData.categories.length ? formData.categories : ['Technology'],
      };

      if (id) {
        await postAPI.updatePost(id, payload);
        addToast({ message: `Article saved as ${targetStatus}`, type: 'success' });
      } else {
        const created = await postAPI.createPost(payload);
        addToast({ message: `Article created as ${targetStatus}`, type: 'success' });
        router.push(`/admin/edit/${created._id}`);
      }
    } catch (err) {
      addToast({ message: err.message || 'Saving failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // SEO Quality Checklist Calculations
  const seoChecklist = useMemo(() => {
    const titleLen = formData.seo.title.length || formData.title.length;
    const metaLen = (formData.seo.description || formData.metaDescription || formData.excerpt).length;
    const hasImage = !!formData.image;
    const hasSection = !!formData.primarySection || formData.categories.length > 0;
    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

    return [
      { label: 'Title Length (50–65 chars)', valid: titleLen >= 40 && titleLen <= 70, note: `${titleLen} characters` },
      { label: 'Meta Description (120–160 chars)', valid: metaLen >= 100 && metaLen <= 180, note: `${metaLen} characters` },
      { label: 'Featured Cover Image Present', valid: hasImage, note: hasImage ? 'Attached' : 'Missing cover' },
      { label: 'Primary Editorial Section Assigned', valid: hasSection, note: hasSection ? 'Assigned' : 'Unassigned' },
      { label: 'Editorial Content Depth (>300 words)', valid: wordCount >= 250, note: `${wordCount} words` },
    ];
  }, [formData]);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Loading Story Canvas...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10 sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl z-20 pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
              {id ? 'Edit Story' : 'New Editorial Story'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${formData.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Status: {formData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls & Workflow Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex bg-zinc-200/80 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-white/10 mr-2">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'edit' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-sm' : 'text-zinc-500'
              }`}
            >
              Compose
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-sm' : 'text-zinc-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>

          <button
            onClick={() => handleSave('draft')}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>

          <button
            onClick={() => handleSave('in_review')}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Submit Review
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Publish Story
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <BlogPreview blog={{ ...formData, createdAt: new Date() }} />
      ) : (
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Main Writing Canvas */}
          <div className="space-y-6">
            {/* Content Type Selector */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400 mb-3">
                Select Content Type / Template
              </label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, contentType: ct.id })}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      formData.contentType === ct.id
                        ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10 hover:border-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{ct.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{ct.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Headline & Dek */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400 mb-1.5">
                  Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Compelling, editorial headline..."
                  className="w-full px-5 py-3.5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-lg font-bold font-display focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400 mb-1.5">
                  Subtitle / Dek (Summary Standfirst)
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Secondary supporting headline or deck explaining context..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400 mb-1.5">
                  URL Slug (Permanent SEO Path)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">/blog/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                    placeholder="article-url-slug"
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400 mb-1.5">
                  Lead Excerpt (Feeds, Social Cards & SERP Preview) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="1-2 sentences summarizing the core story..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Rich Editorial Body */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400 mb-3">
                Story Content (Rich Editorial Canvas) *
              </label>
              <div className="quill-editor-wrapper">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image', 'video'],
                      ['clean'],
                    ],
                  }}
                  className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl text-zinc-900 dark:text-zinc-100 min-h-[350px]"
                />
              </div>
            </div>

            {/* Dynamic Type-Specific Metadata Panels */}
            {formData.contentType === 'news' && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <Flame className="w-4 h-4" /> News & Reporting Metadata
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Attributed Source Name</label>
                    <input
                      type="text"
                      value={formData.source?.name || ''}
                      onChange={(e) => setFormData({ ...formData, source: { ...formData.source, name: e.target.value } })}
                      placeholder="e.g. Official Government Release, Reuters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Source URL</label>
                    <input
                      type="url"
                      value={formData.source?.url || ''}
                      onChange={(e) => setFormData({ ...formData, source: { ...formData.source, url: e.target.value } })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Editor's Note / Correction</label>
                  <textarea
                    rows={2}
                    value={formData.editorNote || ''}
                    onChange={(e) => setFormData({ ...formData, editorNote: e.target.value })}
                    placeholder="Transparent editorial notes on revisions or developing coverage..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>
            )}

            {formData.contentType === 'review' && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                  <Star className="w-4 h-4" /> Review Scorecard
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Score Rating (1.0 - 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.reviewMetadata?.rating || 4.5}
                      onChange={(e) => setFormData({
                        ...formData,
                        reviewMetadata: { ...formData.reviewMetadata, rating: parseFloat(e.target.value) || 4.5 }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Final Verdict</label>
                    <input
                      type="text"
                      value={formData.reviewMetadata?.verdict || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        reviewMetadata: { ...formData.reviewMetadata, verdict: e.target.value }
                      })}
                      placeholder="e.g. The definitive M4 powerhouse for creators."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    />
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 mb-1">Pros</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newPro}
                        onChange={(e) => setNewPro(e.target.value)}
                        placeholder="Add positive highlight"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPro.trim()) return;
                          setFormData({
                            ...formData,
                            reviewMetadata: { ...formData.reviewMetadata, pros: [...(formData.reviewMetadata?.pros || []), newPro.trim()] }
                          });
                          setNewPro('');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {(formData.reviewMetadata?.pros || []).map((p, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          <span>+ {p}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              reviewMetadata: { ...formData.reviewMetadata, pros: formData.reviewMetadata.pros.filter((_, i) => i !== idx) }
                            })}
                            className="text-zinc-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-600 mb-1">Cons</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newCon}
                        onChange={(e) => setNewCon(e.target.value)}
                        placeholder="Add drawback or limitation"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCon.trim()) return;
                          setFormData({
                            ...formData,
                            reviewMetadata: { ...formData.reviewMetadata, cons: [...(formData.reviewMetadata?.cons || []), newCon.trim()] }
                          });
                          setNewCon('');
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {(formData.reviewMetadata?.cons || []).map((c, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                          <span>− {c}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              reviewMetadata: { ...formData.reviewMetadata, cons: formData.reviewMetadata.cons.filter((_, i) => i !== idx) }
                            })}
                            className="text-zinc-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ Builder */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-500" /> Interactive FAQs & Structured Data
                  </h3>
                  <p className="text-[11px] text-zinc-400">Generates FAQPage JSON-LD schema for Google rich results</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              {formData.faqs.map((faq, index) => (
                <div key={index} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Question {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="text-zinc-400 hover:text-rose-500 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                    placeholder="e.g. How does Next.js 15 improve caching?"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-bold"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                    placeholder="Clear answer..."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Organization, Publishing & SEO */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 space-y-3">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                Featured Cover Image *
              </label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 group">
                  <img src={imagePreview} alt="Cover" className="w-full h-44 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({ ...formData, image: '' });
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-zinc-50 dark:bg-zinc-950">
                  {imageUploading ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Upload to Cloudinary</span>
                      <span className="text-[10px] text-zinc-400 mt-1">PNG, JPG, WEBP up to 10MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Editorial Taxonomy */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                Taxonomy & Placement
              </h3>

              {/* Primary Section */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Primary Section Vertical</label>
                <select
                  value={formData.primarySection}
                  onChange={(e) => setFormData({ ...formData, primarySection: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  <option value="">Select Section (e.g. Technology, Education)</option>
                  {availableSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Regional Edition */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Regional Edition (e.g. Kashmir)</label>
                <select
                  value={formData.editions[0] || ''}
                  onChange={(e) => setFormData({ ...formData, editions: e.target.value ? [e.target.value] : [] })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  <option value="">Global / National Edition</option>
                  {availableEditions.map((ed) => (
                    <option key={ed._id} value={ed._id}>
                      {ed.name} Edition
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Author */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Byline Author</label>
                <select
                  value={formData.primaryAuthor}
                  onChange={(e) => setFormData({ ...formData, primaryAuthor: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                >
                  <option value="">Default Author (Suheel Hilal)</option>
                  {availableAuthors.map((auth) => (
                    <option key={auth._id} value={auth._id}>
                      {auth.name} ({auth.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Keywords & Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Press enter to add"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      #{tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="text-zinc-400 hover:text-rose-500">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold">Featured Lead Story</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.breaking}
                    onChange={(e) => setFormData({ ...formData, breaking: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-600">Breaking News Banner</span>
                </label>
              </div>
            </div>

            {/* SEO Quality Assistant & Checklist */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" /> SEO Quality Assistant
              </h3>

              <div className="space-y-2">
                {seoChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      {item.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className={item.valid ? 'text-zinc-700 dark:text-zinc-300 font-medium' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">{item.note}</span>
                  </div>
                ))}
              </div>

              {/* SERP Preview Card */}
              <div className="pt-3 border-t border-zinc-100 dark:border-white/5">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block mb-2">Google SERP Snippet Preview</span>
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">https://teachyblogs.com/blog/{formData.slug || 'article-slug'}</div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 line-clamp-1 mt-0.5">{formData.seo.title || formData.title || 'Untitled Article'} | TeachyBlogs</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">{formData.seo.description || formData.excerpt || 'Article summary description...'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
