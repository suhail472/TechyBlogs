import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables manually from .env.local
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim();
          const value = trimmed.substring(index + 1).trim();
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.warn('Failed to parse .env.local manually:', err.message);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teachyblogs';

const postSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  excerpt: String,
  content: String,
  image: String,
  tags: [String],
  categories: [String],
  author: { type: String, default: 'Suheel Hilal' },
  status: { type: String, default: 'published' },
  views: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now },
  faqs: [{ question: String, answer: String }]
}, { timestamps: true });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

async function seed() {
  try {
    console.log('Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Post 1: Next.js 16 Server Actions & Performance Optimization
    const post1 = {
      title: 'Optimizing Next.js 16 App Router Performance and Server Actions',
      slug: 'optimizing-nextjs-16-app-router-server-actions',
      excerpt: 'Learn how to maximize performance in Next.js 16. This guide details React Server Components, server action security, client-side hydration, and dynamic edge rendering.',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200&h=630',
      categories: ['Next.js', 'Development', 'Technology'],
      tags: ['Next.js 16', 'React Server Components', 'Server Actions', 'Web Performance', 'SEO'],
      author: 'Suheel Hilal',
      status: 'published',
      faqs: [
        {
          question: 'What is the main benefit of Next.js 16 Server Actions?',
          answer: 'Server Actions allow developers to define server-side database mutations directly inside React components. This eliminates the need to build separate REST API routes, reducing boilerplates and enhancing overall data transaction safety.'
        },
        {
          question: 'How does Partial Prerendering (PPR) improve frontend loading speeds?',
          answer: 'Partial Prerendering combines static layout parts with dynamic placeholders. The static shell is served instantly from edge servers while the dynamic segments load asynchronously as backend actions finish executing, removing layout shift.'
        },
        {
          question: 'Is it safe to run database commands inside Server Actions directly?',
          answer: 'Yes, because Server Actions execute exclusively on the server side. However, you must always validate user request input data using libraries like Zod and check permissions before calling database commands.'
        }
      ],
      content: `# Building Fast Applications with Next.js 16 and React Server Components

The landscape of modern web design is constantly evolving. In 2026, building high-performance websites requires a deep understanding of React Server Components (RSC) and server-side data mutations. Next.js 16 provides developers with a robust environment to pre-render layout content, minimize client-side javascript bundles, and deliver fast visual experiences for users.

This guide explores the best practices for structuring Next.js 16 code, securing backend actions, and optimizing dynamic components.

---

## 1. The Core Architecture of React Server Components

By default, files created inside the Next.js App Router render as Server Components. This architecture shifts component rendering from the client browser to the build server or edge networks. When a user requests a page, Next.js executes the logic on the server and generates a lightweight payload representation of the document structure.

This approach offers significant search engine optimization benefits. Search engine crawlers receive fully structured HTML headings and descriptive paragraph tags instantly. There is no need for search engine bots to run heavy javascript bundles to index layout elements.

### Reducing Hydration Mismatches

Because server components render on the backend, you must keep dynamic, browser-specific details away from initial server execution blocks. Let us review a standard structure that avoids hydration mismatches:

\`\`\`javascript
// src/components/shared/FormattedDate.jsx
'use client';

import { useEffect, useState } from 'react';

export default function FormattedDate({ dateString }) {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    setFormatted(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  return <span className="font-mono text-zinc-500">{formatted}</span>;
}
\`\`\`

Using this client component pattern ensures that dynamic client data loads only after browser hydration finishes.

---

## 2. Securing and Optimizing Next.js Server Actions

Server Actions in Next.js 16 let developers handle database updates directly inside the component lifecycle. Instead of configuring standalone routing folders, you can declare asynchronous functions marked with the directive \`use server\`.

![Web Design Optimization Flow](https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1200&h=630)

### Secure Database Mutation Pattern

To maintain authoritative trustworthiness, always validate request payloads and user permissions inside the action function:

\`\`\`javascript
// src/actions/posts.js
'use server';

import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import { revalidatePath } from 'next/cache';

export async function createPostAction(formData, sessionToken) {
  if (!sessionToken) {
    throw new Error('Unauthorized access request.');
  }

  const title = formData.get('title');
  const content = formData.get('content');

  // Input validation
  if (!title || title.length < 5) {
    throw new Error('Title must be at least 5 characters long.');
  }

  await connectToDatabase();
  
  const slug = title.toLowerCase().replace(/\\s+/g, '-');
  await Post.create({ title, slug, content });

  revalidatePath('/blogs');
  return { success: true };
}
\`\`\`

By performing input sanitation and credential verification on the server side, you protect your MongoDB instance from malicious attacks and data leaks.

---

## 3. Managing Hydration and State on the Frontend

When writing highly interactive user interfaces, client components are necessary. Next.js 16 handles state variables and browser actions smoothly using Zustand and standard React hooks. To keep pages responsive, extract stateful widgets into dedicated components rather than making the entire page document a client module.

### Optimistic UI Updates

Users expect interfaces to react instantly when they click a button. You can achieve this using React 19's optimistic state hooks, which render action results before server verification returns:

\`\`\`javascript
// src/components/admin/LikeButton.jsx
'use client';

import { useOptimistic, startTransition } from 'react';
import { Heart } from 'lucide-react';

export default function LikeButton({ initialLikes, onLikeAction }) {
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(
    initialLikes,
    (state, newLikeCount) => newLikeCount
  );

  const handleLike = () => {
    startTransition(async () => {
      setOptimisticLikes(optimisticLikes + 1);
      await onLikeAction();
    });
  };

  return (
    <button onClick={handleLike} className="flex items-center gap-2 text-rose-500">
      <Heart className="w-5 h-5 fill-current" />
      <span>{optimisticLikes} Likes</span>
    </button>
  );
}
\`\`\`

Optimistic rendering makes applications feel extremely fast, since UI elements update within milliseconds of interaction.

---

## 4. Partial Prerendering and Caching Configurations

Next.js 16 introduces enhanced stability for Partial Prerendering (PPR). This model enables you to serve static parts of a layout immediately from edge networks while keeping dynamic zones unresolved. The dynamic segments resolve in the background and stream to the browser.

### Configuring PPR in NextConfig

To enable these latency improvements, configure your next configuration file:

\`\`\`javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    ppr: 'incremental',
  },
};

export default nextConfig;
\`\`\`

By marking specific paths for incremental prerendering, you combine the caching advantages of static generation with the flexibility of server-rendered components.

---

## Conclusion

Optimizing Next.js 16 layouts requires balancing backend processing and frontend interactivity. By using React Server Components for content delivery and keeping client states focused in small interactive modules, you maximize page load speeds and search engine indices. Securing server actions and using edge databases ensures your modern web app remains stable and fast for global visitors.`
    };

    // Post 2: Edge Database Architectures
    const post2 = {
      title: 'Mastering Edge Database Architectures: Distributed Systems for Developers',
      slug: 'mastering-edge-database-architectures-distributed-systems',
      excerpt: 'Explore edge database replication architectures. Learn how serverless runtimes connect to distributed data layers like Turso to achieve low-latency applications.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200&h=630',
      categories: ['Design', 'Technology', 'Trends'],
      tags: ['Edge Databases', 'Distributed Systems', 'Web Performance', 'Cloudflare Workers', 'Database Replication'],
      author: 'Suheel Hilal',
      status: 'published',
      faqs: [
        {
          question: 'Why are traditional centralized databases slow for global visitors?',
          answer: 'Traditional databases store data in a single physical location (e.g. US-East). When a global user requests data, the query packet must travel thousands of miles to the data center and back, creating substantial round-trip network delays.'
        },
        {
          question: 'How do distributed read-replicas solve the database latency problem?',
          answer: 'Replication systems create synchronized copies of the primary database in multiple edge regions. Users write data to the primary center, which automatically propagates to local replicas, allowing nearby users to read data in microseconds.'
        },
        {
          question: 'Are distributed database architectures complex to configure?',
          answer: 'Modern edge services like Turso and SQLite replication simplify setup. Cloud providers manage cluster synchronization, write locks, and read traffic routing automatically, reducing operational overhead.'
        }
      ],
      content: `# Edge Database Architectures: Distributed Systems for Modern Web Developers

As cloud architecture shifts toward edge runtime environments, traditional centralized database paradigms are becoming bottlenecks. Serverless functions on edge networks execute user requests close to their physical locations, yet queries must travel thousands of miles to centralized database servers.

To resolve these network delays, modern software engineering adopts distributed database systems. Developers can deploy read-replicas and distributed schemas that keep data storage physically near edge execution functions.

---

## 1. The Bottlenecks of Centralized Data Storage

For years, standard web applications relied on single-instance relational databases hosted in a single regional center, such as AWS us-east-1. If a visitor from London requested data, the edge runtime routing redirected the request to the central server, queried the tables, and sent results back across the ocean.

![Global Server Network Illustration](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200&h=630)

This setup creates a permanent latency barrier, regardless of frontend code optimizations. Round-trip packets are limited by the speed of light in fiber optic cables. To reduce latency, we must store the database records directly where the edge runtime executes code.

---

## 2. Distributed Database Replication Models

To optimize access times, distributed architectures use data replication. Two main designs dictate how data travels across global clusters:

1. **Single-Primary, Multi-Replica**: All write actions target a single primary database instance. The database engine syncs these changes to read-only replicas globally. Global reads are fast, but writes still face regional latency.
2. **Multi-Primary Replication**: Write actions can target any active replica in the network. The system resolves conflicts asynchronously. This model is highly complex but achieves rapid write performance for global visitors.

### Distributed Reads Performance Comparison

Let us review a standard latency comparison chart showing the speed gains achieved by edge replica deployments:

| User Location | Distance to US-East | Centralized Read Latency | Local Edge Read Latency |
|---|---|---|---|
| London, UK | ~3,500 miles | 85ms | 3ms |
| Frankfurt, Germany | ~4,000 miles | 98ms | 4ms |
| Tokyo, Japan | ~6,700 miles | 170ms | 6ms |

Creating replica instances near target audiences reduces response times to single digits, ensuring pages render instantly.

---

## 3. Integrating distributed database instances with Edge Runtimes

Edge database providers like Turso make distributed SQLite architectures easy to deploy. Let us review a standard setup connecting an edge worker to a regional replica:

\`\`\`javascript
// src/services/database.js
import { createClient } from '@libsql/client';

const dbClient = createClient({
  url: process.env.DATABASE_URL || 'libsql://local-replica-url.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export async function fetchPublishedArticles() {
  const result = await dbClient.execute({
    sql: 'SELECT * FROM posts WHERE status = ? ORDER BY published_at DESC LIMIT 10',
    args: ['published'],
  });
  
  return result.rows;
}
\`\`\`

By configuring the client client connection to point to local replica routes, the edge runtime fetches article rows with minimum latency.

---

## 4. Addressing Data Consistency and Sync Concerns

Distributed setups require resolving write synchronization. In relational models, write operations must respect consistency and transaction blocks. If two users write to different replicas simultaneously, the system must synchronize conflicts without breaking relations.

Most single-primary systems route write queries to the main database center while read calls resolve locally. This balance ensures read queries remain fast while keeping data records accurate.

---

## Conclusion

Deploying distributed edge databases is key to building modern, low-latency applications. By matching serverless runtimes with local read-replicas, software engineers overcome physical distance barriers, ensuring global audiences experience fast load times.`
    };

    // Clean duplicates and seed
    console.log('Seeding dynamic tech articles...');
    await Post.deleteOne({ slug: post1.slug });
    await Post.deleteOne({ slug: post2.slug });

    await Post.create(post1);
    await Post.create(post2);

    console.log('Articles seeded successfully in MongoDB database!');
    
    await mongoose.disconnect();
    console.log('Database disconnected.');
  } catch (error) {
    console.error('Seed execution error:', error.message);
    process.exit(1);
  }
}

seed();
