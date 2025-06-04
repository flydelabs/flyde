import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-xl text-foreground/80 mb-8">
        Learn how to use Visual AI Flows in your projects
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/docs/getting-started" className="p-6 bg-card rounded-lg hover:bg-card/80 transition-colors">
          <h2 className="text-2xl font-medium mb-2">Getting Started</h2>
          <p className="text-foreground/70">
            Quick introduction to Visual AI Flows and how to integrate it into your codebase.
          </p>
        </Link>
        <Link href="/docs/concepts" className="p-6 bg-card rounded-lg hover:bg-card/80 transition-colors">
          <h2 className="text-2xl font-medium mb-2">Core Concepts</h2>
          <p className="text-foreground/70">
            Learn about the fundamental concepts behind Visual AI Flows.
          </p>
        </Link>
        <Link href="/docs/tutorials" className="p-6 bg-card rounded-lg hover:bg-card/80 transition-colors">
          <h2 className="text-2xl font-medium mb-2">Tutorials</h2>
          <p className="text-foreground/70">
            Step-by-step guides to build AI workflows with Visual AI Flows.
          </p>
        </Link>
        <Link href="/docs/api" className="p-6 bg-card rounded-lg hover:bg-card/80 transition-colors">
          <h2 className="text-2xl font-medium mb-2">API Reference</h2>
          <p className="text-foreground/70">
            Detailed API documentation for advanced usage.
          </p>
        </Link>
      </div>

      <div className="p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-medium mb-2">Need help?</h2>
        <p className="text-foreground/70 mb-4">
          If you can&apos;t find what you&apos;re looking for in our documentation, reach out to us:
        </p>
        <div className="flex flex-wrap gap-4">
          <a href="https://github.com/flydelabs/flyde" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
            GitHub Repository
          </a>
        </div>
      </div>
    </div>
  );
} 