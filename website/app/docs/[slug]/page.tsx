import { getDocBySlug, getAllDocSlugs } from '@/lib/docs';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const paths = getAllDocSlugs();
  return paths;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  
  if (!doc) {
    return {
      title: 'Documentation Not Found',
    };
  }
  
  return {
    title: `${doc.title} | Flyde Documentation`,
    description: doc.description,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  
  if (!doc || doc.draft) {
    notFound();
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Link href="/docs" className="text-primary mb-4 inline-block hover:underline">
        ← Back to documentation
      </Link>
      
      <article className="prose prose-lg prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />,
            h2: (props) => <h2 className="text-3xl font-bold mt-8 mb-3" {...props} />,
            h3: (props) => <h3 className="text-2xl font-bold mt-6 mb-2" {...props} />,
            h4: (props) => <h4 className="text-xl font-bold mt-4 mb-2" {...props} />,
            p: (props) => <p className="my-4 leading-7" {...props} />,
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
            blockquote: (props) => (
              <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-foreground/80" {...props} />
            ),
          }}
        >
          {doc.content}
        </ReactMarkdown>
      </article>
    </div>
  );
} 