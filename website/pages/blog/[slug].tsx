import { getPostBySlug, getAllPostSlugs } from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Head from 'next/head';

interface BlogPostPageProps {
  post: BlogPost;
}

export default function BlogPostPage({ post }: BlogPostPageProps) {
  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <>
      <Head>
        <title>{post.title} | Flyde Blog</title>
        <meta name="description" content={post.description} />
      </Head>
      
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
              img: (props) => <img className="my-6 rounded-md" alt="" {...props} />,
              pre: ({ children }) => <div>{children}</div>,
              code: ({ children, className, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const isInline = !className;
                
                if (isInline) {
                  return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
                }
                
                return (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    customStyle={{
                      margin: '1.5rem 0',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params!;
  const post = getPostBySlug(slug as string);
  
  if (!post || post.draft) {
    return {
      notFound: true,
    };
  }
  
  // Clean up undefined values for serialization
  const cleanedPost = {
    ...post,
    draft: post.draft || false,
  };
  
  return {
    props: {
      post: cleanedPost,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostSlugs();
  
  return {
    paths: paths,
    fallback: false,
  };
};