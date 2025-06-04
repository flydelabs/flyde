import React from 'react';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-background">
      {children}
    </section>
  );
}

export const metadata = {
  title: 'Flyde Blog | Visual AI Flows',
  description: 'Explore the latest insights on visual programming, AI workflows, and Flyde updates',
}; 