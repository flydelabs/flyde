const path = require("path");
const fs = require("fs");

// webpack 5 and ejs don't play nice together due to importing of path and fs, this fixes it

const basePath1 = path.join(__dirname, "../node_modules/react-scripts");
const basePath2 = path.join(__dirname, "../../node_modules/react-scripts");
const basePath3 = path.join(__dirname, "../../../node_modules/react-scripts");

let basePath = [basePath1, basePath2, basePath3].find((p) => fs.existsSync(p));

if (!basePath) {
  // cannot find react-scripts folder to monkey patch, relevant only for Flyde development
  return;
}

basePath = path.join(basePath, '..');


[
  'react-scripts/config/webpack.config.js',
  'react-scripts/config/webpackDevServer.config.js',
  'webpack/lib/web/JsonpChunkLoadingRuntimeModule.js'
].forEach((filename) => {

  const original = path.join(basePath, filename);
  const patched = path.join(__dirname, filename);
  console.log(`Patching ${filename}`);
  fs.writeFileSync(original, fs.readFileSync(patched));
  console.log(`Patched ${filename}`);
})



// // force production mode so react performs faster. much faster
// const rel = "scripts/start.js";

// const scriptsFile = path.join(basePath, rel);

// const original = `// Do this as the first thing so that any code reading it knows the right env.
// process.env.BABEL_ENV = 'development';
// process.env.NODE_ENV = 'development';`;

// const target = `// Do this as the first thing so that any code reading it knows the right env.
// // ALTERED BY 'force-react-prod.js'
// process.env.BABEL_ENV = process.env.FORCE_ENV || 'development';
// process.env.NODE_ENV = process.env.FORCE_ENV ||'development';`;

// const fileContent = fs.readFileSync(scriptsFile, "utf-8");

// if (fileContent.includes(original)) {
//   console.log(`Altering [${scriptsFile}] to allow forcing env`);
//   fs.writeFileSync(scriptsFile, fileContent.replace(original, target), "utf-8");
//   console.log(`Altered [${scriptsFile}] to allow forcing env!`);
// } else {
//   console.log(`Looks like [${scriptsFile}] is already altered. Skipping`);
// }
