import { getPublishedDocs } from '@/lib/docs';
import { ClientSidebar } from './client-sidebar';

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const docs = getPublishedDocs();

  return (
    <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8 py-8">
      <aside className="md:w-64 flex-shrink-0">
        <div className="sticky top-24">
          <div className="mb-4">
            <h2 className="font-medium text-lg mb-2">Documentation</h2>
          </div>
          <ClientSidebar docs={docs} />
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <article className="prose prose-slate max-w-none text-white">
          {children}
        </article>
      </div>
    </div>
  );
} 