import { useState } from 'react';
import Link from 'next/link';

export default function QuickStart() {
  const [copied, setCopied] = useState(false);
  
  const command = 'npx create-flyde-app my-flows';
  
  const copyCommand = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="container mx-auto px-4 sm:px-8 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Get Flyde
            </h1>
            <p className="text-xl text-zinc-400">
              Choose your path
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            
            {/* Option 1: One Command */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
              <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
              <p className="text-zinc-400 mb-6">One command. Zero setup.</p>
              
              <div className="bg-black rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <code className="text-blue-400 font-mono text-sm sm:text-base flex-1">
                    {command}
                  </code>
                  <button
                    onClick={copyCommand}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors ml-4"
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-zinc-400">
                <p>✓ Creates project with working flow</p>
                <p>✓ Installs VS Code extension</p>  
                <p>✓ Opens VS Code with your first flow</p>
              </div>
            </div>

            {/* Option 2: Manual */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
              <h2 className="text-2xl font-bold mb-4">Manual Setup</h2>
              <p className="text-zinc-400 mb-6">Step-by-step control.</p>
              
              <div className="space-y-4 text-sm">
                <div className="space-y-2">
                  <p className="text-white font-medium">1. Install VS Code Extension</p>
                  <code className="block bg-black rounded p-2 text-blue-400 text-xs">
                    code --install-extension flyde.flyde-vscode
                  </code>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white font-medium">2. Create New Project</p>
                  <div className="bg-black rounded p-2 text-xs space-y-1">
                    <code className="block text-blue-400">mkdir my-flyde-project && cd my-flyde-project</code>
                    <code className="block text-blue-400">npm init -y</code>
                    <code className="block text-blue-400">npm install @flyde/loader @flyde/nodes</code>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white font-medium">3. Create Your First Flow</p>
                  <p className="text-zinc-400 text-xs">Right-click in VS Code → "New Flyde Flow"</p>
                </div>
              </div>
            </div>

          </div>

          {/* Next Steps */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
            <h3 className="text-xl font-bold mb-4">What's next?</h3>
            <p className="text-zinc-400 mb-6">
              Once you have Flyde running, learn how to build powerful AI workflows.
            </p>
            <Link
              href="/docs"
              className="inline-flex px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Documentation
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}