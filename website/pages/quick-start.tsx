import { useState } from 'react';
import Link from 'next/link';

export default function QuickStart() {
  const [copied, setCopied] = useState(false);
  const [selectedIde, setSelectedIde] = useState<'vscode' | 'cursor' | 'windsurf'>('vscode');
  
  const command = 'npx create-flyde-app';
  
  const copyCommand = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ideCommands = {
    vscode: 'code',
    cursor: 'cursor', 
    windsurf: 'windsurf'
  };

  const ideNames = {
    vscode: 'VS Code',
    cursor: 'Cursor',
    windsurf: 'Windsurf'
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="container mx-auto px-4 sm:px-8 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Get Flyde
            </h1>
            <p className="text-xl text-zinc-400 mb-4">
              Flyde combines a visual editor that lives in your IDE with the <code className="bg-zinc-800 px-2 py-1 rounded text-sm">@flyde/loader</code> npm package that runs your flows.
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
                <p>✓ Installs editor extension</p>  
                <p>✓ Opens your editor with your first flow</p>
              </div>
            </div>

            {/* Option 2: Manual */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
              <h2 className="text-2xl font-bold mb-4">Manual Setup</h2>
              <p className="text-zinc-400 mb-6">Step-by-step control.</p>
              
              <div className="space-y-4 text-sm">
                {/* IDE Selector */}
                <div className="space-y-2">
                  <p className="text-white font-medium">Choose your IDE</p>
                  <div className="flex gap-2">
                    {Object.entries(ideNames).map(([key, name]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedIde(key as 'vscode' | 'cursor' | 'windsurf')}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          selectedIde === key
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-medium">1. Install {ideNames[selectedIde]} Extension</p>
                  <code className="block bg-black rounded p-2 text-blue-400 text-xs">
                    {ideCommands[selectedIde]} --install-extension flyde.flyde-vscode
                  </code>
                  <p className="text-zinc-400 text-xs">
                    Or <a href={selectedIde === 'vscode' 
                      ? "https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode"
                      : "https://open-vsx.org/extension/flyde/flyde-vscode"} 
                      className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                      download from {selectedIde === 'vscode' ? 'marketplace' : 'Open VSX'}
                    </a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white font-medium">2. Create New Project</p>
                  <div className="bg-black rounded p-2 text-xs space-y-1">
                    <code className="block text-blue-400">mkdir my-flyde-project && cd my-flyde-project</code>
                    <code className="block text-blue-400">npm init -y</code>
                    <code className="block text-blue-400">npm install @flyde/loader</code>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white font-medium">3. Create Your First Flow</p>
                  <p className="text-zinc-400 text-xs">Right-click in {ideNames[selectedIde]} → "New Flyde Flow"</p>
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
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/docs"
                className="inline-flex px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Documentation
              </Link>
              <a
                href="https://discord.gg/ZKgW6Xa8fz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Join Discord
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}