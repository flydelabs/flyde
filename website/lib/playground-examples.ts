import { ExampleBlogpost } from "../flyde/resolved/ExampleBlogpost";
import { ExampleHelloWorld } from "../flyde/resolved/ExampleHelloWorld";

export interface PlaygroundExample {
  id: string;
  name: string;
  description: string;
  flow: any; // The resolved flow data
  files: {
    name: string;
    type: 'flyde' | 'ts';
    content: string;
  }[];
}

export const playgroundExamples: PlaygroundExample[] = [
  {
    id: 'blog-generator',
    name: 'Blog Generator',
    description: 'Generate blog posts using AI with title generation, content creation, and summarization',
    flow: ExampleBlogpost,
    files: [
      {
        name: 'main.flyde',
        type: 'flyde',
        content: '', // Will be populated from flow data
      },
      {
        name: 'index.ts',
        type: 'ts',
        content: `import { runFlow } from '@flyde/loader';

const topic = 'AI in 2025';

// Execute the flow directly
const result = await runFlow('./main.flyde', { topic });

console.log(result.blogPost);`
      },
      {
        name: 'demo.ts',
        type: 'ts',
        content: `import { loadFlow } from '@flyde/loader';

// Load the flow as a function with type safety
const blogFlow = loadFlow<{topic: string}, {blogPost: any}>('./main.flyde');

// Generate multiple blog posts for different topics
const topics = ['AI in 2025', 'Web Development Trends', 'Climate Change Solutions'];

for (const topic of topics) {
  try {
    const { blogPost } = await blogFlow({ topic });
    console.log(\`=== Blog Post: \${blogPost.subject} ===\`);
    console.log(blogPost.content);
    console.log(\`Summary: \${blogPost.summary}\`);
    console.log('\\n---\\n');
  } catch (error) {
    console.error(\`Error generating blog for \${topic}:\`, error);
  }
}`
      }
    ]
  },
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'A simple greeting flow that shows how to create visual flows, use string interpolation, and load flows as TypeScript functions',
    flow: ExampleHelloWorld,
    files: [
      {
        name: 'main.flyde',
        type: 'flyde',
        content: '', // Will be populated from flow data
      },
      {
        name: 'index.ts',
        type: 'ts',
        content: `import { runFlow } from '@flyde/loader';

const name = 'World';

// Execute the flow
const result = await runFlow('./main.flyde', { name });

console.log(result.response);`
      },
      {
        name: 'demo.ts',
        type: 'ts',
        content: `import { loadFlow } from '@flyde/loader';

// Load the greeting flow
const greetFlow = loadFlow<{name: string}, {response: string}>('./main.flyde');

// Greet multiple people
const names = ['Alice', 'Bob', 'Charlie', 'Diana'];

console.log('=== Greeting Everyone ===\\n');

for (const name of names) {
  const { response } = await greetFlow({ name });
  console.log(\`👋 \${response}\`);
}

console.log('\\n=== Custom Greetings ===\\n');

// You can also pass different contexts
const customNames = ['Developer', 'Designer', 'Manager'];
for (const name of customNames) {
  const { response } = await greetFlow({ name });
  console.log(\`🎉 \${response}\`);
}`
      }
    ]
  }
];

export function getExampleById(id: string): PlaygroundExample | undefined {
  return playgroundExamples.find(example => example.id === id);
}

export function getExamplesList(): { id: string; name: string; description: string }[] {
  return playgroundExamples.map(({ id, name, description }) => ({ id, name, description }));
}

export function getExampleFiles(id: string): PlaygroundExample['files'] {
  const example = getExampleById(id);
  if (!example) return [];
  
  // Populate the main.flyde content from the flow data
  return example.files.map(file => {
    if (file.name === 'main.flyde' && file.content === '') {
      return {
        ...file,
        content: JSON.stringify(example.flow, null, 2)
      };
    }
    return file;
  });
}