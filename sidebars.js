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
        'tools/hotp-tester',
        {
          type: 'category',
          label: 'PowerShell Scripts',
          items: [
            'tools/powershell-scripts/get-token-info',
            'tools/powershell-scripts/re-provision-a-key',
          ],
        },
      ],
    },
//  {
//       type: 'category',
//       label: 'Tools',
//       collapsed: false,
//       items: [
//         {
//           type: 'html',
//           value: '<a class="menu__link" href="/hotp-tester.html">HOTP Tester</a>',
//           defaultStyle: true,
//         },
//       ],
//     },
  ],
};

export default sidebars;

