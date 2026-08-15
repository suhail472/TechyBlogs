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
} from 'lucide-react';
import { taxonomyAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';

const KINDS = [
  { id: 'section', label: 'Editorial Sections', icon: Layers, desc: 'Subject verticals like Technology, Education, Business' },
  { id: 'edition', label: 'Regional Editions', icon: Globe, desc: 'Geographic editions like Kashmir, India, Global' },
  { id: 'topic', label: 'Topics', icon: Tag, desc: 'Recurring thematic subjects like Artificial Intelligence, Tourism' },
  { id: 'location', label: 'Locations', icon: MapPin, desc: 'Specific cities & districts like Srinagar, Gulmarg, New Delhi' },
  { id: 'series', label: 'Series', icon: Bookmark, desc: 'Multi-part articles and curriculum sequences' },
  { id: 'collection', label: 'Curated Collections', icon: FolderTree, desc: 'Handcrafted editorial roundups' },
];

export default function TaxonomyPage() {
  const [activeKind, setActiveKind] = useState('section');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    visibleInNavigation: true,
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
        visibleInNavigation: true,
        active: true,
        order: items.length,
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
      if (editingItem) {
        await taxonomyAPI.update(editingItem._id, { ...formData, kind: activeKind });
        addToast({ message: 'Taxonomy item updated successfully', type: 'success' });
      } else {
        await taxonomyAPI.create({ ...formData, kind: activeKind });
        addToast({ message: 'Taxonomy item created successfully', type: 'success' });
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
    if (window.confirm(`Are you sure you want to delete "${name}"? This may affect associated stories.`)) {
      try {
        await taxonomyAPI.delete(id);
        setItems(items.filter((item) => item._id !== id));
        addToast({ message: 'Taxonomy item deleted', type: 'success' });
      } catch (err) {
        addToast({ message: err.message || 'Delete failed', type: 'error' });
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-display">Taxonomy & Editorial Architecture</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Manage your publication hierarchy across sections, regional editions, and thematic topics.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add {KINDS.find((k) => k.id === activeKind)?.label.slice(0, -1) || 'Item'}
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {KINDS.map((kind) => {
          const Icon = kind.icon;
          const isActive = activeKind === kind.id;
          return (
            <button
              key={kind.id}
              onClick={() => setActiveKind(kind.id)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {kind.label}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{kind.desc}</p>
            </button>
          );
        })}
      </div>

      {/* List / Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Layers className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-bold">No {activeKind}s configured</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Create your first {activeKind} to structure your publications and regional coverage.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors"
            >
              Create {activeKind}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-white/10 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Slug & Path</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Nav Visibility</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10 font-medium">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 dark:text-white text-sm">{item.name}</div>
                      {item.seo?.title && <span className="text-[10px] text-zinc-400">SEO: {item.seo.title}</span>}
                    </td>
                    <td className="py-4 px-6">
                      <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-[11px] text-blue-600 dark:text-blue-400">
                        /{item.kind === 'section' ? 'section' : item.kind === 'edition' ? 'edition' : 'topic'}/{item.slug}
                      </code>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="py-4 px-6">
                      {item.visibleInNavigation ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Shown in Nav
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">Hidden</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                      }`}>
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
                  {editingItem ? 'Edit' : 'Create'} {KINDS.find((k) => k.id === activeKind)?.label.slice(0, -1)}
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
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description for landing page and SEO..."
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.visibleInNavigation}
                      onChange={(e) => setFormData({ ...formData, visibleInNavigation: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold">Show in Navbar</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold">Active Status</span>
                  </label>
                </div>

                {/* SEO Sub-section */}
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
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center gap-2"
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
