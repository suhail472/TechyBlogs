'use client';

import { use } from 'react';
import BlogEditor from '@/components/admin/BlogEditor';

export default function EditPostPage({ params }) {
  const { id } = use(params);
  return <BlogEditor id={id} />;
}
