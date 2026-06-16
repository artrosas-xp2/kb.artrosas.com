import React from 'react';
import Layout from '@theme/Layout';
import EnrollScroll from '@site/src/components/EnrollScroll';

export default function Enroll() {
  return (
    <Layout
      title="Enroll Your HID Key"
      description="A scroll-driven walkthrough of connecting your HID security key to your phone.">
      <main>
        <EnrollScroll />
      </main>
    </Layout>
  );
}
