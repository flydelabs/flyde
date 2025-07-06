// const frame = document.querySelector('iframe');
// const vscode = acquireVsCodeApi();

// window.addEventListener('message', async e => {
//   const { source, type } = e.data;

//   if ( type === 'hotkeys-propagation') {
//       window.dispatchEvent(new KeyboardEvent('keydown', e.data.keyboardEvent));
//   } else if (source === 'app') {
//     vscode.postMessage(e.data);
//   } else if (source === 'extension') {
//     frame.contentWindow.postMessage(e.data, '*');
//   }
// });