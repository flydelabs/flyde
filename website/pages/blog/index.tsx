import Link from 'next/link';
import { getPublishedPosts } from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';
import { ArrowRight, Calendar, User, FileText, Zap, Brain, Palette, Code } from 'lucide-react';
import Head from 'next/head';
import { GetStaticProps } from 'next';

interface BlogPageProps {
  posts: BlogPost[];
}

export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <>
      <Head>
        <title>Blog - Flyde</title>
        <meta name="description" content="Latest updates and insights about AI workflows, visual programming, and developer tools" />
      </Head>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-4 max-w-5xl">
          {/* Header Section */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              Blog
            </div>
            <h1 className="text-4xl font-bold mb-3">Latest Updates & Insights</h1>
            <p className="text-lg text-foreground/70 max-w-2xl">
              Discover the latest in AI workflows, visual programming, and developer tools.
            </p>
          </div>
          
          {posts.length === 0 ? (
            /* Compact Empty State */
            <div className="max-w-2xl mx-auto">
              <div className="bg-card rounded-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                
                <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded text-xs font-medium mb-3">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Coming Soon
                </div>
                
                <h2 className="text-2xl font-bold mb-3">Content in Development</h2>
                
                <p className="text-foreground/70 mb-6">
                  We&apos;re crafting insightful articles about AI workflows, visual programming, 
                  and developer tools. Stay tuned for our first posts!
                </p>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-muted/50 rounded-md text-center">
                    <Brain className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="text-xs font-medium">AI Workflows</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md text-center">
                    <Palette className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <div className="text-xs font-medium">Visual Programming</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md text-center">
                    <Code className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <div className="text-xs font-medium">Developer Tools</div>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <a 
                    href="https://github.com/flydelabs/flyde" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Explore Flyde
                    <ArrowRight className="w-3 h-3" />
                  </a>
                  <Link 
                    href="/docs" 
                    className="inline-flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    Read Docs
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Compact Posts List */
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="bg-card rounded-lg p-6 hover:bg-card/80 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 text-sm text-foreground/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="w-1 h-1 bg-foreground/30 rounded-full" />
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author}
                          </div>
                        </div>
                        
                        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        
                        <p className="text-foreground/70 mb-3">
                          {post.description}
                        </p>
                        
                        <div className="inline-flex items-center gap-1 text-primary text-sm font-medium">
                          Read Article
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const posts = getPublishedPosts();
  
  // Clean up undefined values for serialization
  const cleanedPosts = posts.map(post => ({
    ...post,
    draft: post.draft || false,
  }));
  
  return {
    props: {
      posts: cleanedPosts,
    },
  };
};