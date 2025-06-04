import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  description: string;
  author: string;
  content: string;
  draft?: boolean;
};

export function getSortedPosts(): BlogPost[] {
  // Get file names under /content/blog
  try {
    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
      .map(fileName => {
        // Remove ".mdx" from file name to get slug
        const slug = fileName.replace(/\.mdx$/, '').replace(/\.md$/, '');

        // Read markdown file as string
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        // Use gray-matter to parse the post metadata section
        const { data, content } = matter(fileContents);

        // Combine the data with the slug
        return {
          slug,
          content,
          ...(data as Omit<BlogPost, 'slug' | 'content'>),
        };
      });

    // Sort posts by date
    return allPostsData.sort((a, b) => {
      if (a.date < b.date) {
        return 1;
      } else {
        return -1;
      }
    });
  } catch (error) {
    console.error('Error reading posts directory:', error);
    return [];
  }
}

export function getAllPostSlugs() {
  try {
    const fileNames = fs.readdirSync(postsDirectory);
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
    console.error('Error getting post slugs:', error);
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    // Try both .mdx and .md extensions
    let fullPath = path.join(postsDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, `${slug}.md`);
      
      if (!fs.existsSync(fullPath)) {
        return null;
      }
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    // Use gray-matter to parse the post metadata section
    const { data, content } = matter(fileContents);
    
    // Combine the data with the id
    return {
      slug,
      content,
      ...(data as Omit<BlogPost, 'slug' | 'content'>),
    };
  } catch (error) {
    console.error(`Error getting post by slug "${slug}":`, error);
    return null;
  }
}

export function getPublishedPosts(): BlogPost[] {
  return getSortedPosts().filter(post => !post.draft);
} 