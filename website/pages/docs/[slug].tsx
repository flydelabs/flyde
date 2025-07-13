import { getDocBySlug, getAllDocSlugs, getPublishedDocs } from '@/lib/docs';
import type { DocPage } from '@/lib/docs';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Head from 'next/head';
import { ClientSidebar } from '@/components/ClientSidebar';

interface DocPageProps {
  doc: DocPage;
  allDocs: DocPage[];
}

export default function DocPage({ doc, allDocs }: DocPageProps) {
  if (!doc) {
    return <div>Documentation not found</div>;
  }

  return (
    <>
      <Head>
        <title>{doc.title} | Flyde Documentation</title>
        <meta name="description" content={doc.description} />
      </Head>
      
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8 py-8">
        <aside className="md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="mb-4">
              <h2 className="font-medium text-lg mb-2">Documentation</h2>
            </div>
            <ClientSidebar docs={allDocs} />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <article className="prose prose-slate max-w-none text-white">
            <Link href="/docs" className="text-primary mb-4 inline-block hover:underline">
              ← Back to documentation
            </Link>
            
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
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params!;
  const doc = getDocBySlug(slug as string);
  const allDocs = getPublishedDocs();
  
  if (!doc || doc.draft) {
    return {
      notFound: true,
    };
  }
  
  // Clean up undefined values for serialization
  const cleanedDoc = {
    ...doc,
    draft: doc.draft || false,
    description: doc.description || null,
    sidebar_position: doc.sidebar_position || null,
  };
  
  const cleanedAllDocs = allDocs.map(d => ({
    ...d,
    draft: d.draft || false,
    description: d.description || null,
    sidebar_position: d.sidebar_position || null,
  }));
  
  return {
    props: {
      doc: cleanedDoc,
      allDocs: cleanedAllDocs,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllDocSlugs();
  
  return {
    paths: paths,
    fallback: false,
  };
};