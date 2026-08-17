'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  Search,
  CheckCircle2,
  Building2,
  ExternalLink,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  FileText,
  BadgeCheck,
  Eye,
  X,
  Check,
  ArrowRight,
  TrendingUp,
  Award,
  ArrowRightLeft,
} from 'lucide-react';
import { authorAPI, taxonomyAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const EDITORIAL_ROLES = [
  { id: 'all', label: 'All Roles' },
  { id: 'editor_in_chief', label: 'Editor-in-Chief' },
  { id: 'managing_editor', label: 'Managing Editor' },
  { id: 'section_editor', label: 'Section Editor' },
  { id: 'bureau_chief', label: 'Bureau Chief' },
  { id: 'senior_correspondent', label: 'Senior Correspondent' },
  { id: 'staff_writer', label: 'Staff Writer' },
  { id: 'columnist', label: 'Columnist' },
  { id: 'guest_writer', label: 'Guest Contributor' },
];

export default function AuthorsManagementPage() {
  const [authors, setAuthors] = useState([]);
  const [overview, setOverview] = useState(null);
  const [bureaus, setBureaus] = useState(['Global Newsroom', 'Kashmir Regional Bureau', 'India Edition']);
  const [desks, setDesks] = useState(['Technology', 'Education', 'Science', 'Business', 'Travel', 'Culture', 'News', 'Kashmir', 'India', 'World']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBureau, setSelectedBureau] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDesk, setSelectedDesk] = useState('all');

  const { addToast } = useToastStore();

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Transfer Authorship Modal State
  const [transferModal, setTransferModal] = useState({ open: false, sourceAuthor: null, targetAuthorId: '' });

  // Delete & Deactivate Modal State
  const [deleteModal, setDeleteModal] = useState({ open: false, author: null });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    slug: '',
    role: 'author',
    editorialRole: 'staff_writer',
    title: 'Staff Correspondent',
    bureau: 'Global Newsroom',
    primaryDesk: 'Technology',
    status: 'active',
    verified: true,
    featured: false,
    avatar: '',
    bio: '',
    expertise: '',
    website: '',
    socialLinks: { twitter: '', github: '', linkedin: '' },
    seo: { title: '', description: '' },
  });

  // Fetch Taxonomy Desks and Bureaus
  const fetchTaxonomy = useCallback(async () => {
    try {
      const [sectionsRes, regionsRes] = await Promise.allSettled([
        taxonomyAPI.getAll({ kind: 'section' }),
        taxonomyAPI.getAll({ kind: 'region' }),
      ]);

      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.data?.length) {
        setDesks(sectionsRes.value.data.map((s) => s.name));
      }
      if (regionsRes.status === 'fulfilled' && regionsRes.value?.data?.length) {
        const dynamicBureaus = regionsRes.value.data.map((r) => `${r.name} Bureau`);
        setBureaus(['Global Newsroom', ...dynamicBureaus]);
      }
    } catch (e) {
      // Fallback to defaults
    }
  }, []);

  // Fetch Overview Stats
  const fetchOverview = useCallback(async () => {
    try {
      const res = await authorAPI.getRosterOverview();
      if (res.success) {
        setOverview(res);
      }
    } catch (err) {
      console.warn('Failed to load roster overview:', err);
    }
  }, []);

  // Fetch Authors Roster
  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedBureau !== 'all') filters.bureau = selectedBureau;
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      if (selectedRole !== 'all') filters.role = selectedRole;
      if (selectedDesk !== 'all') filters.desk = selectedDesk;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const res = await authorAPI.getAll(filters);
      if (res.success) {
        setAuthors(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load authors:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBureau, selectedStatus, selectedRole, selectedDesk, searchQuery]);

  useEffect(() => {
    fetchTaxonomy();
    fetchOverview();
    fetchAuthors();
  }, [fetchTaxonomy, fetchOverview, fetchAuthors]);

  // Open Create / Edit Modal
  const handleOpenModal = (author = null) => {
    if (author) {
      setEditingAuthor(author);
      setFormData({
        name: author.name || '',
        email: author.email || '',
        username: author.username || '',
        slug: author.slug || '',
        role: author.role || 'author',
        editorialRole: author.editorialRole || 'staff_writer',
        title: author.title || 'Staff Correspondent',
        bureau: author.bureau || bureaus[0] || 'Global Newsroom',
        primaryDesk: author.primaryDesk || desks[0] || 'Technology',
        status: author.status || 'active',
        verified: author.verified ?? true,
        featured: author.featured ?? false,
        avatar: author.avatar || '',
        bio: author.bio || '',
        expertise: (author.expertise || []).join(', '),
        website: author.website || '',
        socialLinks: {
          twitter: author.socialLinks?.twitter || '',
          github: author.socialLinks?.github || '',
          linkedin: author.socialLinks?.linkedin || '',
        },
        seo: {
          title: author.seo?.title || '',
          description: author.seo?.description || '',
        },
      });
      setIsSlugManual(true);
    } else {
      setEditingAuthor(null);
      setFormData({
        name: '',
        email: '',
        username: '',
        slug: '',
        role: 'author',
        editorialRole: 'staff_writer',
        title: 'Staff Correspondent',
        bureau: selectedBureau !== 'all' ? selectedBureau : (bureaus[0] || 'Global Newsroom'),
        primaryDesk: desks[0] || 'Technology',
        status: 'active',
        verified: true,
        featured: false,
        avatar: '',
        bio: '',
        expertise: '',
        website: '',
        socialLinks: { twitter: '', github: '', linkedin: '' },
        seo: { title: '', description: '' },
      });
      setIsSlugManual(false);
    }
    setModalOpen(true);
  };

  // Name change with auto slug generator
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, name };
      if (!isSlugManual || !prev.slug) {
        next.slug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      return next;
    });
  };

  // Save / Update Author
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      addToast('Name and email are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        expertise: formData.expertise
          ? formData.expertise.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingAuthor) {
        await authorAPI.update(editingAuthor._id, payload);
        addToast(`Updated byline profile for "${formData.name}"`, 'success');
      } else {
        await authorAPI.create(payload);
        addToast(`Created newsroom author "${formData.name}"`, 'success');
      }

      setModalOpen(false);
      fetchAuthors();
      fetchOverview();
    } catch (err) {
      addToast(err.message || 'Failed to save author profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Safe Delete / Deactivation
  const handleExecuteDelete = async () => {
    if (!deleteModal.author) return;
    setSubmitting(true);
    try {
      const res = await authorAPI.delete(deleteModal.author._id);
      addToast(res.message || 'Author status updated', 'info');
      setDeleteModal({ open: false, author: null });
      fetchAuthors();
      fetchOverview();
    } catch (err) {
      addToast(err.message || 'Failed to manage author status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Authorship Transfer
  const handleExecuteTransfer = async () => {
    if (!transferModal.sourceAuthor || !transferModal.targetAuthorId) {
      addToast('Please select a target author to receive articles', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authorAPI.transferArticles(transferModal.sourceAuthor._id, transferModal.targetAuthorId);
      addToast(res.message || 'Authorship transfer complete', 'success');
      setTransferModal({ open: false, sourceAuthor: null, targetAuthorId: '' });
      fetchAuthors();
      fetchOverview();
    } catch (err) {
      addToast(err.message || 'Authorship transfer failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. TOP COMMAND BAR */}
      <AdminHeader
        title="Newsroom Authors & Bureau Roster"
        breadcrumb={[{ label: 'Editorial People & Byline Operations' }]}
        actions={
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm shadow-red-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Correspondent</span>
          </button>
        }
      />

      {/* 2. ROSTER PULSE STRIP */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Total Roster</span>
          <p className="font-display text-2xl font-black text-zinc-900 dark:text-white">
            {overview?.stats?.totalAuthors ?? authors.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Active Staff</span>
          <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {overview?.stats?.activeStaff ?? authors.filter((a) => a.status === 'active').length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Bureau Chiefs</span>
          <p className="font-display text-2xl font-black text-purple-600 dark:text-purple-400">
            {overview?.stats?.bureauChiefs ?? authors.filter((a) => a.editorialRole === 'bureau_chief').length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Columnists</span>
          <p className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">
            {overview?.stats?.columnists ?? authors.filter((a) => a.editorialRole === 'columnist').length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Total Bylines</span>
          <p className="font-display text-2xl font-black text-red-600 dark:text-red-400">
            {overview?.stats?.totalBylines?.toLocaleString() ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Reader Reach</span>
          <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">
            {overview?.stats?.totalViews?.toLocaleString() ?? 0}
          </p>
        </div>
      </section>

      {/* 3. BUREAU NAVIGATION TABS & FILTERS */}
      <section className="space-y-4">
        {/* Bureau Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-zinc-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => setSelectedBureau('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedBureau === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>All Bureaus</span>
          </button>
          {bureaus.map((b) => {
            const active = selectedBureau === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBureau(b)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  active
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{b}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Staff</option>
              <option value="on_leave">On Leave</option>
              <option value="former">Former Staff</option>
            </select>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Roles</option>
              <option value="author">Author / Correspondent</option>
              <option value="editor">Editor</option>
              <option value="admin">Administrator</option>
              <option value="contributor">Contributor</option>
            </select>

            {/* Desk Filter */}
            <select
              value={selectedDesk}
              onChange={(e) => setSelectedDesk(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Primary Desks</option>
              {desks.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bylines, names, slugs..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </section>

      {/* 4. ROSTER GRID / CARDS VIEW */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <EmptyState
          title="No newsroom authors found"
          description="Create or invite journalists, correspondents, and editors to build the newsroom byline directory."
          actionLabel="+ Add Correspondent"
          onAction={() => handleOpenModal()}
          className="my-12"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((author) => (
            <div
              key={author._id}
              className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-white/20 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Author Avatar & Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center font-display font-black text-sm text-zinc-900 dark:text-white uppercase overflow-hidden shrink-0">
                      {author.avatar ? (
                        <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        author.name.charAt(0)
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {author.name}
                        </h4>
                        {author.verified && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" title="Verified Byline" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium truncate">
                        {author.title || 'Staff Correspondent'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      author.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : author.status === 'on_leave'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {author.status === 'active' ? 'Active' : author.status === 'on_leave' ? 'On Leave' : 'Former'}
                  </span>
                </div>

                {/* Bureau & Desk Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{author.bureau || 'Global Newsroom'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span>{author.primaryDesk || 'Technology'}</span>
                  </span>
                </div>

                {/* Bio Excerpt */}
                {author.bio && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {author.bio}
                  </p>
                )}

                {/* Published & Draft Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono block">Published Stories</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">
                      {author.postCount ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono block">Lifetime Reads</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">
                      {author.totalViews?.toLocaleString() ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5">
                <Link
                  href={`/author/${author.slug || author.username || 'suheel-hilal'}`}
                  target="_blank"
                  className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <span>Public Byline</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTransferModal({ open: true, sourceAuthor: author, targetAuthorId: '' })}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    title="Transfer Articles to another author"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenModal(author)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModal({ open: true, author })}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600"
                    title="Safe Deactivate / Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. MODAL: EDIT / CREATE AUTHOR */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-600" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    {editingAuthor ? `Edit Byline: ${editingAuthor.name}` : 'New Newsroom Author Profile'}
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                {/* Full Name & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      placeholder="e.g. Suheel Hilal"
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="journalist@teachyblogs.com"
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Byline Title & URL Slug */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Byline Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Senior Kashmir Correspondent"
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Public Byline Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setIsSlugManual(true);
                        setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^\w-]/g, '') }));
                      }}
                      placeholder="suheel-hilal"
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Bureau & Primary Desk Placement */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Regional Bureau</label>
                    <select
                      value={formData.bureau}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bureau: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    >
                      {bureaus.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Primary Editorial Desk</label>
                    <select
                      value={formData.primaryDesk}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryDesk: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    >
                      {desks.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Editorial Role & Roster Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Editorial Role Classification</label>
                    <select
                      value={formData.editorialRole}
                      onChange={(e) => setFormData((prev) => ({ ...prev, editorialRole: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    >
                      {EDITORIAL_ROLES.filter((r) => r.id !== 'all').map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Roster Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    >
                      <option value="active">Active Staff</option>
                      <option value="on_leave">On Leave</option>
                      <option value="former">Former Staff</option>
                    </select>
                  </div>
                </div>

                {/* Avatar URL & Website */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Avatar Photo URL</label>
                    <input
                      type="text"
                      value={formData.avatar}
                      onChange={(e) => setFormData((prev) => ({ ...prev, avatar: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Personal Website</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://suheel.dev"
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Journalistic Bio</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Short journalistic background and focus areas..."
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none resize-none"
                  />
                </div>

                {/* Expertise Tags */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Beats & Expertise (comma separated)</label>
                  <input
                    type="text"
                    value={formData.expertise}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expertise: e.target.value }))}
                    placeholder="Artificial Intelligence, Education, Kashmir, Cloud Architecture"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                  />
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">X / Twitter</label>
                    <input
                      type="text"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                        }))
                      }
                      placeholder="https://x.com/username"
                      className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-[11px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={formData.socialLinks?.linkedin || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value },
                        }))
                      }
                      placeholder="https://linkedin.com/in/..."
                      className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-[11px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">GitHub</label>
                    <input
                      type="text"
                      value={formData.socialLinks?.github || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, github: e.target.value },
                        }))
                      }
                      placeholder="https://github.com/..."
                      className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-[11px] outline-none"
                    />
                  </div>
                </div>

                {/* Verification & Spotlight Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 cursor-pointer">
                    <span className="font-bold flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span>Verified Byline</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.verified}
                      onChange={(e) => setFormData((prev) => ({ ...prev, verified: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 cursor-pointer">
                    <span className="font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Featured Spotlight</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{editingAuthor ? 'Save Profile' : 'Create Byline'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: TRANSFER AUTHORSHIP */}
      <AnimatePresence>
        {transferModal.open && transferModal.sourceAuthor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-purple-500" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Transfer Articles from {transferModal.sourceAuthor.name}
                  </h3>
                </div>
                <button onClick={() => setTransferModal({ open: false, sourceAuthor: null, targetAuthorId: '' })} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Select a target author to receive attribution for all stories currently authored by <strong>{transferModal.sourceAuthor.name}</strong> ({transferModal.sourceAuthor.postCount || 0} published stories).
              </p>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Target Author</label>
                <select
                  value={transferModal.targetAuthorId}
                  onChange={(e) => setTransferModal((prev) => ({ ...prev, targetAuthorId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                >
                  <option value="">Select target author...</option>
                  {authors
                    .filter((a) => a._id !== transferModal.sourceAuthor._id)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({a.title || a.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModal({ open: false, sourceAuthor: null, targetAuthorId: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  disabled={submitting || !transferModal.targetAuthorId}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  Confirm Transfer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL: SAFE DELETE / DEACTIVATE */}
      <AnimatePresence>
        {deleteModal.open && deleteModal.author && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Manage "{deleteModal.author.name}"
                  </h3>
                </div>
                <button onClick={() => setDeleteModal({ open: false, author: null })} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {deleteModal.author.postCount > 0 ? (
                  <>
                    This author has <strong className="text-zinc-900 dark:text-white">{deleteModal.author.postCount} published stories</strong>. To protect historical bylines and prevent broken URLs, the profile will be safely transitioned to <strong>Former Staff</strong> rather than hard-deleted.
                  </>
                ) : (
                  'This author has 0 published stories and can be safely removed from the system.'
                )}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ open: false, author: null })}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {deleteModal.author.postCount > 0 ? 'Archive as Former Staff' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
