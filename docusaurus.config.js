// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'artrosas Knowledge Base',
  tagline: 'Frequent notes and field-tested runbooks',
  favicon: 'img/favicon.ico',

  url: 'https://kb.artrosas.com',
  baseUrl: '/',

  organizationName: 'artrosas-xp2',
  projectName: 'kb.artrosas.com',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Hardware-key KB — served at /hardware-keys/
          path: 'docs',
          routeBasePath: 'hardware-keys',
          sidebarPath: './sidebars.js',
          editUrl: undefined, // set this to your GitHub repo URL when ready
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      /** @type {import('@docusaurus/plugin-content-docs').Options} */
      ({
        // Splunk KB — served at /splunk/
        id: 'splunk',
        path: 'splunk',
        routeBasePath: 'splunk',
        sidebarPath: './sidebarsSplunk.js',
        editUrl: undefined,
      }),
    ],
    [
      '@docusaurus/plugin-client-redirects',
      /** @type {import('@docusaurus/plugin-client-redirects').Options} */
      ({
        // The hardware-key KB used to live at the site root. Redirect every
        // old root path (e.g. /runbooks/lockout-diagnosis) to its new home
        // under /hardware-keys/. The root itself (/) is now the hub, so it
        // is intentionally not redirected.
        createRedirects(existingPath) {
          if (
            existingPath.startsWith('/hardware-keys/') &&
            existingPath !== '/hardware-keys/'
          ) {
            return [existingPath.replace('/hardware-keys/', '/')];
          }
          return undefined;
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'artrosas KB',
        logo: {
          alt: 'Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Hardware Keys',
          },
          {
            type: 'docSidebar',
            sidebarId: 'splunkSidebar',
            docsPluginId: 'splunk',
            position: 'left',
            label: 'Splunk',
          },
          {
            href: 'https://artrosas.com',
            label: 'Home',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Knowledge Bases',
            items: [
              { label: 'Hardware Keys', to: '/hardware-keys/' },
              { label: 'Splunk', to: '/splunk/' },
            ],
          },
          {
            title: 'Elsewhere',
            items: [
              { label: 'artrosas.com', href: 'https://artrosas.com' },
            ],
          },
        ],
        copyright: `Built with Docusaurus. Content licensed CC BY 4.0.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['powershell', 'bash'],
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
    }),
};

export default config;
