'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Tag,
  MapPin,
  Bookmark,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  FolderTree,
  FileText,
  Building2,
  Radio,
  Share2,
} from 'lucide-react';
import { taxonomyAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const KINDS = [
  { id: 'topic', label: 'Thematic Topics', icon: Tag, desc: 'Hierarchical subjects like AI, Web Dev, Higher Ed, Finance' },
  { id: 'region', label: 'Geography & Hubs', icon: MapPin, desc: 'Hierarchical locations like Kashmir, Srinagar, India, Global' },
  { id: 'content_type', label: 'Content Types', icon: Layers, desc: 'Editorial formats like News, Tutorial, Review, Guide, Analysis' },
  { id: 'entity', label: 'Entities', icon: Building2, desc: 'Recognized organizations, universities, companies, and people' },
  { id: 'series', label: 'Series', icon: Bookmark, desc: 'Multi-part editorial sequences and curriculum guides' },
  { id: 'coverage', label: 'Ongoing Coverage', icon: Radio, desc: 'Real-time event dossiers and sustained topic coverage' },
  { id: 'section', label: 'Editorial Sections', icon: FileText, desc: 'Legacy main verticals' },
  { id: 'edition', label: 'Editions', icon: Globe, desc: 'Legacy edition mappings' },
];

export default function TaxonomyPage() {
  const [activeKind, setActiveKind] = useState('topic');
  const [items, setItems] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    type: 'general',
    isHub: false,
    countryCode: '',
    visibleInNavigation: false,
    active: true,
    order: 0,
    seo: { title: '', description: '', indexable: true },
  });

  useEffect(() => {
    fetchItems();
  }, [activeKind]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await taxonomyAPI.getAll({ kind: activeKind });
      if (res.success) {
        setItems(res.data || []);
        // Parents can only be items from the same kind
        setParentOptions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load taxonomy items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        parent: item.parent || '',
        type: item.type || 'general',
        isHub: !!item.isHub,
        countryCode: item.countryCode || '',
        visibleInNavigation: item.visibleInNavigation ?? true,
        active: item.active ?? true,
        order: item.order || 0,
        seo: {
          title: item.seo?.title || '',
          description: item.seo?.description || '',
          indexable: item.seo?.indexable ?? true,
        },
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        parent: '',
        type: activeKind === 'region' ? 'city' : activeKind === 'entity' ? 'organization' : 'general',
        isHub: false,
        countryCode: activeKind === 'region' ? 'IN' : '',
        visibleInNavigation: activeKind === 'topic' || activeKind === 'region',
        active: true,
        order: items.length + 1,
        seo: { title: '', description: '', indexable: true },
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast({ message: 'Name is required', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        kind: activeKind,
        parent: formData.parent ? formData.parent : null,
      };

      if (editingItem) {
        await taxonomyAPI.update(editingItem._id, payload);
        addToast({ message: `${formData.name} updated successfully`, type: 'success' });
      } else {
        await taxonomyAPI.create(payload);
        addToast({ message: `${formData.name} created successfully`, type: 'success' });
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      addToast({ message: err.message || 'Operation failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? Existing stories using this taxonomy reference may be affected.`)) {
      try {
        await taxonomyAPI.delete(id);
        setItems(items.filter((item) => item._id !== id));
        addToast({ message: `"${name}" deleted`, type: 'success' });
      } catch (err) {
        addToast({ message: err.message || 'Delete failed', type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="Taxonomy & Editorial Architecture"
        breadcrumb={[{ label: 'Taxonomy Management' }]}
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-red-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add {KINDS.find((k) => k.id === activeKind)?.label.replace(/s$/, '') || 'Item'}</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {KINDS.map((kind) => {
          const Icon = kind.icon;
          const isActive = activeKind === kind.id;
          return (
            <button
              key={kind.id}
              onClick={() => setActiveKind(kind.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 border-red-500 shadow-sm shadow-red-500/10 ring-2 ring-red-500/20'
                  : 'bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-bold truncate ${isActive ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {kind.label}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 line-clamp-1">{kind.desc}</p>
            </button>
          );
        })}
      </div>

      {/* List / Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Loading taxonomy architecture...</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={`No ${activeKind.replace('_', ' ')}s configured`}
            description={`Create your first ${activeKind.replace('_', ' ')} to structure your publications and multi-dimensional discovery.`}
            actionLabel={`Create ${activeKind.replace('_', ' ')}`}
            onAction={() => handleOpenModal()}
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-white/10 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Slug & Path</th>
                  <th className="py-3.5 px-6">Type / Hub</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10 font-medium">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                        {item.name}
                        {item.isHub && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">
                            Hub Portal
                          </span>
                        )}
                      </div>
                      {item.ancestors?.length > 0 && (
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {item.ancestors.map((a) => a.name).join(' → ')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                        /{item.kind === 'region' ? (item.isHub && item.slug === 'kashmir' ? 'kashmir' : `region/${item.slug}`) : `${item.kind}/${item.slug}`}
                      </code>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400">
                      <span className="capitalize px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[11px]">
                        {item.type || 'standard'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
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
                  {editingItem ? 'Edit' : 'Create'} {KINDS.find((k) => k.id === activeKind)?.label.replace(/s$/, '')}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kashmir, Technology, Artificial Intelligence"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated from name if left empty"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Parent Hierarchy Selector */}
                {(activeKind === 'topic' || activeKind === 'region') && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Parent Hierarchy (Optional)
                    </label>
                    <select
                      value={formData.parent || ''}
                      onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— No Parent (Top Level) —</option>
                      {parentOptions
                        .filter((p) => !editingItem || p._id !== editingItem._id)
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.ancestors?.length ? `${p.ancestors.map((a) => a.name).join(' → ')} → ` : ''}
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Region / Entity Sub-Type */}
                {(activeKind === 'region' || activeKind === 'entity') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                        Classification Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {activeKind === 'region' ? (
                          <>
                            <option value="city">City</option>
                            <option value="district">District</option>
                            <option value="region">Region</option>
                            <option value="state">State / UT</option>
                            <option value="country">Country</option>
                            <option value="continent">Continent</option>
                          </>
                        ) : (
                          <>
                            <option value="organization">Organization</option>
                            <option value="university">University</option>
                            <option value="company">Company</option>
                            <option value="technology">Technology</option>
                            <option value="person">Person</option>
                            <option value="event">Event</option>
                          </>
                        )}
                      </select>
                    </div>

                    {activeKind === 'region' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                          Country Code
                        </label>
                        <input
                          type="text"
                          value={formData.countryCode}
                          onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                          placeholder="e.g. IN, US, GB"
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description for landing page and SEO..."
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.visibleInNavigation}
                      onChange={(e) => setFormData({ ...formData, visibleInNavigation: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold">Show in Navbar</span>
                  </label>

                  {activeKind === 'region' && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isHub}
                        onChange={(e) => setFormData({ ...formData, isHub: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Editorial Hub Portal</span>
                    </label>
                  )}
                </div>

                {/* SEO Settings */}
                <div className="pt-4 border-t border-zinc-200 dark:border-white/10 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">SEO Settings</h4>
                  <div>
                    <input
                      type="text"
                      value={formData.seo.title}
                      onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })}
                      placeholder="Custom Meta Title"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.seo.description}
                      onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })}
                      placeholder="Custom Meta Description"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    />
                  </div>
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
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingItem ? 'Save Changes' : 'Create Item'}
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
