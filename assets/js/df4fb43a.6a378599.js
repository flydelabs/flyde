"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[3070],{38570:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>m});var o=n(70079);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,o,r=function(e,t){if(null==e)return{};var n,o,r={},a=Object.keys(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=o.createContext({}),c=function(e){var t=o.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=c(e.components);return o.createElement(l.Provider,{value:t},e.children)},p="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},f=o.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,l=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),p=c(n),f=r,m=p["".concat(l,".").concat(f)]||p[f]||d[f]||a;return n?o.createElement(m,i(i({ref:t},u),{},{components:n})):o.createElement(m,i({ref:t},u))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,i=new Array(a);i[0]=f;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[p]="string"==typeof e?e:r,i[1]=s;for(var c=2;c<a;c++)i[c]=n[c];return o.createElement.apply(null,i)}return o.createElement.apply(null,n)}f.displayName="MDXCreateElement"},71349:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>f,frontMatter:()=>i,metadata:()=>l,toc:()=>u});var o=n(10328),r=(n(70079),n(38570));const a=n.p+"assets/images/cel-to-fah-6cc8457ee099aa10ab7cead82e9ea482.png",i={sidebar_position:4},s="Integrating with Existing Code",l={unversionedId:"integrate-flows",id:"integrate-flows",title:"Integrating with Existing Code",description:"A core tenet of Flyde is that it should integrate with existing code, and not replace it.",source:"@site/docs/4-integrate-flows.mdx",sourceDirName:".",slug:"/integrate-flows",permalink:"/docs/integrate-flows",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/4-integrate-flows.mdx",tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_position:4},sidebar:"tutorialSidebar",previous:{title:"Core Concepts",permalink:"/docs/core-concepts"},next:{title:"Creating Custom Nodes",permalink:"/docs/custom-nodes"}},c={},u=[],p={toc:u},d="wrapper";function f(e){let{components:t,...n}=e;return(0,r.kt)(d,(0,o.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"integrating-with-existing-code"},"Integrating with Existing Code"),(0,r.kt)("p",null,"A core tenet of Flyde is that it should ",(0,r.kt)("strong",{parentName:"p"},"integrate with existing code, and not replace it"),"."),(0,r.kt)("p",null,"To achieve this, Flyde provides a runtime library that allows you to load and run .flyde files, and a webpack loader that allows you to load .flyde files directly from your code. Also, custom nodes can be implemented using TypeScript or JavaScript (more on that in the ",(0,r.kt)("a",{parentName:"p",href:"/docs/custom-nodes"},"custom nodes article"),")."),(0,r.kt)("p",null,"For example, given a .flyde flow that converts Celsius to Fahrenheit:"),(0,r.kt)("img",{src:a,width:"400"}),(0,r.kt)("p",null,"You can load and run it from your code as following:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},'import { loadFlow } from "@flyde/runtime";\n\nconst execute = await loadFlow("./celsius-to-fahrenheit.flyde");\n\nconst inputs = { celsius: 0 }; // "celcius" is a main input in the flow, therefore it must be provided when executing the flow\nconst { result } = execute(inputs); // execute returns a "result" promise, along with a cleanup function that can be used to cancel the execution.\n\nconst { fahrenheit } = await result; // each output in the flow is a property on the result object\n\nconsole.log(result.fahrenheit); // 32\n')),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"execute")," function returns an object with a ",(0,r.kt)("inlineCode",{parentName:"p"},"result")," property - a promise that resolves to the result of the flow."),(0,r.kt)("p",null,'You may also listen to outputs before the flow completes by passing an "onOutputs" callback to the second argument of ',(0,r.kt)("inlineCode",{parentName:"p"},"execute"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"const { result } = execute(inputs, {\n  onOutputs: (key, value) => {\n    console.log(`output with key ${key} emitted value ${value}`);\n  },\n});\n")),(0,r.kt)("p",null,"The example above assumes a Node.js environment. Loading Flyde in a browser environment is possible, but not yet documented. Checkout the website's source code, ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/flydelabs/flyde/blob/main/website/src/pages/_examples.ts"},"here")," and ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/flydelabs/flyde/blob/main/website/docusaurus.config.js#L18"},"here")," for an example of how to do it."),(0,r.kt)("admonition",{type:"note"},(0,r.kt)("p",{parentName:"admonition"},"Learn more about the lifecycle of a flow in the ",(0,r.kt)("a",{parentName:"p",href:"./advanced-concepts"},"advanced concepts article"),".")),(0,r.kt)("p",null,"Another key method of intgrating with existing code is by creating your own custom nodes. Learn more about that in the ",(0,r.kt)("a",{parentName:"p",href:"/docs/custom-nodes"},"custom nodes article"),"."))}f.isMDXComponent=!0}}]);