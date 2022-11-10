import * as ReactDOM from "react-dom";
import * as React from "react";

class Renderer extends React.PureComponent<any, any> {
  state = { error: false };

  componentDidCatch(e: any, info: any) {
    console.error(e, info);
    this.props.log("Error rendering react" + info);
    this.setState({ hasError: true });
  }

  static getDerivedStateFromError() {
    return { error: true };
  }

  render() {
    return this.state.error ? (
      <div>Error</div>
    ) : (
      <div>{this.props.children}</div>
    );
  }
}

export const renderJsx = (val: JSX.Element | string, log: Function) => {
  const elem = document.getElementById("react-root");
  try {
    let strVal = val;
    try {
      ReactDOM.render(<Renderer log={log}>{strVal}</Renderer>, elem);
    } catch (e) {
      strVal = JSON.stringify(val);
      ReactDOM.render(<Renderer log={log}>{strVal}</Renderer>, elem);
    }
  } catch (e) {
    //
  }
};
