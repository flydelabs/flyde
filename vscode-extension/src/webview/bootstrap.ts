import { EditorVisualNode } from "@flyde/core";

export interface BootstrapData {
  initialNode: EditorVisualNode;
  port: number;
  relativeFile: string;
  executionId: string;
  hasOpenAiToken: boolean;
  darkMode: boolean;
}

export const getBootstrapData = (): BootstrapData | null => {
  // Check for query param first (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const dummyData = urlParams.get('dummy');

  if (dummyData === 'true') {
    // Check for theme param
    const theme = urlParams.get('theme');
    const isDarkMode = theme === 'dark';
    
    // Return HelloWorld.flyde dummy data for testing
    return {
      initialNode: {
        id: 'HelloWorld',
        inputs: {},
        outputs: {
          result: {
            delayed: false
          }
        },
        instances: [
          {
            pos: { x: -43.04081217447907, y: 65.3379041689916 },
            id: 'clftmb8cw000b4668nw8u5qr9',
            inputConfig: {},
            nodeId: 'Concat',
            config: {
              a: { type: 'dynamic', value: '{{a}}' },
              b: { type: 'dynamic', value: '{{b}}' }
            },
            type: 'code',
            source: { type: 'package', data: '@flyde/stdlib' },
            node: {
              id: 'Concat',
              displayName: 'Concat',
              description: 'Concatenates two strings',
              inputs: {
                a: { description: 'First string' },
                b: { description: 'Second string' }
              },
              outputs: {
                value: { description: 'Concatenated result' }
              },
              inputsPosition: {},
              outputsPosition: {},
              connections: [],
              instances: []
            }
          },
          {
            pos: { x: -377.41700236002595, y: 156.1642438906713 },
            id: 'clftmbihe000j4668newg9ius',
            inputConfig: { delay: { mode: 'queue' } },
            nodeId: 'Delay',
            config: {
              delayMs: { type: 'number', value: 1000 },
              value: { type: 'dynamic', value: '' }
            },
            type: 'code',
            source: { type: 'package', data: '@flyde/stdlib' },
            node: {
              id: 'Delay',
              displayName: 'Delay',
              description: 'Delays a value by specified milliseconds',
              inputs: {
                value: { description: 'Value to delay' },
                delayMs: { description: 'Delay in milliseconds' }
              },
              outputs: {
                delayedValue: { description: 'Delayed value' }
              },
              inputsPosition: {},
              outputsPosition: {},
              connections: [],
              instances: []
            }
          },
          {
            pos: { x: -466.4654296875, y: -30.465015664986055 },
            id: 'amsqg1strnxzxulfuwydz998',
            inputConfig: {},
            nodeId: 'InlineValue',
            config: {
              type: { type: 'string', value: 'string' },
              value: { type: 'string', value: 'Hello' },
              label: { type: 'string', value: '"Hello"' }
            },
            type: 'code',
            source: { type: 'package', data: '@flyde/stdlib' },
            node: {
              id: 'InlineValue',
              displayName: 'Inline Value',
              description: 'Provides a constant value',
              inputs: {},
              outputs: {
                value: { description: 'The inline value' }
              },
              inputsPosition: {},
              outputsPosition: {},
              connections: [],
              instances: []
            }
          },
          {
            pos: { x: -667.8786462402344, y: 182.55645894438894 },
            id: 'c574cklre7s0epev24x40rxo',
            inputConfig: {},
            nodeId: 'InlineValue',
            config: {
              type: { type: 'string', value: 'string' },
              value: { type: 'string', value: 'World' },
              label: { type: 'string', value: '"World"' }
            },
            type: 'code',
            source: { type: 'package', data: '@flyde/stdlib' },
            node: {
              id: 'InlineValue',
              displayName: 'Inline Value',
              description: 'Provides a constant value',
              inputs: {},
              outputs: {
                value: { description: 'The inline value' }
              },
              inputsPosition: {},
              outputsPosition: {},
              connections: [],
              instances: []
            }
          }
        ],
        connections: [
          {
            from: { insId: 'clftmbihe000j4668newg9ius', pinId: 'delayedValue' },
            to: { insId: 'clftmb8cw000b4668nw8u5qr9', pinId: 'b' }
          },
          {
            from: { insId: 'clftmb8cw000b4668nw8u5qr9', pinId: 'value' },
            to: { insId: '__this', pinId: 'result' }
          },
          {
            from: { insId: 'amsqg1strnxzxulfuwydz998', pinId: 'value' },
            to: { insId: 'clftmb8cw000b4668nw8u5qr9', pinId: 'a' }
          },
          {
            from: { insId: 'c574cklre7s0epev24x40rxo', pinId: 'value' },
            to: { insId: 'clftmbihe000j4668newg9ius', pinId: 'value' }
          }
        ],
        inputsPosition: {},
        outputsPosition: {
          result: { x: 208.76090064751924, y: 82.4549585265496 }
        }
      },
      port: 3030,
      relativeFile: 'HelloWorld.flyde',
      executionId: 'test-execution',
      hasOpenAiToken: false,
      darkMode: isDarkMode
    };
  }

  try {
    const rawData = (window as any).__bootstrapData;
    if (!rawData) {
      return null;
    }
    const decodedData = decodeURIComponent(escape(atob(rawData)));
    return JSON.parse(decodedData);
  } catch (error) {
    console.error("Failed to parse bootstrap data:", error);
    return null;
  }
};