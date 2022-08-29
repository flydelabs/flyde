import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Fully Integratable',
    Svg: require('@site/static/img/undraw_vcs.svg').default,
    description: (
      <>
        Flyde fully integrates into your existing codebase, version control system and CI/CD pipeline. Enjoy the benefits of visual programming without sacrificing modern engineering practices.
      </>
    ),
  },
  {
    title: 'Collaborate with Ease',
    Svg: require('@site/static/img/undraw_collab.svg').default,
    description: (
      <>
        Flyde democratizes development by allowing anyone to understand and even collaborate on a project.
        Turn your own codebase into a low-code platform!
      </>
    ),
  },
  {
    title: 'Living Documentation',
    Svg: require('@site/static/img/undraw_visionary_tech.svg').default,
    description: (
      <>
        By using Flyde for flows, you get an always correct flow chart representing your logic.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
