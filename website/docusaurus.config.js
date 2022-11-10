// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const webpack = require("webpack");
const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

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
  title: "Visual Programming Inside VSCode",
  tagline: "Flyde is a flow-based, visual programming tool that fully integrates with the tools you love",
  url: "https://www.flyde.dev",
  baseUrl: "/",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "flydehq", // Usually your GitHub org/user name.
  projectName: "flyde", // Usually your repo name.
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
    "docusaurus-plugin-sass",
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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
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
      navbar: {
        title: "Flyde",
        logo: {
          alt: "Flyde Logo",
          src: "img/flyde_icon.png",
        },
        items: [
          {
            type: "doc",
            docId: "intro",
            position: "left",
            label: "Tutorial",
          },
          { to: "/blog", label: "Blog", position: "left" },
          {
            href: "https://github.com/flydehq/flyde",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Tutorial",
                to: "/docs/intro",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/flyde",
              },
              {
                label: "Discord",
                href: "https://discordapp.com/invite/docusaurus",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/flydehq",
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
                label: "GitHub",
                href: "https://github.com/flydehq/flyde",
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
    }),
};

module.exports = config;
