import { runFlow } from '@flyde/loader';

// 🎮 Try changing the topic to generate different blog posts!
const topic = 'AI in 2025';
// 💡 Popular topics to try:
// const topic = 'The Future of Web Development';
// const topic = 'Visual Programming Revolution';
// const topic = 'TypeScript Best Practices';
// const topic = 'React Performance Tips';

console.log(`📝 Generating blog post about: "${topic}"`);

// Execute the flow to generate a blog post
const result = await runFlow('./main.flyde', { topic });

console.log('🎉 Generated Blog Post:');
console.log('=' .repeat(50));
console.log(result.blogPost);
console.log('=' .repeat(50));

// 🔍 Explore more:
// - Try different topics above
// - Watch the visual flow execution in main.flyde
// - See how AI nodes work together to create content
// - Each run generates unique content!

// 💡 Pro tip: Uncomment different topics and click Run to see the magic!