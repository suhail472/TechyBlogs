import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Taxonomy from '@/lib/models/taxonomy.model';

/**
 * Build nested tree from flat list of taxonomy nodes
 */
function buildTree(items) {
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
}

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get('kind') || 'topic';

    const items = await Taxonomy.find({ kind, active: true })
      .sort({ order: 1, name: 1 })
      .select('_id name slug kind type parent isHub description capabilities ancestors order')
      .lean();

    const tree = buildTree(items);
    return NextResponse.json({ success: true, count: items.length, data: tree });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
