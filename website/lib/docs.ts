import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDirectory = path.join(process.cwd(), 'content/docs');

export type DocPage = {
  slug: string;
  title: string;
  description?: string;
  sidebar_position?: number;
  content: string;
  draft?: boolean;
};

export function getSortedDocs(): DocPage[] {
  try {
    const fileNames = fs.readdirSync(docsDirectory);
    const allDocsData = fileNames
      .filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
      .map(fileName => {
        // Remove extension from file name to get slug
        const slug = fileName.replace(/\.mdx$/, '').replace(/\.md$/, '');

        // Read markdown file as string
        const fullPath = path.join(docsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        // Use gray-matter to parse the post metadata section
        const { data, content } = matter(fileContents);

        // Extract title from content if not in frontmatter
        let title = data.title;
        if (!title) {
          const titleMatch = content.match(/^#\s+(.+)$/m);
          title = titleMatch ? titleMatch[1] : slug.replace(/[-_]/g, ' ');
        }

        // Combine the data with the slug
        return {
          slug,
          title,
          content,
          description: data.description,
          sidebar_position: data.sidebar_position,
          draft: data.draft,
        } as DocPage;
      });

    // Sort docs by sidebar_position, then by title
    return allDocsData.sort((a, b) => {
      if (a.sidebar_position && b.sidebar_position) {
        return a.sidebar_position - b.sidebar_position;
      }
      if (a.sidebar_position && !b.sidebar_position) {
        return -1;
      }
      if (!a.sidebar_position && b.sidebar_position) {
        return 1;
      }
      return a.title.localeCompare(b.title);
    });
  } catch (error) {
    console.error('Error reading docs directory:', error);
    return [];
  }
}

export function getAllDocSlugs() {
  try {
    const fileNames = fs.readdirSync(docsDirectory);
    return fileNames
      .filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
      .map(fileName => {
        return {
          params: {
            slug: fileName.replace(/\.mdx$/, '').replace(/\.md$/, ''),
          },
        };
      });
  } catch (error) {
    console.error('Error getting doc slugs:', error);
    return [];
  }
}

export function getDocBySlug(slug: string): DocPage | null {
  try {
    // Try both .mdx and .md extensions
    let fullPath = path.join(docsDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(docsDirectory, `${slug}.md`);
      
      if (!fs.existsSync(fullPath)) {
        return null;
      }
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    // Use gray-matter to parse the doc metadata section
    const { data, content } = matter(fileContents);
    
    // Extract title from content if not in frontmatter
    let title = data.title;
    if (!title) {
      const titleMatch = content.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1] : slug.replace(/[-_]/g, ' ');
    }
    
    // Combine the data with the slug
    return {
      slug,
      title,
      content,
      description: data.description,
      sidebar_position: data.sidebar_position,
      draft: data.draft,
    } as DocPage;
  } catch (error) {
    console.error(`Error getting doc by slug "${slug}":`, error);
    return null;
  }
}

export function getPublishedDocs(): DocPage[] {
  return getSortedDocs().filter(doc => !doc.draft);
} 