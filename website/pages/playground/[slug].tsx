"use client";

import Head from "next/head";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { Share2, Download, FolderOpen } from "lucide-react";
import "@flyde/editor/src/index.scss";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@flyde/editor';

import { ExamplePlayground } from "../../components/ExamplePlayground";
import { SaveFlowDialog } from "../../components/SaveFlowDialog";
import { getExamplesList } from "../../lib/generated/playground-examples";

interface SavedFlow {
  slug: string;
  title: string;
  description: string;
  content: any;
  created_at: string;
  forked_from_slug?: string;
  view_count: number;
}

export default function PlaygroundSlugPage() {
  const router = useRouter();
  const [selectedExample, setSelectedExample] = useState('blog-generator');
  const [customDescription, setCustomDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [hasDescriptionChanges, setHasDescriptionChanges] = useState(false);
  const [hasFileChanges, setHasFileChanges] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedFlow, setSavedFlow] = useState<SavedFlow | null>(null);
  const [isLoadingFlow, setIsLoadingFlow] = useState(true); // Start with loading state
  const [newFlowSlug, setNewFlowSlug] = useState('');
  const [flowNotFound, setFlowNotFound] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<any[]>([]);
  const [showExamplesMenu, setShowExamplesMenu] = useState(false);

  // Fetch saved flow or handle example slug
  useEffect(() => {
    if (router.isReady) {
      const { slug } = router.query;
      if (typeof slug === 'string') {
        const validExamples = getExamplesList().map(e => e.id);
        
        if (validExamples.includes(slug)) {
          // Handle built-in example
          setSavedFlow(null);
          setFlowNotFound(false);
          setSelectedExample(slug);
          const example = getExamplesList().find(ex => ex.id === slug);
          const description = example?.description || '';
          setCustomDescription(description);
          setOriginalDescription(description);
          setHasDescriptionChanges(false);
          setHasFileChanges(false);
          setHasChanges(false);
          setIsLoadingFlow(false); // Done loading built-in example
        } else {
          // Try to fetch saved flow
          setIsLoadingFlow(true);
          setFlowNotFound(false);
          fetch(`/api/flows/${slug}`)
            .then(res => {
              if (!res.ok) {
                throw new Error('Flow not found');
              }
              return res.json();
            })
            .then((flow: SavedFlow) => {
              setSavedFlow(flow);
              setFlowNotFound(false);
              setCustomDescription(flow.description || '');
              setOriginalDescription(flow.description || '');
              setHasDescriptionChanges(false);
              setHasFileChanges(false);
              setHasChanges(false);
              
              // For saved flows, we'll use their files directly
              // Don't set selectedExample - we'll render saved flow content instead
              if (flow.content?.files) {
                setCurrentFiles(flow.content.files);
              }
            })
            .catch((error) => {
              console.log('Flow fetch error:', error);
              setFlowNotFound(true);
            })
            .finally(() => {
              setIsLoadingFlow(false);
            });
        }
      }
    }
  }, [router.isReady, router.query]);

  // Update URL when example changes
  const handleExampleChange = useCallback((exampleId: string) => {
    setSelectedExample(exampleId);
    // Update description to match the new example
    const example = getExamplesList().find(ex => ex.id === exampleId);
    const description = example?.description || '';
    setCustomDescription(description);
    setOriginalDescription(description);
    setHasDescriptionChanges(false);
    setHasFileChanges(false);
    setHasChanges(false);
    router.push(`/playground/${exampleId}`, undefined, { shallow: true });
  }, [router.push]);

  // Track changes to description
  useEffect(() => {
    setHasDescriptionChanges(customDescription !== originalDescription);
  }, [customDescription, originalDescription]);

  // Track overall changes
  useEffect(() => {
    setHasChanges(hasDescriptionChanges || hasFileChanges);
  }, [hasDescriptionChanges, hasFileChanges]);

  // Handle file content changes from ExamplePlayground
  const handleFileContentChange = useCallback((hasFileContentChanges: boolean) => {
    setHasFileChanges(prev => {
      if (prev !== hasFileContentChanges) {
        return hasFileContentChanges;
      }
      return prev;
    });
  }, []);

  const handleSave = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  const handleSaveFlow = useCallback(async (saveName: string, saveDescription: string) => {
    console.log('Saving flow with files:', currentFiles);
    
    const response = await fetch('/api/flows/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: saveName,
        description: saveDescription,
        content: {
          files: currentFiles,
        },
        forkedFromSlug: savedFlow?.slug || selectedExample
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save flow');
    }

    const { slug } = await response.json();
    setNewFlowSlug(slug);
    setShowSaveDialog(false);
    setShowSuccessDialog(true);
    
    // Update URL to new slug
    router.push(`/playground/${slug}`, undefined, { shallow: true });
  }, [selectedExample, savedFlow, router.push, currentFiles]);

  const handleExport = useCallback(() => {
    alert('Export functionality coming soon!');
  }, []);

  // Close examples menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExamplesMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.examples-dropdown') && !target.closest('.examples-button')) {
          setShowExamplesMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExamplesMenu]);


  return (
    <TooltipProvider>
      <Head>
        <title>Playground - Flyde</title>
        <meta name="description" content="Interactive playground for Visual AI Flows" />
      </Head>

      <div className="flex flex-col bg-[#1e1e1e] overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3c3c3c]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white whitespace-nowrap">Flyde Playground</h1>
            <div className="text-gray-500">•</div>
            {flowNotFound ? (
              <span className="text-red-400 text-sm">Flow not found</span>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-blue-400 text-sm font-medium truncate">
                  {savedFlow ? savedFlow.title : getExamplesList().find(ex => ex.id === selectedExample)?.name}
                </span>
                <div className="text-gray-500">•</div>
                <span className="text-gray-400 text-xs truncate">
                  {savedFlow ? savedFlow.description : customDescription}
                </span>
                {savedFlow && (
                  <>
                    <div className="text-gray-500">•</div>
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {savedFlow.view_count} views • Created {new Date(savedFlow.created_at).toLocaleDateString()}
                    </span>
                    {savedFlow.forked_from_slug && (
                      <>
                        <div className="text-gray-500">•</div>
                        <button
                          onClick={() => window.open(`/playground/${savedFlow.forked_from_slug}`, '_blank')}
                          className="text-blue-400 text-xs hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Forked from {savedFlow.forked_from_slug}
                        </button>
                        <div className="text-gray-500">&nbsp;</div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSave}
                  className="flex items-center p-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-sm transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#2d2d30] text-white border-[#3c3c3c]">
                <div className="text-sm">Save flow</div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowExamplesMenu(!showExamplesMenu)}
                  className="examples-button flex items-center p-2 bg-[#3c3c3c] hover:bg-[#45494e] text-white rounded text-sm transition-colors relative"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#2d2d30] text-white border-[#3c3c3c]">
                <div className="text-sm">Examples</div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleExport}
                  className="flex items-center p-2 bg-[#3c3c3c] hover:bg-[#45494e] text-white rounded text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#2d2d30] text-white border-[#3c3c3c]">
                <div className="text-sm">Export flow</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Examples Dropdown */}
        {showExamplesMenu && (
          <div className="examples-dropdown absolute top-16 right-2 sm:right-4 bg-[#3c3c3c] border border-[#464647] rounded shadow-lg z-10 w-80 max-w-[calc(100vw-1rem)]">
            <div className="p-2">
              <div className="text-white text-sm font-medium mb-2 px-2">Examples</div>
              {getExamplesList().map(example => (
                <button
                  key={example.id}
                  onClick={() => {
                    handleExampleChange(example.id);
                    setShowExamplesMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-[#094771] transition-colors ${
                    selectedExample === example.id && !savedFlow ? 'bg-[#094771]' : ''
                  }`}
                >
                  <div className="text-white font-medium truncate">{example.name}</div>
                  <div className="text-gray-400 text-xs truncate">{example.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render content */}
        {isLoadingFlow ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <div>Loading saved flow...</div>
            </div>
          </div>
        ) : flowNotFound ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold text-white mb-2">Flow Not Found</h2>
              <p className="text-gray-400 mb-6">
                The flow you're looking for doesn't exist or may have been removed.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/playground/blog-generator')}
                  className="w-full px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded transition-colors"
                >
                  Go to Default Example
                </button>
                <div className="text-sm text-gray-500">
                  or try one of these examples:
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getExamplesList().slice(0, 3).map(example => (
                    <button
                      key={example.id}
                      onClick={() => router.push(`/playground/${example.id}`)}
                      className="px-3 py-1 bg-[#3c3c3c] hover:bg-[#45494e] text-gray-300 rounded text-sm transition-colors"
                    >
                      {example.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ExamplePlayground
            key={savedFlow ? savedFlow.slug : selectedExample}
            exampleId={savedFlow ? undefined : selectedExample}
            initialFiles={savedFlow?.content?.files}
            isActive={true}
            onContentChange={handleFileContentChange}
            onFilesChange={setCurrentFiles}
          />
        )}
      </div>

      <SaveFlowDialog
        isOpen={showSaveDialog || showSuccessDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveFlow}
        defaultName={(() => {
          const currentExample = getExamplesList().find(ex => ex.id === selectedExample);
          return currentExample?.name + ' (Custom)' || 'My Custom Example';
        })()}
        defaultDescription={customDescription}
        newFlowSlug={newFlowSlug}
        showSuccess={showSuccessDialog}
        onCloseSuccess={() => setShowSuccessDialog(false)}
      />
    </TooltipProvider>
  );
}