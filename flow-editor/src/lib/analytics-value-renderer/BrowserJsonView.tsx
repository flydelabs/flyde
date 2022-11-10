import type { ReactJsonViewProps } from 'react-json-view';

export const BrowserOnlyReactJson: React.FC<ReactJsonViewProps> = (props) => {
    if (typeof window === 'undefined') {
      return null;
    }
    const ReactJson = require('react-json-view').default;
    return <ReactJson {...props} />;
  };