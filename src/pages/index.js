import React from 'react';
import Layout from '@theme/Layout';

const kbs = [
  {
    title: 'Hardware Security Keys',
    href: '/hardware-keys/',
    description:
      'Field-tested runbooks and reference material for diagnosing, recovering, and re-provisioning enterprise smart card and FIDO2 security keys.',
  },
  {
    title: 'Splunk',
    href: '/splunk/',
    description:
      'Frequent notes, SPL snippets, and operational reminders for day-to-day Splunk search and troubleshooting.',
  },
];

export default function Home() {
  return (
    <Layout
      title="Knowledge Base"
      description="Frequent notes and field-tested runbooks by artrosas">
      <main className="container margin-vert--xl">
        <div className="intro-hero">
          <h1>artrosas Knowledge Base</h1>
          <p className="lead">
            A collection of frequent notes and field-tested runbooks. Pick a
            knowledge base to dive in.
          </p>
        </div>

        <div className="card-grid">
          {kbs.map((kb) => (
            <a className="card" href={kb.href} key={kb.href}>
              <h3>{kb.title}</h3>
              <p>{kb.description}</p>
            </a>
          ))}
        </div>
      </main>
    </Layout>
  );
}
