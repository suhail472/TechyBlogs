import Taxonomy from '../models/taxonomy.model.js';
import Post from '../models/post.model.js';

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
}

export const taxonomyService = new TaxonomyService();
export default taxonomyService;
