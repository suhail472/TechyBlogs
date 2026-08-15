import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Admin from '@/lib/models/admin.model';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const currentUser = await verifyAuth(req);
    const { id } = await params;

    const isSelf = String(currentUser?._id) === String(id);
    const isAdmin = ['admin', 'superadmin'].includes(currentUser?.role);

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized to update this profile' }, { status: 403 });
    }

    const body = await req.json();
    delete body.password; // Password changes should go through auth/password

    if (body.role && !isAdmin) {
      delete body.role; // Non-admins cannot elevate roles
    }

    if (body.name && !body.slug) {
      body.slug = String(body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const author = await Admin.findByIdAndUpdate(id, body, { new: true, runValidators: true }).select('-password');
    if (!author) {
      return NextResponse.json({ success: false, message: 'Author not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: author });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
