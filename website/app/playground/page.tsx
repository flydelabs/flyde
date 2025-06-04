export default function PlaygroundPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h1 className="text-4xl font-bold mb-8">Playground</h1>
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-lg">
        <h2 className="text-2xl font-medium mb-4 text-center">Interactive playground coming soon</h2>
        <p className="text-foreground/70 text-center max-w-2xl mb-8">
          Experience the power of Visual AI Flows directly in your browser.
          Build, test, and visualize AI workflows without writing code.
        </p>
        <div className="w-full h-64 bg-muted rounded flex items-center justify-center">
          <p className="text-foreground/50">Playground Preview</p>
        </div>
      </div>
    </div>
  );
} 