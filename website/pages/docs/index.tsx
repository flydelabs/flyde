import Link from "next/link";
import { getPublishedDocs } from '@/lib/docs';
import type { DocPage } from '@/lib/docs';
import { BookOpen, ArrowRight, Github, HelpCircle, Zap, Code2, Layers, Settings, Rocket, FileText, Wrench } from 'lucide-react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { ClientSidebar } from '@/components/ClientSidebar';

interface DocsPageProps {
  docs: DocPage[];
}

export default function DocsPage({ docs }: DocsPageProps) {
  const iconMap = [Rocket, BookOpen, Zap, Wrench, FileText];

  return (
    <>
      <Head>
        <title>Documentation - Flyde</title>
        <meta name="description" content="Master AI workflows and visual programming with comprehensive guides and tutorials" />
      </Head>
      
      <div className="min-h-screen bg-background">
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
              <div className="py-4 max-w-6xl">
          {/* Header Section */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              Documentation
            </div>
            <h1 className="text-4xl font-bold mb-3">Learn Flyde</h1>
            <p className="text-lg text-foreground/70 max-w-3xl">
              Master AI workflows and visual programming with comprehensive guides and tutorials.
            </p>
          </div>

          {docs.length === 0 ? (
            /* Compact Empty State */
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-card rounded-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium mb-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  In Progress
                </div>
                
                <h2 className="text-2xl font-bold mb-3">Documentation Coming Soon</h2>
                
                <p className="text-foreground/70 mb-6">
                  We&apos;re crafting comprehensive documentation to help you master Flyde. 
                  From getting started guides to advanced techniques.
                </p>
                
                {/* Preview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-xs font-medium mb-1">Quick Start</div>
                    <div className="text-xs text-foreground/60">Get running fast</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xs font-medium mb-1">API Reference</div>
                    <div className="text-xs text-foreground/60">Complete docs</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Layers className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xs font-medium mb-1">Examples</div>
                    <div className="text-xs text-foreground/60">Real use cases</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-xs font-medium mb-1">Advanced</div>
                    <div className="text-xs text-foreground/60">Pro tips</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Compact Docs Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {docs.map((doc, index) => {
                const IconComponent = iconMap[index % iconMap.length];
                return (
                  <Link 
                    key={doc.slug} 
                    href={`/docs/${doc.slug}`} 
                    className="group block"
                  >
                    <article className="bg-card rounded-lg p-6 hover:bg-card/80 transition-colors h-full">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                            {doc.title}
                          </h2>
                        </div>
                      </div>
                      
                      {doc.description && (
                        <p className="text-foreground/70 text-sm mb-4 leading-relaxed">
                          {doc.description}
                        </p>
                      )}
                      
                      <div className="inline-flex items-center gap-1 text-primary text-sm font-medium">
                        Read Guide
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Compact Help Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-muted/30 rounded-lg p-6">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">Need Help?</h2>
                  </div>
                  
                  <p className="text-foreground/70 mb-4">
                    Can&apos;t find what you&apos;re looking for? Our community is here to help.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a 
                      href="https://github.com/flydelabs/flyde" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="group inline-flex items-center gap-3 p-3 bg-card/50 rounded-md hover:bg-card/80 transition-colors"
                    >
                      <div className="w-8 h-8 bg-foreground/5 rounded-md flex items-center justify-center">
                        <Github className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">GitHub</div>
                        <div className="text-xs text-foreground/60">Issues & Discussions</div>
                      </div>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    
                    <Link 
                      href="/blog" 
                      className="group inline-flex items-center gap-3 p-3 bg-card/50 rounded-md hover:bg-card/80 transition-colors"
                    >
                      <div className="w-8 h-8 bg-foreground/5 rounded-md flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Blog</div>
                        <div className="text-xs text-foreground/60">Latest Updates</div>
                      </div>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const docs = getPublishedDocs();
  
  // Clean up undefined values for serialization
  const cleanedDocs = docs.map(doc => ({
    ...doc,
    draft: doc.draft || false,
    description: doc.description || null,
    sidebar_position: doc.sidebar_position || null,
  }));
  
  return {
    props: {
      docs: cleanedDocs,
    },
  };
};