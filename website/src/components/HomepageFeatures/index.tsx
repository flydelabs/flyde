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
    title: 'Fully Integrable',
    Svg: require('@site/static/img/undraw_vcs.svg').default,
    description: (
      <>
        Flyde fully integrates into your <mark>existing codebase, version control system and CI/CD</mark> pipeline. Enjoy the benefits of visual programming without sacrificing modern engineering practices.
      </>
    ),
  },
  {
    title: 'Everyone Can Understand and Collaborate',
    Svg: require('@site/static/img/undraw_collab.svg').default,
    description: (
      <>
        Flyde democratizes development by allowing anyone to understand and even collaborate on a project.
        Turn <mark>your codebase into a low-code platform!</mark>
      </>
    ),
  },
  {
    title: 'Living Documentation',
    Svg: require('@site/static/img/undraw_visionary_tech.svg').default,
    description: (
      <>
        Maintaining and updating diagrams for documentation is hard.
        By using Flyde for flows, you get an <mark>consistent flow chart representing your logic.</mark>
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
