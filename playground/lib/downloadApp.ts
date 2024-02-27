import { PlaygroundApp } from "@/types/entities";
import { toast } from "./toast";
import { AppData } from "@/components/AppView";
import { toFilename } from "./toFilename";

const packageJson = {
  name: "flyde-playground-app",
  version: "1.0.0",
  license: "MIT",
  scripts: {
    start: "ts-node-dev index.ts",
  },
  dependencies: {
    "@flyde/runtime": "latest",
  },
  devDependencies: {
    "ts-node": "^10.9.1",
    "ts-node-dev": "^2.0.0",
    typescript: "^4.8.4",
  },
};

const README = `# Instructions

1. Unzip the downloaded zip file into a folder
2. Install Flyde's VSCode extension - https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode
3. Install the dependencies by running \`npm install\` in the folder
4. Run \`npm start\` to start the app
5. Enjoy!

Check out the docs for more info - https://www.flyde.dev/docs`;

export async function downloadApp(app: AppData) {
  const { default: JSZip } = await import("jszip");
  const { default: saveAs } = await import("file-saver");
  const zip = new JSZip();

  for (const file of app.files) {
    zip.file(toFilename(file), file.content);
  }
  zip.file("package.json", JSON.stringify(packageJson, null, 2));
  zip.file("README.md", README);

  console.log(app);

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `FlydeApp_${app.title}.zip`);

  toast("FlydeApp.zip downloaded");
}
