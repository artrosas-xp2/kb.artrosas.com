// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  splunkSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Building a search',
      collapsed: false,
      items: [
        'notes/structured-query',
        {
          type: 'category',
          label: 'Filters',
          collapsed: false,
          className: 'sidebar-stage sidebar-stage-filters',
          link: { type: 'doc', id: 'filters/overview' },
          items: [
            'filters/base-filters',
            'filters/time-modifiers',
            'filters/keywords-and-booleans',
            'filters/where-command',
            'filters/dedup-head',
          ],
        },
        {
          type: 'category',
          label: 'Transform',
          collapsed: false,
          className: 'sidebar-stage sidebar-stage-transform',
          link: { type: 'doc', id: 'transform/overview' },
          items: [
            'transform/rex',
            'transform/eval',
            'transform/lookups',
            'transform/fields-and-rename',
          ],
        },
        {
          type: 'category',
          label: 'Report',
          collapsed: false,
          className: 'sidebar-stage sidebar-stage-report',
          link: { type: 'doc', id: 'report/overview' },
          items: [
            'report/stats',
            'report/chart-timechart',
            'report/top-rare',
            'report/transaction',
            'report/advanced',
          ],
        },
        {
          type: 'category',
          label: 'Format',
          collapsed: false,
          className: 'sidebar-stage sidebar-stage-format',
          link: { type: 'doc', id: 'format/overview' },
          items: [
            'format/sort',
            'format/head-tail',
            'format/table-rename',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Dashboards',
      collapsed: false,
      className: 'sidebar-stage sidebar-stage-dashboards',
      link: { type: 'doc', id: 'dashboards/overview' },
      items: [
        'dashboards/panels',
        'dashboards/inputs-and-tokens',
        'dashboards/reports-and-alerts',
        'dashboards/performance',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      className: 'sidebar-stage sidebar-stage-reference',
      items: [
        'notes/search-cheatsheet',
      ],
    },
  ],
};

export default sidebars;
