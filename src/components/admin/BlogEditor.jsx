'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Upload, Plus, X, Loader2 } from 'lucide-react';
import { postAPI } from '@/services/api';
import { getCookie } from '@/lib/cookies';
import BlogPreview from './BlogPreview';

export default function BlogEditor({ id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // New Autosave states
  const [saveStatus, setSaveStatus] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [activeTab, setActiveTab] = useState('edit');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    categories: [],
    tags: [],
    faqs: [],
    metaDescription: '',
    keywords: '',
  });

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  // Debounced Auto-Save Draft to LocalStorage
  useEffect(() => {
    if (loading) return;
    if (!formData.title && !formData.content && !formData.excerpt) return;

    setSaveStatus('Saving...');
    const delayDebounceFn = setTimeout(() => {
      const storageKey = id ? `teachyblogs-autosave-post-${id}` : 'teachyblogs-autosave-post-new';
      localStorage.setItem(storageKey, JSON.stringify({
        ...formData,
        autosavedAt: new Date().toISOString()
      }));
      setSaveStatus('Draft Autosaved');
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [formData, id, loading]);

  // Check for newer draft on load
  useEffect(() => {
    if (loading) return;
    const storageKey = id ? `teachyblogs-autosave-post-${id}` : 'teachyblogs-autosave-post-new';
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed) {
          if (id) {
            const isDifferent = 
              parsed.title !== formData.title || 
              parsed.content !== formData.content || 
              parsed.excerpt !== formData.excerpt;
            if (isDifferent) {
              setHasDraft(true);
              setDraftData(parsed);
            }
          } else {
            setHasDraft(true);
            setDraftData(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to parse saved draft:', err);
      }
    }
  }, [id, loading]);

  useEffect(() => {
    if (!id && !isSlugManual && formData.title) {
      const autoSlug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.title, isSlugManual, id]);

  const fetchBlog = async () => {
    try {
      const blog = await postAPI.getPostById(id);
      if (blog) {
        setFormData({
          title: blog.title || '',
          slug: blog.slug || '',
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          image: blog.image || '',
          categories: blog.categories || [],
          tags: blog.tags || [],
          faqs: blog.faqs || [],
          metaDescription: blog.metaDescription || '',
          keywords: blog.keywords || '',
        });
        setImagePreview(blog.image);
        setIsSlugManual(true);
      }
    } catch (error) {
      console.error('Failed to fetch blog post details:', error);
      alert('Failed to load blog post details.');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result;
        try {
          const token = getCookie('token');
          const res = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ image: base64Data }),
          });
          const data = await res.json();
          if (data.success) {
            setImagePreview(data.url);
            setFormData(prev => ({ ...prev, image: data.url }));
          } else {
            alert('Upload failed: ' + data.message);
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Upload failed. Storing preview locally.');
          setImagePreview(base64Data);
          setFormData(prev => ({ ...prev, image: base64Data }));
        } finally {
          setImageUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleAddCategory = (e) => {
    const value = e.target.value;
    if (value && !formData.categories.includes(value)) {
      setFormData(prev => ({ ...prev, categories: [...prev.categories, value] }));
      e.target.value = '';
    }
  };

  const removeCategory = (categoryToRemove) => {
    setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== categoryToRemove) }));
  };

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = document.getElementById('blog-markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const replacement = prefix + (selectedText || '') + suffix;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 0)
      );
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim() || !formData.image) {
      alert('Please fill in all required fields (Title, Excerpt, Image, and Content)');
      return;
    }

    setSubmitting(true);
    try {
      const resolvedSlug = (formData.slug || '')
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      if (!resolvedSlug) {
        alert('Please specify a valid URL slug.');
        setSubmitting(false);
        return;
      }

      const postData = {
        title: formData.title,
        slug: resolvedSlug,
        excerpt: formData.excerpt,
        content: formData.content,
        image: formData.image,
        categories: formData.categories,
        tags: formData.tags,
        faqs: formData.faqs,
        metaDescription: formData.metaDescription || '',
        keywords: formData.keywords || '',
        status: 'published',
      };

      if (id) {
        await postAPI.updatePost(id, postData);
        alert('Post updated successfully');
      } else {
        await postAPI.createPost(postData);
        alert('Post created successfully');
      }
      const storageKey = id ? `teachyblogs-autosave-post-${id}` : 'teachyblogs-autosave-post-new';
      localStorage.removeItem(storageKey);
      router.push('/admin');
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Failed to save post: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = "w-full px-5 py-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/50 text-sm bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500";
  const labelClasses = "block text-xs font-black text-slate-550 uppercase tracking-widest mb-3 ml-1";

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-slate-500 text-sm font-bold">Assembling workspace editor...</span>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {hasDraft && (
        <div className="mb-8 p-5 rounded-2xl border border-amber-500/10 bg-amber-500/5 text-amber-700 dark:text-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold font-sans">
          <div className="flex items-center gap-3.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span>We found a newer unsaved draft of this article from {new Date(draftData?.autosavedAt).toLocaleString()}.</span>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setFormData(draftData);
                setHasDraft(false);
                setSaveStatus('Draft Restored');
              }}
              className="px-4.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors uppercase tracking-wider text-[10px] font-black"
            >
              Restore Draft
            </button>
            <button
              onClick={() => {
                const storageKey = id ? `teachyblogs-autosave-post-${id}` : 'teachyblogs-autosave-post-new';
                localStorage.removeItem(storageKey);
                setHasDraft(false);
              }}
              className="px-4.5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-750 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors uppercase tracking-wider text-[10px] font-black"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <Link 
            href="/admin" 
            className="inline-flex items-center text-xs font-black uppercase tracking-wider text-slate-505 hover:text-blue-500 mb-4 group transition-colors font-display"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight font-display text-slate-900 dark:text-white">
              {id ? 'Edit Article' : 'Create Article'}
            </h1>
            {saveStatus && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${
                saveStatus === 'Saving...' 
                  ? 'text-amber-500 bg-amber-500/5 border-amber-500/10' 
                  : 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'Saving...' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`} />
                {saveStatus}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-end">
          {/* Editor/Preview Toggle Segment Control */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-750/80 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-250'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-250'
              }`}
            >
              Preview
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                <span>Publish Article</span>
              </>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <BlogPreview formData={formData} />
      ) : (
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={(e) => e.preventDefault()}>
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-8 md:p-10 rounded-[2.5rem] border bg-white border-zinc-200 shadow-xl shadow-zinc-200/30 dark:bg-zinc-800/20 dark:border-zinc-800 dark:shadow-none">
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>Article Title</label>
                  <input
                    type="text"
                    placeholder="The Future of Web Development..."
                    className={inputClasses}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Custom URL Slug (Path)</label>
                  <input
                    type="text"
                    placeholder="the-future-of-web-development"
                    className={inputClasses}
                    value={formData.slug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Excerpt (Summary)</label>
                  <textarea
                    placeholder="A brief summary that hooks your readers..."
                    rows={3}
                    className={`${inputClasses} resize-none`}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  />
                </div>

                {/* Custom Markdown Editor & Toolbar */}
                <div className="flex flex-col space-y-3">
                  <label className={labelClasses}>Article Content (Markdown)</label>
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 overflow-hidden">
                    
                    {/* Markdown Toolbar */}
                    <div className="flex flex-wrap gap-1 p-2 bg-zinc-150 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        title="Heading 1"
                        onClick={() => insertMarkdown('# ', '')}
                        className="px-3 py-1.5 rounded-lg text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400 font-mono"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        title="Heading 2"
                        onClick={() => insertMarkdown('## ', '')}
                        className="px-3 py-1.5 rounded-lg text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400 font-mono"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        title="Heading 3"
                        onClick={() => insertMarkdown('### ', '')}
                        className="px-3 py-1.5 rounded-lg text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400 font-mono"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        title="Heading 4"
                        onClick={() => insertMarkdown('#### ', '')}
                        className="px-3 py-1.5 rounded-lg text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400 font-mono"
                      >
                        H4
                      </button>
                      <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 align-middle self-center" />
                      <button
                        type="button"
                        title="Bold"
                        onClick={() => insertMarkdown('**', '**')}
                        className="px-3 py-1.5 rounded-lg text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        title="Italic"
                        onClick={() => insertMarkdown('*', '*')}
                        className="px-3 py-1.5 rounded-lg text-xs italic font-black hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        title="Inline Code"
                        onClick={() => insertMarkdown('`', '`')}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400"
                      >
                        &lt;&gt;
                      </button>
                      <button
                        type="button"
                        title="Code Block"
                        onClick={() => insertMarkdown('```\n', '\n```')}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400"
                      >
                        CodeBlock
                      </button>
                      <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 align-middle self-center" />
                      <button
                        type="button"
                        title="Link"
                        onClick={() => insertMarkdown('[', '](url)')}
                        className="px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400 underline"
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        title="Image"
                        onClick={() => insertMarkdown('![Alt Text](', ')')}
                        className="px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400"
                      >
                        Image
                      </button>
                      <button
                        type="button"
                        title="Bullet List"
                        onClick={() => insertMarkdown('- ', '')}
                        className="px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        title="Numbered List"
                        onClick={() => insertMarkdown('1. ', '')}
                        className="px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors text-zinc-650 dark:text-zinc-400"
                      >
                        1. List
                      </button>
                    </div>
                    
                    {/* Markdown Textarea */}
                    <textarea
                      id="blog-markdown-editor"
                      placeholder="Write your blog post content using raw markdown syntax here..."
                      rows={16}
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full p-6 text-sm font-mono border-0 bg-transparent outline-none resize-y text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Builder Panel */}
            <div className="p-8 md:p-10 rounded-[2.5rem] border bg-white border-zinc-200 shadow-xl shadow-zinc-200/30 dark:bg-zinc-800/20 dark:border-zinc-800 dark:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-black font-display text-slate-900 dark:text-white">Article FAQ Section</h3>
                  <p className="text-xs text-zinc-500 mt-1">Add frequently asked questions to optimize Google rankings (JSON-LD Rich Snippet).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add FAQ Item
                </button>
              </div>

              {formData.faqs.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 dark:text-zinc-500 text-xs font-semibold">
                  No FAQs added yet. Add some to boost SEO!
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.faqs.map((faq, index) => (
                    <div key={index} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 space-y-4 relative">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }))}
                        className="absolute top-4 right-4 p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="pr-8 space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Question #{index + 1}</label>
                          <input
                            type="text"
                            placeholder="What is this article about?"
                            className={inputClasses}
                            value={faq.question}
                            onChange={(e) => {
                              const updatedFaqs = [...formData.faqs];
                              updatedFaqs[index].question = e.target.value;
                              setFormData(prev => ({ ...prev, faqs: updatedFaqs }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Answer</label>
                          <textarea
                            placeholder="Provide the answer here..."
                            rows={2}
                            className={`${inputClasses} resize-none`}
                            value={faq.answer}
                            onChange={(e) => {
                              const updatedFaqs = [...formData.faqs];
                              updatedFaqs[index].answer = e.target.value;
                              setFormData(prev => ({ ...prev, faqs: updatedFaqs }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-8">
            <div className="p-8 rounded-[2rem] border bg-white border-zinc-200 shadow-xl shadow-zinc-200/30 dark:bg-zinc-800/20 dark:border-zinc-800 dark:shadow-none">
              <h3 className="font-black text-lg mb-6 font-display text-slate-900 dark:text-white">
                Metadata & Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>Featured Image</label>
                  {imagePreview && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-800 relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover" />
                      {imageUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold gap-2">
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-blue-400" />
                          Uploading to Cloudinary...
                        </div>
                      )}
                    </div>
                  )}
                  <label className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors block border-zinc-200 hover:border-blue-500 bg-zinc-50 dark:border-zinc-800 dark:hover:border-blue-500/50 dark:bg-zinc-800/40">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={imageUploading}
                    />
                    <Upload className="w-6 h-6 mx-auto mb-3 text-zinc-400" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      {imageUploading ? 'Uploading...' : 'Upload Header Image'}
                    </p>
                  </label>
                </div>

                <div>
                  <label className={labelClasses}>Categories</label>
                  <select className={inputClasses} onChange={handleAddCategory} defaultValue="">
                    <option value="">Choose category...</option>
                    <option value="Technology">Technology</option>
                    <option value="Design">Design</option>
                    <option value="Development">Development</option>
                    <option value="Trends">Trends</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="React">React</option>
                    <option value="Next.js">Next.js</option>
                  </select>
                  {formData.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3.5">
                      {formData.categories.map(cat => (
                        <span 
                          key={cat} 
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider rounded-md"
                        >
                          {cat}
                          <button onClick={() => removeCategory(cat)} type="button" className="hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Tags</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Enter custom tag..."
                      className={`${inputClasses} py-3.5 px-4 text-xs`}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                    />
                    <button 
                      onClick={handleAddTag}
                      type="button"
                      className="p-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider rounded-md"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} type="button" className="hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>SEO Keywords</label>
                  <input
                    type="text"
                    placeholder="nextjs, react, css layout"
                    className={`${inputClasses} py-3.5 text-xs`}
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  />
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 block">Comma-separated keywords.</span>
                </div>

                <div>
                  <label className={labelClasses}>SEO Meta Description</label>
                  <textarea
                    placeholder="Optimize search result snippet description..."
                    rows={3}
                    className={`${inputClasses} py-3.5 text-xs resize-none`}
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  />
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 block">Optimal: 150-160 characters.</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
