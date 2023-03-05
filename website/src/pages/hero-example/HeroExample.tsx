import { dynamicOutput, dynamicPartInput, noop } from '@site/../core/dist';
import { EmbeddedFlyde } from '@site/src/components/EmbeddedFlyde';
import React, { useRef } from 'react';

import helloWorldExample from "./Hero.flyde";

import { CodeBlock, dracula } from "react-code-blocks";

const code = `import {loadFlow} from '@flyde/runtime';

const executeFlow = loadFlow('Hero.flyde');

const {output} = await executeFlow();
console.log(\`Output: \$\{output\}\`);`

import './HeroExample.scss';
import { Button } from '@blueprintjs/core';
import Link from '@docusaurus/Link';

export const HeroExample: React.FC = () => {

    const [lastOutput, setLastOutput] = React.useState<any>(null);

    const inputs = useRef({
        __trigger: dynamicPartInput(),
    });

    const result = useRef(dynamicOutput());
    const flowProps = {
        flow: helloWorldExample.flow,
        resolvedFlow: helloWorldExample.resolvedFlow,
        inputs: inputs.current,
        output: result.current,
    };

    const onRunExample = () => {
      setLastOutput('');
      inputs.current.__trigger.subject.next('run');
    }

    return (<div className='hero-example'>
        <div className='buttons-container'>
        <Link
            className="button button--secondary"
            to="/playground"
          >
            Online Playground
          </Link>
          <Button className="button button--success button" onClick={onRunExample}>Run Example 👇</Button> 
          <Link
            className="button button--primary"
            href="https://marketplace.visualstudio.com/items?itemName=flydehq.flyde"
          >
            VSCode Extension
          </Link>
          <span className="gh-stars-wrapper">
            <iframe
              className="gh-stars-frame"
              src="https://ghbtns.com/github-btn.html?user=flydehq&amp;repo=flyde&amp;type=star&amp;count=true&amp;size=large"
              width={160}
              height={30}
              title="GitHub Stars"
            />
          </span>
        </div>
        <div className='flyde-hero-example-wrapper'>
        <div className='flow-wrapper'>
            <div className='file-tag'>Hero.flyde</div>
            <EmbeddedFlyde flowProps={flowProps} debugDelay={100} onOutput={(output) => {
              setLastOutput(output);
            }}/>
        </div>
        <div className='code-wrapper'>
          
            <div className='file-tag'>index.ts</div>
            <CodeBlock className='code-example' showLineNumbers={false} text={code} language="typescript" theme={dracula} codeBlock/>
            <div className='file-tag'>Terminal</div>
            <div className='terminal-emulator'>
              {lastOutput ? <span>{lastOutput}</span> : <em>Run example to show output</em>}
            </div>

        </div>
        </div>
        
        </div>);
}