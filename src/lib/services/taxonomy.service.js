import Taxonomy from '../models/taxonomy.model.js';
import Post from '../models/post.model.js';
import { serialiseActor } from './editorial.service.js';

class TaxonomyService {
  /**
   * Recompute and update the materialized ancestors array for a node and all its descendants
   */
  async updateAncestorsRecursively(nodeId) {
    const node = await Taxonomy.findById(nodeId);
    if (!node) return;

    let computedAncestors = [];
    if (node.parent) {
      const parentNode = await Taxonomy.findById(node.parent).lean();
      if (parentNode) {
        computedAncestors = [
          ...(parentNode.ancestors || []),
          {
            _id: parentNode._id,
            name: parentNode.name,
            slug: parentNode.slug,
            kind: parentNode.kind,
          },
        ];
      }
    }

    node.ancestors = computedAncestors;
    await node.save();

    // Recursively update all immediate children
    const children = await Taxonomy.find({ parent: node._id });
    for (const child of children) {
      await this.updateAncestorsRecursively(child._id);
    }
  }

  /**
   * Verify parent assignment is valid and does not cause circular reference
   */
  async validateParentAssignment(nodeId, newParentId) {
    if (!newParentId) return true;
    if (String(nodeId) === String(newParentId)) {
      throw new Error('A taxonomy item cannot be its own parent');
    }

    const parentNode = await Taxonomy.findById(newParentId).lean();
    if (!parentNode) {
      throw new Error('Selected parent taxonomy does not exist');
    }

    // Check if new parent is currently a descendant of this node (circular dependency check)
    const isDescendant = (parentNode.ancestors || []).some(
      (a) => String(a._id) === String(nodeId)
    );
    if (isDescendant) {
      throw new Error('Cannot set a descendant node as parent (circular hierarchy detected)');
    }

    return true;
  }

  /**
   * Move / Reparent node with circular protection & recursive ancestor updates
   */
  async moveNode(nodeId, newParentId, user = null) {
    await this.validateParentAssignment(nodeId, newParentId);
    const node = await Taxonomy.findById(nodeId);
    if (!node) throw new Error('Taxonomy item not found');

    const previousParent = node.parent;
    node.parent = newParentId || null;
    await node.save();

    await this.updateAncestorsRecursively(nodeId);

    return {
      success: true,
      message: `Taxonomy item "${node.name}" successfully moved.`,
      data: await Taxonomy.findById(nodeId).lean(),
    };
  }

  /**
   * Count active article references for safe deletion check
   */
  async countArticleReferences(taxonomyId) {
    const query = {
      $or: [
        { primaryTopic: taxonomyId },
        { topics: taxonomyId },
        { primaryRegion: taxonomyId },
        { regions: taxonomyId },
        { entities: taxonomyId },
        { series: taxonomyId },
        { coverage: taxonomyId },
      ],
    };
    return await Post.countDocuments(query);
  }

  /**
   * Safe delete taxonomy with cascade protection
   */
  async safeDelete(taxonomyId) {
    const childrenCount = await Taxonomy.countDocuments({ parent: taxonomyId });
    if (childrenCount > 0) {
      throw new Error(
        `Cannot delete this taxonomy item because it has ${childrenCount} child sub-categories. Please re-assign or delete sub-categories first.`
      );
    }

    const referencedCount = await this.countArticleReferences(taxonomyId);
    if (referencedCount > 0) {
      throw new Error(
        `Cannot delete this taxonomy item because ${referencedCount} article(s) are actively referencing it. Please re-assign those articles first.`
      );
    }

    await Taxonomy.findByIdAndDelete(taxonomyId);
    return { success: true, message: 'Taxonomy item safely deleted' };
  }

  /**
   * Reassign all article references from source taxonomy to target taxonomy
   */
  async reassignArticles(sourceId, targetId, user = null) {
    const source = await Taxonomy.findById(sourceId);
    const target = await Taxonomy.findById(targetId);
    if (!source || !target) {
      throw new Error('Both source and target taxonomy items must exist for reassignment');
    }

    // 1. Primary Topic & Secondary Topics
    await Post.updateMany({ primaryTopic: sourceId }, { $set: { primaryTopic: targetId } });
    await Post.updateMany({ topics: sourceId }, { $set: { 'topics.$': targetId } });

    // 2. Primary Region & Secondary Regions
    await Post.updateMany({ primaryRegion: sourceId }, { $set: { primaryRegion: targetId } });
    await Post.updateMany({ regions: sourceId }, { $set: { 'regions.$': targetId } });

    // 3. Entities, Series, Coverage
    await Post.updateMany({ entities: sourceId }, { $set: { 'entities.$': targetId } });
    await Post.updateMany({ series: sourceId }, { $set: { series: targetId } });
    await Post.updateMany({ coverage: sourceId }, { $set: { 'coverage.$': targetId } });

    return {
      success: true,
      message: `All articles referencing "${source.name}" have been reassigned to "${target.name}".`,
    };
  }

  /**
   * Merge Tag: Replaces source tag string or ID with target tag string across all posts
   */
  async mergeTags(sourceTagNameOrId, targetTagNameOrId, user = null) {
    let sourceName = sourceTagNameOrId;
    let targetName = targetTagNameOrId;

    // Check if IDs were passed
    if (sourceTagNameOrId.length === 24) {
      const sourceDoc = await Taxonomy.findById(sourceTagNameOrId);
      if (sourceDoc) sourceName = sourceDoc.name;
    }
    if (targetTagNameOrId.length === 24) {
      const targetDoc = await Taxonomy.findById(targetTagNameOrId);
      if (targetDoc) targetName = targetDoc.name;
    }

    if (sourceName.toLowerCase() === targetName.toLowerCase()) {
      throw new Error('Cannot merge a tag into itself');
    }

    // 1. Remove sourceName from posts that ALREADY have targetName (avoid duplicate tag arrays)
    await Post.updateMany(
      { tags: { $all: [sourceName, targetName] } },
      { $pull: { tags: sourceName } }
    );

    // 2. Replace sourceName with targetName on remaining posts
    const updateResult = await Post.updateMany(
      { tags: sourceName },
      { $set: { 'tags.$': targetName } }
    );

    // 3. Delete or deactivate the source tag document if it exists in Taxonomy
    await Taxonomy.deleteMany({
      kind: 'tag',
      $or: [{ name: sourceName }, { slug: sourceName.toLowerCase().replace(/[^\w-]/g, '') }],
    });

    return {
      success: true,
      message: `Successfully merged tag "${sourceName}" into "${targetName}". ${updateResult.modifiedCount} stories updated.`,
      updatedCount: updateResult.modifiedCount,
    };
  }

  /**
   * Overview dashboard metrics and health scan
   */
  async getDashboardOverview() {
    const [countsByKind, hubsCount, activeCount, inactiveCount, healthReport] = await Promise.all([
      Taxonomy.aggregate([
        {
          $group: {
            _id: '$kind',
            count: { $sum: 1 },
            activeCount: { $sum: { $cond: ['$active', 1, 0] } },
          },
        },
      ]),
      Taxonomy.countDocuments({ isHub: true, active: true }),
      Taxonomy.countDocuments({ active: true }),
      Taxonomy.countDocuments({ active: false }),
      this.getTaxonomyHealthReport(),
    ]);

    const stats = {
      total: 0,
      sections: 0,
      topics: 0,
      regions: 0,
      contentTypes: 0,
      tags: 0,
      entities: 0,
      series: 0,
      hubs: hubsCount,
      active: activeCount,
      inactive: inactiveCount,
    };

    countsByKind.forEach((c) => {
      stats.total += c.count;
      if (c._id === 'section') stats.sections = c.count;
      if (c._id === 'topic') stats.topics = c.count;
      if (c._id === 'region') stats.regions = c.count;
      if (c._id === 'content_type') stats.contentTypes = c.count;
      if (c._id === 'tag') stats.tags = c.count;
      if (c._id === 'entity') stats.entities = c.count;
      if (c._id === 'series') stats.series = c.count;
    });

    return {
      stats,
      healthReport,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health & Integrity Checker
   */
  async getTaxonomyHealthReport() {
    const issues = [];

    // 1. Check for orphaned children with missing parent records
    const allWithParents = await Taxonomy.find({ parent: { $ne: null } }).select('_id name parent ancestors').lean();
    const parentIds = [...new Set(allWithParents.map((t) => String(t.parent)))];
    const existingParents = await Taxonomy.find({ _id: { $in: parentIds } }).select('_id').lean();
    const existingParentIdSet = new Set(existingParents.map((p) => String(p._id)));

    allWithParents.forEach((item) => {
      if (!existingParentIdSet.has(String(item.parent))) {
        issues.push({
          type: 'orphan_parent',
          severity: 'high',
          itemId: item._id,
          name: item.name,
          message: `Taxonomy item "${item.name}" references a non-existent parent ID.`,
        });
      }
    });

    // 2. Check for inactive items marked as visible in navigation
    const inactiveInNav = await Taxonomy.find({ active: false, visibleInNavigation: true }).select('_id name kind').lean();
    inactiveInNav.forEach((item) => {
      issues.push({
        type: 'inactive_in_navigation',
        severity: 'medium',
        itemId: item._id,
        name: item.name,
        message: `Inactive ${item.kind} "${item.name}" is still marked as visible in navigation.`,
      });
    });

    return {
      isHealthy: issues.length === 0,
      issuesCount: issues.length,
      issues,
    };
  }

  /**
   * Get Hierarchical Nested Tree with Article Counts
   */
  async getHierarchyTree(kind = 'topic') {
    const nodes = await Taxonomy.find({ kind }).sort({ order: 1, name: 1 }).lean();

    // Compute article counts for all nodes in this kind
    const tree = [];
    const nodeMap = new Map();

    nodes.forEach((n) => {
      nodeMap.set(String(n._id), {
        ...n,
        children: [],
      });
    });

    nodes.forEach((n) => {
      const mapped = nodeMap.get(String(n._id));
      if (n.parent && nodeMap.has(String(n.parent))) {
        nodeMap.get(String(n.parent)).children.push(mapped);
      } else {
        tree.push(mapped);
      }
    });

    return tree;
  }
}

export const taxonomyService = new TaxonomyService();
export default taxonomyService;
