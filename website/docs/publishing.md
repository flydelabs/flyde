# Installing and Publishing Flyde Packages

## Installing Flyde packages
Flyde packages are published to npm, and can be installed using the standard npm install command. To install a Flyde package, run the following command: `npm install flyde-mypackage` or `yarn add flyde-mypackage`.

## Publishing Flyde packages

Flyde leverages the existing npm ecosystem to manage packages. To publish Flyde parts to npm, you need to add a "flyde.exposes" property to your package.json - an array of globs that will contain Flyde parts (either code parts or visual parts). Additionally, you should make sure that the package name starts with "flyde-", and includes the "flyde" and "flyde-package" keywords in the package.json.

### Step 1: Prepare your package

Create a new npm package or use an existing one. Make sure that the package contains the Flyde parts that you want to publish in a folder called "parts" or any other folder of your choice. The parts should be either `.flyde`, `.flyde.js` or `.flyde.ts` files.

```json
{
    "name": "flyde-mypackage",
    "version": "1.0.0",
    "description": "My Flyde package",
    "dependencies": {
        "@flyde/core": "^0.1.0"
    },
    "flyde": {
        "exposes": [
            "parts/**/*.flyde",
            "parts/**/*.flyde.js",
            "parts/**/*.flyde.ts"
        ],
    },
    "keywords": [
        "flyde",
        "flyde-package"
    ]
}

Please note that the above example is using `@flyde/core` as a dependency, this is mandatory for all Flyde packages, but you can add other dependencies as you see fit.

### Step 2: Publish your package

To publish your package, run `npm publish` or `yarn publish`. You can also use the `--dry-run` flag to test your package before publishing it.

### Step 3: Install your package

To install your package, run `npm install flyde-mypackage` or `yarn add flyde-mypackage`. You can now use the parts in your Flyde projects.


That's it! You can now publish Flyde packages to npm and install them in your Flyde projects.

If you've built a cool package and would like to be featured on the Flyde website, please let us know [here](https://discord.gg/Bm9CAhM5tU).


