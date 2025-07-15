"use client";

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export type BlogPreviewProps = {
  data: any;
  className?: string;
};

export const BlogPreview: React.FC<BlogPreviewProps> = ({
  data,
  className = ""
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const blogText = `# ${data?.subject || 'Generated Blog Post'}\n\n${data?.content || 'No content generated yet.'}`;
      await navigator.clipboard.writeText(blogText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get the actual blog post data from the flow output
  console.log("BlogPreview received data:", data);
  const blogData = data?.blogPost || data?.value || data;
  console.log("BlogPreview processed blogData:", blogData);
  
  if (!blogData) {
    return (
      <div className={`h-full bg-white flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-gray-500">Click "Run" to generate a blog post</p>
        </div>
      </div>
    );
  }

  // Parse content if it's a string (from the flow output)
  let subject = blogData.subject;
  let content = blogData.content;
  let summary = blogData.summary;
  
  console.log("Initial parsing:", { subject, content, summary });

  // If data is a string, try to parse it as JSON or extract values
  if (typeof blogData === 'string') {
    try {
      const parsed = JSON.parse(blogData);
      subject = parsed.subject;
      content = parsed.content;
      summary = parsed.summary;
    } catch (e) {
      console.log("JSON parsing failed, trying regex extraction");
      try {
        // If it's not JSON, try to extract values using regex
        // Updated regex to handle content with HTML tags and quotes
        const subjectMatch = blogData.match(/subject:\s*"([^"]*?)"/);
        const contentMatch = blogData.match(/content:\s*"([\s\S]*?)"/g);
        const summaryMatch = blogData.match(/summary:\s*"([^"]*?)"/);
        
        if (subjectMatch) subject = subjectMatch[1];
        if (contentMatch) content = contentMatch[1];
        if (summaryMatch) summary = summaryMatch[1];
        
        console.log("Regex extraction results:", { subject, content, summary });
        console.log("Content length:", content ? content.length : 0);
        console.log("Raw blogData:", blogData);
        
        // If no matches, treat the whole thing as content
        if (!subject && !content && !summary) {
          content = blogData;
        }
      } catch (regexError) {
        console.error("Regex extraction failed:", regexError);
        content = blogData;
      }
    }
  }

  // If we still don't have meaningful content, show the placeholder
  if (!subject && !content && !summary) {
    return (
      <div className={`h-full bg-white flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-gray-500">Click "Run" to generate a blog post</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-white overflow-auto ${className}`}>
      <div className="p-8 max-w-none">
        <article className="max-w-none">
          {subject && (
            <header className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 leading-tight mb-6">
                {subject}
              </h1>
            </header>
          )}

          {summary && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
              <p className="text-gray-600 text-sm leading-6">{summary}</p>
            </div>
          )}

          {content && (
            <div className="text-gray-700 leading-7 space-y-4">
              {typeof content === 'string' && content.includes('<') ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                typeof content === 'string' ? (
                  content.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="text-sm">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-sm">{String(content)}</p>
                )
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
};