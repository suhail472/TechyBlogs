import { ImageResponse } from 'next/og';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';

export const runtime = 'nodejs';

export const alt = 'TeachyBlogs Article';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }) {
  const { slug } = await params;
  
  await connectToDatabase();
  const post = await Post.findOne({ slug, status: 'published' }).lean();

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'linear-gradient(to right, #0f172a, #1e293b)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          TechyBlogs
        </div>
      ),
      {
        ...size,
      }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom right, #0f172a, #0b0f19)',
          padding: '80px',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow dots decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            filter: 'blur(80px)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            filter: 'blur(80px)',
            display: 'flex',
          }}
        />

        {/* Brand Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              background: '#3b82f6',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              marginRight: '12px',
            }}
          >
            T
          </div>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              display: 'flex',
            }}
          >
            Techy<span style={{ color: '#3b82f6' }}>Blogs</span>
          </span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '40px',
            marginBottom: '40px',
          }}
        >
          {/* Category Badges */}
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            {(post.categories || []).slice(0, 2).map((cat) => (
              <span
                key={cat}
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#60a5fa',
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  marginRight: '10px',
                }}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'white',
              maxWidth: '950px',
              display: 'flex',
              marginBottom: '20px',
            }}
          >
            {post.title}
          </div>

          {/* Excerpt */}
          <div
            style={{
              fontSize: '20px',
              color: '#94a3b8',
              lineHeight: 1.5,
              maxWidth: '850px',
              display: 'flex',
            }}
          >
            {post.excerpt}
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                marginRight: '12px',
              }}
            >
              {post.author ? post.author.split(' ').map(n=>n[0]).join('') : 'SH'}
            </div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0', display: 'flex' }}>
              {post.author || 'Suheel Hilal'}
            </span>
          </div>

          <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 'bold', display: 'flex' }}>
            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
