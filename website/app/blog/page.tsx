import Link from 'next/link';
import { getPublishedPosts } from '@/lib/blog';

export default function BlogPage() {
  const posts = getPublishedPosts();

  return (
    <div className="container mx-auto py-16 px-4 max-w-4xl">
      <h1 className="text-5xl font-bold mb-12">Blog</h1>
      
      {posts.length === 0 ? (
        <div className="p-8 bg-card rounded-lg border border-foreground/10">
          <p className="text-sm text-foreground/60 mb-2">Coming soon</p>
          <h2 className="text-2xl font-medium mb-2">Stay tuned for updates</h2>
          <p className="text-foreground/70">
            We&apos;ll be sharing insights about AI workflows, visual programming, and the latest Flyde features here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block p-8 bg-card/30 rounded-lg hover:bg-card/50 transition-colors border border-foreground/10"
            >
              <div className="flex flex-col">
                <time className="text-sm text-foreground/60 mb-2">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <h2 className="text-3xl font-medium mb-3">{post.title}</h2>
                <p className="text-foreground/80 mb-4 text-lg">{post.description}</p>
                <div className="text-sm text-foreground/60">By {post.author}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 