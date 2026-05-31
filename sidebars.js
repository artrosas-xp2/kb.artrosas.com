// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Runbooks',
      collapsed: false,
      items: [
        'runbooks/lockout-diagnosis',
        'runbooks/case-study-lockout-that-wasnt',
        'runbooks/hotp-counter-drift',
        'runbooks/re-seeding-process',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: [
        'reference/cli-commands',
        'reference/applet-architecture',
        'reference/provisioning-gaps',
      ],
    },
    {
      type: 'category',
      label: 'Tools',
      collapsed: false,
      items: [
        {
          type: 'link',
          label: 'HOTP Tester',
          href: '/hotp-tester.html',
        },
      ],
    },
  ],
};

export default sidebars;