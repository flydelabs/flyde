import { runFlow } from '@flyde/loader';

// 🎮 Try changing the name below to see different greetings!
const name = 'World';
// 💡 Ideas to try:
// const name = 'Alice';
// const name = 'Developer';
// const name = 'Flyde User';

console.log(`🚀 Starting Hello World flow with name: "${name}"`);

// Execute the flow
const result = await runFlow('./main.flyde', { name });

console.log(`✅ Result: ${result.response}`);

// 🔍 Explore more:
// - Try running with different names
// - Check out the visual flow in main.flyde tab
// - Click Run to see the changes!