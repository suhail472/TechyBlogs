import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Taxonomy from '@/lib/models/taxonomy.model';
import { verifyAuth } from '@/lib/middlewares/auth';
import { canManageTaxonomy } from '@/lib/services/editorial.service';
import { taxonomyService } from '@/lib/services/taxonomy.service';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    if (!canManageTaxonomy(user)) {
      return NextResponse.json({ success: false, message: 'Editor permission required' }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();

    if (body.parent) {
      await taxonomyService.validateParentAssignment(id, body.parent);
    }

    if (body.name && !body.slug) {
      body.slug = String(body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const item = await Taxonomy.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!item) {
      return NextResponse.json({ success: false, message: 'Taxonomy item not found' }, { status: 404 });
    }

    // Recompute materialized ancestor paths for this item and all downstream children
    await taxonomyService.updateAncestorsRecursively(id);

    const refreshed = await Taxonomy.findById(id).lean();
    return NextResponse.json({ success: true, data: refreshed });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    if (!canManageTaxonomy(user)) {
      return NextResponse.json({ success: false, message: 'Editor permission required' }, { status: 403 });
    }
    const { id } = await params;
    const result = await taxonomyService.safeDelete(id);
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
