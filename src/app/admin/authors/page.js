'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Edit2,
  Shield,
  BookOpen,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Loader2,
  XCircle,
} from 'lucide-react';
import { authorAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const ROLES = [
  { id: 'contributor', label: 'Contributor', desc: 'Can create and submit drafts' },
  { id: 'author', label: 'Author', desc: 'Can write and manage own published stories' },
  { id: 'editor', label: 'Editor', desc: 'Can edit, review, schedule, and approve any story' },
  { id: 'moderator', label: 'Moderator', desc: 'Can moderate reader comments and reports' },
  { id: 'admin', label: 'Administrator', desc: 'Full editorial and user management' },
  { id: 'superadmin', label: 'Super Admin', desc: 'Complete root system access' },
];

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    slug: '',
    role: 'author',
    avatar: '',
    bio: '',
    expertise: '',
    website: '',
    socialLinks: { twitter: '', github: '', linkedin: '' },
  });

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await authorAPI.getAll();
      if (res.success) {
        setAuthors(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load authors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (author = null) => {
    if (author) {
      setEditingAuthor(author);
      setFormData({
        name: author.name,
        email: author.email,
        username: author.username || '',
        slug: author.slug || '',
        role: author.role || 'author',
        avatar: author.avatar || '',
        bio: author.bio || '',
        expertise: (author.expertise || []).join(', '),
        website: author.website || '',
        socialLinks: {
          twitter: author.socialLinks?.twitter || '',
          github: author.socialLinks?.github || '',
          linkedin: author.socialLinks?.linkedin || '',
        },
      });
    } else {
      setEditingAuthor(null);
      setFormData({
        name: '',
        email: '',
        username: '',
        slug: '',
        role: 'author',
        avatar: '',
        bio: '',
        expertise: '',
        website: '',
        socialLinks: { twitter: '', github: '', linkedin: '' },
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      addToast({ message: 'Name and Email are required', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        expertise: formData.expertise ? formData.expertise.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };

      if (editingAuthor) {
        await authorAPI.update(editingAuthor._id, payload);
        addToast({ message: 'Author profile updated', type: 'success' });
      } else {
        await authorAPI.create(payload);
        addToast({ message: 'New author created', type: 'success' });
      }
      setModalOpen(false);
      fetchAuthors();
    } catch (err) {
      addToast({ message: err.message || 'Operation failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="Editorial Team & Staff Correspondents"
        breadcrumb={[{ label: 'Staff Correspondents' }]}
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-red-600/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Correspondent</span>
          </button>
        }
      />

      {/* Author Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Loading correspondents...</p>
        </div>
      ) : authors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff correspondents registered"
          description="Add writers, editors, and correspondents to assign bylines and publishing permissions."
          actionLabel="Add Correspondent"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <div
              key={author._id}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=3b82f6&color=fff`}
                      alt={author.name}
                      className="w-13 h-13 rounded-2xl object-cover border border-zinc-200 dark:border-white/10"
                    />
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">{author.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{author.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">
                    {author.role}
                  </span>
                </div>

                {author.bio ? (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                    {author.bio}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic mb-4">No biography added yet.</p>
                )}

                {author.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {author.expertise.map((exp, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md text-[10px] font-semibold">
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{author.postCount || 0} stories published</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(author)}
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/10">
                <h3 className="text-xl font-bold font-display">
                  {editingAuthor ? 'Edit Author Profile' : 'Add Team Member'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Suheel Hilal"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="author@teachyblogs.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Role & Permissions
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm font-bold"
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Profile Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="suheel-hilal"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Biography / Byline
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Editorial writer and software architect covering..."
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Expertise Areas (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.expertise}
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                    placeholder="Next.js, Kashmir Economy, AI Systems, Cloud"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingAuthor ? 'Save Profile' : 'Create Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
