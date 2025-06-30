import { getPostBySlug, getAllPostSlugs } from '@/lib/blog';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const paths = getAllPostSlugs();
  return paths;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }
  
  return {
    title: `${post.title} | Flyde Blog`,
    description: post.description,
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);
  
  if (!post || post.draft) {
    notFound();
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Link href="/blog" className="text-primary mb-4 inline-block hover:underline">
        ← Back to all posts
      </Link>
      
      <article className="prose prose-lg prose-slate dark:prose-invert max-w-none">
        <header className="mb-8 not-prose">
          <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
          <div className="text-foreground/60 mb-2">
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-foreground/60">By {post.author}</div>
        </header>
        
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
            h2: (props) => <h2 className="text-2xl font-bold mt-8 mb-3" {...props} />,
            h3: (props) => <h3 className="text-xl font-bold mt-6 mb-2" {...props} />,
            p: (props) => <p className="my-4" {...props} />,
            ul: (props) => <ul className="list-disc pl-6 my-4" {...props} />,
            ol: (props) => <ol className="list-decimal pl-6 my-4" {...props} />,
            li: (props) => <li className="my-1" {...props} />,
            a: (props) => <a className="text-primary hover:underline" {...props} />,
            img: (props) => <img className="my-6 rounded-md" {...props} />
          }}
        >
          {post.content}
        </ReactMarkdown>
      </article>
    </div>
  );
} 