'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  ChevronRight,
  ChevronDown,
  Search,
  AlertTriangle,
  Move,
  Merge,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  X,
  SlidersHorizontal,
  Sparkles,
  Check,
  Compass,
} from 'lucide-react';
import { taxonomyAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const DIMENSIONS = [
  { id: 'overview', label: 'Overview & Health', icon: Compass, desc: 'Publication IA distribution, coverage metrics, and integrity scan' },
  { id: 'section', label: 'Editorial Desks', icon: FileText, desc: 'Primary newsroom desks (Technology, News, Education, Business, Kashmir)' },
  { id: 'topic', label: 'Hierarchical Topics', icon: Tag, desc: 'N-level thematic ontology (AI, Web Dev, Higher Ed, Finance)' },
  { id: 'region', label: 'Geography & Hubs', icon: MapPin, desc: 'Hierarchical locations, Kashmir Hub, and regional editions' },
  { id: 'content_type', label: 'Content Types', icon: Layers, desc: 'Article formats (News, Analysis, Opinion, Tutorial, Review, Guide)' },
  { id: 'tag', label: 'Tag Registry & Merge', icon: Merge, desc: 'Flat keywords with usage count and duplicate merge engine' },
  { id: 'entity', label: 'Entities', icon: Building2, desc: 'Recognized institutions, universities, corporations, and figures' },
  { id: 'series', label: 'Editorial Series', icon: Bookmark, desc: 'Multi-part curated sequences and investigative dossiers' },
];

export default function TaxonomyControlCenter() {
  const [activeDimension, setActiveDimension] = useState('overview');
  const [items, setItems] = useState([]);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToastStore();

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Move / Reparent Modal State
  const [moveModal, setMoveModal] = useState({ open: false, item: null, targetParentId: '' });

  // Tag Merge Modal State
  const [mergeModal, setMergeModal] = useState({ open: false, sourceTag: '', targetTag: '' });

  // Delete & Reassign Modal State
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, targetReassignId: '' });

  // Tree View Expand/Collapse State
  const [expandedNodes, setExpandedNodes] = useState({});

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    kind: 'topic',
    description: '',
    parent: '',
    type: 'general',
    isHub: false,
    countryCode: '',
    visibleInNavigation: true,
    active: true,
    order: 0,
    capabilities: {},
    seo: { title: '', description: '', indexable: true },
  });

  // Load Overview Data
  const fetchOverview = useCallback(async () => {
    try {
      const res = await taxonomyAPI.getOverview();
      if (res.success) {
        setOverviewData(res);
      }
    } catch (err) {
      console.warn('Failed to load taxonomy overview:', err);
    }
  }, []);

  // Load Dimension Items
  const fetchItems = useCallback(async () => {
    if (activeDimension === 'overview') {
      setLoading(true);
      await fetchOverview();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await taxonomyAPI.getAll({ kind: activeDimension });
      if (res.success) {
        setItems(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load taxonomy items:', err);
    } finally {
      setLoading(false);
    }
  }, [activeDimension, fetchOverview]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Expand / Collapse Tree Node
  const toggleExpand = (nodeId) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Open Create / Edit Modal
  const handleOpenModal = (item = null, defaultParent = '') => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        slug: item.slug || '',
        kind: item.kind || activeDimension,
        description: item.description || '',
        parent: item.parent || '',
        type: item.type || 'general',
        isHub: !!item.isHub,
        countryCode: item.countryCode || '',
        visibleInNavigation: item.visibleInNavigation ?? true,
        active: item.active ?? true,
        order: item.order || 0,
        capabilities: item.capabilities || {},
        seo: {
          title: item.seo?.title || '',
          description: item.seo?.description || '',
          indexable: item.seo?.indexable ?? true,
        },
      });
      setIsSlugManual(true);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        slug: '',
        kind: activeDimension === 'overview' ? 'topic' : activeDimension,
        description: '',
        parent: defaultParent || '',
        type: 'general',
        isHub: false,
        countryCode: '',
        visibleInNavigation: true,
        active: true,
        order: items.length,
        capabilities: {},
        seo: { title: '', description: '', indexable: true },
      });
      setIsSlugManual(false);
    }
    setModalOpen(true);
  };

  // Name change with automatic slug generator
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

  // Save Taxonomy Mutation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      addToast('Name and URL slug are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        parent: formData.parent || null,
      };

      if (editingItem) {
        await taxonomyAPI.update(editingItem._id, payload);
        addToast(`Updated ${formData.kind} "${formData.name}"`, 'success');
      } else {
        await taxonomyAPI.create(payload);
        addToast(`Created ${formData.kind} "${formData.name}"`, 'success');
      }

      setModalOpen(false);
      fetchItems();
      fetchOverview();
    } catch (err) {
      addToast(err.message || 'Saving taxonomy item failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Move / Reparent
  const handleExecuteMove = async () => {
    if (!moveModal.item) return;
    setSubmitting(true);
    try {
      await taxonomyAPI.update(moveModal.item._id, {
        parent: moveModal.targetParentId || null,
      });
      addToast(`Moved "${moveModal.item.name}" in hierarchy`, 'success');
      setMoveModal({ open: false, item: null, targetParentId: '' });
      fetchItems();
    } catch (err) {
      addToast(err.message || 'Failed to move node', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Tag Merge
  const handleExecuteMerge = async () => {
    if (!mergeModal.sourceTag || !mergeModal.targetTag) {
      addToast('Please provide both source and target tags', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await taxonomyAPI.mergeTags(mergeModal.sourceTag, mergeModal.targetTag);
      addToast(res.message || 'Tag merge completed', 'success');
      setMergeModal({ open: false, sourceTag: '', targetTag: '' });
      fetchItems();
    } catch (err) {
      addToast(err.message || 'Tag merge failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Safe Delete
  const handleExecuteDelete = async () => {
    if (!deleteModal.item) return;
    setSubmitting(true);
    try {
      if (deleteModal.targetReassignId) {
        await taxonomyAPI.reassignArticles(deleteModal.item._id, deleteModal.targetReassignId);
      }
      await taxonomyAPI.delete(deleteModal.item._id);
      addToast(`Deleted taxonomy item "${deleteModal.item.name}"`, 'info');
      setDeleteModal({ open: false, item: null, targetReassignId: '' });
      fetchItems();
      fetchOverview();
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Build Hierarchy Tree from flat array
  const treeData = useMemo(() => {
    const itemMap = new Map();
    const roots = [];

    items.forEach((item) => {
      itemMap.set(String(item._id), { ...item, children: [] });
    });

    items.forEach((item) => {
      const node = itemMap.get(String(item._id));
      if (item.parent && itemMap.has(String(item.parent))) {
        itemMap.get(String(item.parent)).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [items]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Render Recursive Tree Node
  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node._id] ?? true;

    return (
      <div key={node._id} className="space-y-1">
        <div
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          className="py-2.5 pr-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.02] border border-transparent hover:border-zinc-200/60 dark:hover:border-white/5 flex items-center justify-between gap-3 group transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node._id)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                aria-label={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-zinc-300 dark:text-zinc-700">•</span>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">{node.name}</span>
                <span className="font-mono text-[10px] text-zinc-400">/{node.slug}</span>

                {node.isHub && (
                  <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 text-[9px] font-mono font-bold uppercase">
                    Hub 🏛️
                  </span>
                )}
                {!node.active && (
                  <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[9px] font-mono font-bold">
                    Inactive
                  </span>
                )}
              </div>

              {node.ancestors?.length > 0 && (
                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                  <span>Path:</span>
                  {node.ancestors.map((anc) => (
                    <span key={anc._id} className="flex items-center gap-1">
                      <span>{anc.name}</span>
                      <span>›</span>
                    </span>
                  ))}
                  <span className="text-zinc-600 dark:text-zinc-300 font-semibold">{node.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Node Context Actions */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => handleOpenModal(null, node._id)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-bold flex items-center gap-1"
              title="Add Child Sub-node"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Sub-node</span>
            </button>

            <button
              type="button"
              onClick={() => setMoveModal({ open: true, item: node, targetParentId: node.parent || '' })}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-bold"
              title="Move / Re-parent Node"
            >
              <Move className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal(node)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Edit Item"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <Link
              href={`/${node.kind === 'region' ? 'region' : 'topic'}/${node.slug}`}
              target="_blank"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Preview Landing Page"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={() => setDeleteModal({ open: true, item: node, targetReassignId: '' })}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"
              title="Safe Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children Subtree */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-zinc-200/60 dark:border-white/5 ml-4">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. ARCHITECTURE CONTROL CENTER HEADER */}
      <AdminHeader
        title="Taxonomy & Desks Architecture"
        breadcrumb={[{ label: 'Information Architecture Control Center' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMergeModal({ open: true, sourceTag: '', targetTag: '' })}
              className="px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
              title="Merge duplicate tags across publication"
            >
              <Merge className="w-3.5 h-3.5 text-purple-500" />
              <span>Merge Tags</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Taxonomy</span>
            </button>
          </div>
        }
      />

      {/* 2. ORTHOGONAL DIMENSION NAVIGATION TABS */}
      <section className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-zinc-200/80 dark:border-white/10">
          {DIMENSIONS.map((dim) => {
            const Icon = dim.icon;
            const active = activeDimension === dim.id;
            return (
              <button
                key={dim.id}
                type="button"
                onClick={() => {
                  setActiveDimension(dim.id);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  active
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{dim.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. VIEW 1: OVERVIEW & HEALTH DASHBOARD */}
      {activeDimension === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Total Items</span>
              <p className="font-display text-2xl font-black text-zinc-900 dark:text-white">{overviewData?.stats?.total ?? 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Desks</span>
              <p className="font-display text-2xl font-black text-red-600 dark:text-red-400">{overviewData?.stats?.sections ?? 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Topics</span>
              <p className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">{overviewData?.stats?.topics ?? 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Hubs</span>
              <p className="font-display text-2xl font-black text-purple-600 dark:text-purple-400">{overviewData?.stats?.hubs ?? 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Formats</span>
              <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">{overviewData?.stats?.contentTypes ?? 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Tags</span>
              <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">{overviewData?.stats?.tags ?? 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Entities</span>
              <p className="font-display text-2xl font-black text-cyan-600 dark:text-cyan-400">{overviewData?.stats?.entities ?? 0}</p>
            </div>
          </div>

          {/* Health & Integrity Report Card */}
          <section className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wide">
                    Taxonomy Health & Hierarchy Integrity
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Live scan for circular loops, broken parent pointers, and navigation inconsistencies
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase ${
                  overviewData?.healthReport?.isHealthy
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {overviewData?.healthReport?.isHealthy ? '✓ Tree Healthy' : `⚠ ${overviewData?.healthReport?.issuesCount} Issues`}
              </span>
            </div>

            {overviewData?.healthReport?.isHealthy ? (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All taxonomy trees, materialized ancestors, and navigation configurations are 100% healthy.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {overviewData?.healthReport?.issues?.map((iss, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between gap-3"
                  >
                    <span>{iss.message}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenModal({ _id: iss.itemId, name: iss.name })}
                      className="px-2.5 py-1 rounded bg-amber-500 text-white font-bold text-[11px]"
                    >
                      Fix ↗
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Nav to Dimensions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIMENSIONS.filter((d) => d.id !== 'overview').map((dim) => {
              const Icon = dim.icon;
              return (
                <button
                  key={dim.id}
                  type="button"
                  onClick={() => setActiveDimension(dim.id)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 hover:border-red-500/40 text-left space-y-2 transition-colors group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">{dim.label}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{dim.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. VIEW 2: HIERARCHICAL TREE OR FLAT LIST (For active dimension) */}
      {activeDimension !== 'overview' && (
        <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          {/* Sub-header & Search bar */}
          <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white capitalize">
                {DIMENSIONS.find((d) => d.id === activeDimension)?.label} ({items.length})
              </h3>
              <p className="text-xs text-zinc-500">
                {DIMENSIONS.find((d) => d.id === activeDimension)?.desc}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search names or slugs..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* Content Render: Tree (for topic/region) or List Table */}
          {loading ? (
            <div className="p-12 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title={`No ${activeDimension.replace('_', ' ')} items found`}
              description="Create a new taxonomy entity to expand the publication information architecture."
              actionLabel="+ New Item"
              onAction={() => handleOpenModal()}
              className="m-6"
            />
          ) : (activeDimension === 'topic' || activeDimension === 'region') && !searchQuery.trim() ? (
            /* Hierarchical Tree Render */
            <div className="p-4 space-y-1">
              {treeData.map((node) => renderTreeNode(node, 0))}
            </div>
          ) : (
            /* Standard Table Render */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200/80 dark:border-white/10 font-mono">
                  <tr>
                    <th className="py-3 px-5">Name & Slug</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Navigation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                  {filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-900 dark:text-white">{item.name}</span>
                            {item.isHub && (
                              <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 text-[9px] font-mono font-bold uppercase">
                                Hub
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">/{item.slug}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-zinc-500 line-clamp-1">
                        {item.description || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {item.order ?? 0}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.visibleInNavigation ? (
                          <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3" /> Visible
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Hidden</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/${item.kind === 'section' ? 'section' : item.kind === 'region' ? 'region' : 'topic'}/${item.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            title="Preview Landing Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, item, targetReassignId: '' })}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:hover:bg-rose-500/10 text-zinc-400"
                            title="Safe Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 5. MODAL: CREATE / EDIT TAXONOMY ITEM */}
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
                    {editingItem ? `Edit ${formData.kind}: ${editingItem.name}` : `Create New ${formData.kind}`}
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                {/* Kind Dimension Selector (if new) */}
                {!editingItem && (
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Dimension Kind</label>
                    <select
                      value={formData.kind}
                      onChange={(e) => setFormData((prev) => ({ ...prev, kind: e.target.value, parent: '' }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-bold outline-none"
                    >
                      {DIMENSIONS.filter((d) => d.id !== 'overview').map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Artificial Intelligence"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^\w-]/g, '') }));
                    }}
                    placeholder="artificial-intelligence"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-mono outline-none"
                  />
                </div>

                {/* Parent (For Hierarchical Topics & Regions) */}
                {(formData.kind === 'topic' || formData.kind === 'region') && (
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Parent Hierarchy</label>
                    <select
                      value={formData.parent || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, parent: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    >
                      <option value="">Root Node (No Parent)</option>
                      {items
                        .filter((item) => !editingItem || item._id !== editingItem._id)
                        .map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.ancestors?.length ? `${item.ancestors.map((a) => a.name).join(' › ')} › ` : ''}
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Editorial scope and coverage description..."
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none resize-none"
                  />
                </div>

                {/* Regional Hub Toggle (For region kind) */}
                {formData.kind === 'region' && (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-purple-900 dark:text-purple-300">Regional Hub Portal</p>
                      <p className="text-[10px] text-zinc-500">Designates this location as a major landing hub (e.g. Kashmir Bureau)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isHub}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isHub: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>
                )}

                {/* Navigation & Status Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 cursor-pointer">
                    <span className="font-bold">Visible in Navigation</span>
                    <input
                      type="checkbox"
                      checked={formData.visibleInNavigation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, visibleInNavigation: e.target.checked }))}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 cursor-pointer">
                    <span className="font-bold">Active Status</span>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>
                </div>

                {/* SEO Workspace */}
                <div className="pt-2 border-t border-zinc-200 dark:border-white/10 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Landing Page SEO</span>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Meta Title</label>
                      <span className="text-[10px] font-mono text-zinc-400">{formData.seo?.title?.length || 0} / 60</span>
                    </div>
                    <input
                      type="text"
                      value={formData.seo?.title || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, title: e.target.value } }))}
                      placeholder={formData.name || 'SEO title...'}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Meta Description</label>
                      <span className="text-[10px] font-mono text-zinc-400">{formData.seo?.description?.length || 0} / 160</span>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.seo?.description || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, description: e.target.value } }))}
                      placeholder="SEO description for search engines..."
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none resize-none"
                    />
                  </div>
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
                    <span>{editingItem ? 'Save Changes' : 'Create Item'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: MOVE / REPARENT NODE (With Circular Loop Protection) */}
      <AnimatePresence>
        {moveModal.open && moveModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-blue-500" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Move "{moveModal.item.name}"
                  </h3>
                </div>
                <button onClick={() => setMoveModal({ open: false, item: null, targetParentId: '' })} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select a new parent in the hierarchy. Ancestor paths for this node and all descendants will be automatically recalculated.
              </p>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">New Parent Node</label>
                <select
                  value={moveModal.targetParentId}
                  onChange={(e) => setMoveModal((prev) => ({ ...prev, targetParentId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                >
                  <option value="">Root Node (Move to top level)</option>
                  {items
                    .filter((i) => i._id !== moveModal.item._id && !(i.ancestors || []).some((a) => a._id === moveModal.item._id))
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.ancestors?.length ? `${item.ancestors.map((a) => a.name).join(' › ')} › ` : ''}
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMoveModal({ open: false, item: null, targetParentId: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteMove}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  Confirm Move
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL: MERGE TAGS SUITE */}
      <AnimatePresence>
        {mergeModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Merge className="w-4 h-4 text-purple-500" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Merge Duplicate Tags
                  </h3>
                </div>
                <button onClick={() => setMergeModal({ open: false, sourceTag: '', targetTag: '' })} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Migrates all articles referencing the source tag to the target tag without creating duplicate tags.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Source Tag (To be merged & removed)</label>
                  <input
                    type="text"
                    value={mergeModal.sourceTag}
                    onChange={(e) => setMergeModal((prev) => ({ ...prev, sourceTag: e.target.value }))}
                    placeholder="e.g. react-js"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Target Canonical Tag (To keep)</label>
                  <input
                    type="text"
                    value={mergeModal.targetTag}
                    onChange={(e) => setMergeModal((prev) => ({ ...prev, targetTag: e.target.value }))}
                    placeholder="e.g. reactjs"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMergeModal({ open: false, sourceTag: '', targetTag: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteMerge}
                  disabled={submitting || !mergeModal.sourceTag || !mergeModal.targetTag}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  Execute Merge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. MODAL: SAFE DELETE & REASSIGNMENT */}
      <AnimatePresence>
        {deleteModal.open && deleteModal.item && (
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
                    Safe Delete "{deleteModal.item.name}"
                  </h3>
                </div>
                <button onClick={() => setDeleteModal({ open: false, item: null, targetReassignId: '' })} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If articles are currently referencing this {deleteModal.item.kind}, you can optionally reassign them to another {deleteModal.item.kind} before deleting.
              </p>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Optional: Reassign Articles To</label>
                <select
                  value={deleteModal.targetReassignId}
                  onChange={(e) => setDeleteModal((prev) => ({ ...prev, targetReassignId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                >
                  <option value="">Do not reassign (Direct Delete)</option>
                  {items
                    .filter((i) => i._id !== deleteModal.item._id)
                    .map((item) => (
                      <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ open: false, item: null, targetReassignId: '' })}
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
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
