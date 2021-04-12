/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Compiscript',
  tagline: 'Yet another compis compiler',
  url: 'https://compiscript-website.vercel.app/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'DanielSepulveda',
  projectName: 'compiscript',
  themeConfig: {
    navbar: {
      title: 'Compiscript',
      logo: {
        alt: 'Tec de Monterrey logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo_white.svg',
      },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          to: 'docs/Changelog',
          label: 'Changelog',
          position: 'right',
        },
        {
          href: 'https://github.com/DanielSepulveda/compiscript',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Daniel Sepulveda and Diego Partida. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
