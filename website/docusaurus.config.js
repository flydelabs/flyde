// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const webpack = require("webpack");
const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const HOTJAR_ID = "3245180";

const FixWebpack5Plugin = () => ({
  configureWebpack(config, isServer, utils) {
    const base = {
      module: {
        rules: [
          {
            test: /\.flyde$/,
            use: [
              {
                loader: "@flyde/runtime/webpack-loader",
                options: {
                  /* ... */
                },
              },
            ],
          },
        ],
      },
    };

    if (isServer) {
      return base;
    }

    return {
      ...base,
      resolve: {
        fallback: {
          path: require.resolve("path-browserify"),
          fs: false,
          crypto: false,
          stream: false,
          vm: require.resolve("vm-browserify"),
        },
      },

      plugins: [
        new webpack.DefinePlugin({
          process: {
            env: {},
          },
        }),
      ],
    };
  },
});

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Flyde | Visual Programming. For Developers.",
  tagline:
    "Experience the next level of abstraction in programming with Flyde's visual, flow-based approach and modular design",
  url: "https://www.flyde.dev",
  baseUrl: "/",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "flydelabs", // Usually your GitHub org/user name.
  projectName: "flyde", // Usually your resolvedNodes name.
  deploymentBranch: "website",
  trailingSlash: true,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  plugins: [
    // [
    //   "docusaurus-plugin-typedoc",
    //   // Plugin / TypeDoc options
    //   {
    //     entryPoints: ["../core/src/index.ts"],
    //     tsconfig: "../core/tsconfig.json",
    //     out: "api-reference",
    //     watch: process.env.TYPEDOC_WATCH,
    //     sidebar: {
    //       position: 20,
    //       categoryLabel: "API Reference",
    //       fullNames: true,
    //     },
    //   },
    // ],
    "docusaurus-plugin-sass",
    "docusaurus-plugin-hotjar",
    // @ts-ignore
    FixWebpack5Plugin,
  ],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your resolvedNodes.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your resolvedNodes.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        theme: {
          customCss: [
            require.resolve("./src/css/custom.css"),
            require.resolve("@flyde/flow-editor/src/index.scss"),
          ],
        },
        gtag: {
          trackingID: "G-RCVXXHJXZ6",
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        disableSwitch: true,
        respectPrefersColorScheme: false,
        defaultMode: "light",
      },
      navbar: {
        title: "Flyde",
        logo: {
          alt: "Flyde Logo",
          src: "img/flyde_icon.png",
        },
        items: [
          {
            to: "/docs",
            label: "Documentation",
          },
          {
            href: "https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode",
            label: "VSCode Extension",
          },
          {
            href: "https://play.flyde.dev",
            label: "Online Playground",
          },
          {
            href: "https://www.trigg.dev?ref=flyde-header",
            label: "Trigg",
          },
          {
            href: "https://github.com/flydelabs/flyde",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Getting Started",
            items: [
              {
                label: "Online Playground",
                to: "https://play.flyde.dev",
              },
              {
                label: "Documentation",
                to: "/docs",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://www.flyde.dev/discord",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/FlydeLabs",
              },
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/flyde",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "/blog",
              },
              {
                label: "VSCode Extension",
                href: "https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode",
              },
              {
                label: "GitHub",
                href: "https://github.com/flydelabs/flyde",
              },
              {
                label: "Trigg - Cloud-Managed Flyde for APIs",
                href: "https://www.trigg.dev?ref=flyde-footer",
              },
            ],
          },
          {
            title: "Contact",
            items: [
              {
                label: "Email",
                href: "mailto:hello@flyde.dev",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Flyde. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      hotjar: {
        applicationId: HOTJAR_ID,
      },
    }),
};

module.exports = config;
