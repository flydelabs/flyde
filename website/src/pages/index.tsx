import React from 'react';
import Typical from 'react-typical'
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.css';

const IntegrationPoints = () => {
  return <strong className='integration-points'><Typical
    steps={['IDE', 2000, 'CI/CD', 2000, 'Version Control', 2000, 'Testing Setup', 2000]}
    loop={Infinity}
    wrapper="span"
  /></strong>
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">Flyde is an <em>open source</em> flow-based, visual programming tool that fully integrates with your <IntegrationPoints/></p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/playground">
            Try Online for Free
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Visual Programming Tool`}
      description="Flyde is a modern visual programming tool that fully integrates with your codebase">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
