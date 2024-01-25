"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[2153],{38570:(e,a,n)=>{n.d(a,{Zo:()=>d,kt:()=>g});var t=n(70079);function r(e,a,n){return a in e?Object.defineProperty(e,a,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[a]=n,e}function l(e,a){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(e);a&&(t=t.filter((function(a){return Object.getOwnPropertyDescriptor(e,a).enumerable}))),n.push.apply(n,t)}return n}function o(e){for(var a=1;a<arguments.length;a++){var n=null!=arguments[a]?arguments[a]:{};a%2?l(Object(n),!0).forEach((function(a){r(e,a,n[a])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(n,a))}))}return e}function s(e,a){if(null==e)return{};var n,t,r=function(e,a){if(null==e)return{};var n,t,r={},l=Object.keys(e);for(t=0;t<l.length;t++)n=l[t],a.indexOf(n)>=0||(r[n]=e[n]);return r}(e,a);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(t=0;t<l.length;t++)n=l[t],a.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=t.createContext({}),p=function(e){var a=t.useContext(i),n=a;return e&&(n="function"==typeof e?e(a):o(o({},a),e)),n},d=function(e){var a=p(e.components);return t.createElement(i.Provider,{value:a},e.children)},c="mdxType",u={inlineCode:"code",wrapper:function(e){var a=e.children;return t.createElement(t.Fragment,{},a)}},y=t.forwardRef((function(e,a){var n=e.components,r=e.mdxType,l=e.originalType,i=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),c=p(n),y=r,g=c["".concat(i,".").concat(y)]||c[y]||u[y]||l;return n?t.createElement(g,o(o({ref:a},d),{},{components:n})):t.createElement(g,o({ref:a},d))}));function g(e,a){var n=arguments,r=a&&a.mdxType;if("string"==typeof e||r){var l=n.length,o=new Array(l);o[0]=y;var s={};for(var i in a)hasOwnProperty.call(a,i)&&(s[i]=a[i]);s.originalType=e,s[c]="string"==typeof e?e:r,o[1]=s;for(var p=2;p<l;p++)o[p]=n[p];return t.createElement.apply(null,o)}return t.createElement.apply(null,n)}y.displayName="MDXCreateElement"},79885:(e,a,n)=>{n.r(a),n.d(a,{assets:()=>i,contentTitle:()=>o,default:()=>u,frontMatter:()=>l,metadata:()=>s,toc:()=>p});var t=n(10328),r=(n(70079),n(38570));const l={sidebar_position:7},o="Installing/Publishing Packages",s={unversionedId:"packages",id:"packages",title:"Installing/Publishing Packages",description:"Installing Flyde packages",source:"@site/docs/packages.md",sourceDirName:".",slug:"/packages",permalink:"/docs/packages",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/packages.md",tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7},sidebar:"tutorialSidebar",previous:{title:"Creating New Code Nodes",permalink:"/docs/code-nodes"},next:{title:"Flyde Nodes Library",permalink:"/docs/StdLib/"}},i={},p=[{value:"Installing Flyde packages",id:"installing-flyde-packages",level:2},{value:"Publishing Flyde packages",id:"publishing-flyde-packages",level:2},{value:"Step 1: Prepare your package",id:"step-1-prepare-your-package",level:3},{value:"Step 2: Publish your package",id:"step-2-publish-your-package",level:3},{value:"Step 3: Install your package",id:"step-3-install-your-package",level:3}],d={toc:p},c="wrapper";function u(e){let{components:a,...n}=e;return(0,r.kt)(c,(0,t.Z)({},d,n,{components:a,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"installingpublishing-packages"},"Installing/Publishing Packages"),(0,r.kt)("h2",{id:"installing-flyde-packages"},"Installing Flyde packages"),(0,r.kt)("p",null,"Flyde packages are published to npm, and can be installed using the standard npm install command. To install a Flyde package, run the following command: ",(0,r.kt)("inlineCode",{parentName:"p"},"npm install flyde-mypackage")," or ",(0,r.kt)("inlineCode",{parentName:"p"},"yarn add flyde-mypackage"),"."),(0,r.kt)("h2",{id:"publishing-flyde-packages"},"Publishing Flyde packages"),(0,r.kt)("p",null,'Flyde leverages the existing npm ecosystem to manage packages. To publish Flyde nodes to npm, you need to add a "flyde.exposes" property to your package.json - an array of globs that will contain Flyde nodes (either code nodes or visual nodes). Additionally, you should make sure that the package name starts with "flyde-", and includes the "flyde" and "flyde-package" keywords in the package.json.'),(0,r.kt)("h3",{id:"step-1-prepare-your-package"},"Step 1: Prepare your package"),(0,r.kt)("p",null,'Create a new npm package or use an existing one. Make sure that the package contains the Flyde nodes that you want to publish in a folder called "nodes" or any other folder of your choice. The nodes should be either ',(0,r.kt)("inlineCode",{parentName:"p"},".flyde"),", ",(0,r.kt)("inlineCode",{parentName:"p"},".flyde.js")," or ",(0,r.kt)("inlineCode",{parentName:"p"},".flyde.ts")," files."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "name": "flyde-mypackage",\n  "version": "1.0.0",\n  "description": "My Flyde package",\n  "dependencies": {\n    "@flyde/core": "^0.1.0"\n  },\n  "flyde": {\n    "exposes": [\n      "nodes/**/*.flyde",\n      "nodes/**/*.flyde.js",\n      "nodes/**/*.flyde.ts"\n    ]\n  },\n  "keywords": ["flyde", "flyde-package"]\n}\n')),(0,r.kt)("p",null,"Please note that the above example is using ",(0,r.kt)("inlineCode",{parentName:"p"},"@flyde/core")," as a dependency, this is mandatory for all Flyde packages, but you can add other dependencies as you see fit."),(0,r.kt)("h3",{id:"step-2-publish-your-package"},"Step 2: Publish your package"),(0,r.kt)("p",null,"To publish your package, run ",(0,r.kt)("inlineCode",{parentName:"p"},"npm publish")," or ",(0,r.kt)("inlineCode",{parentName:"p"},"yarn publish"),". You can also use the ",(0,r.kt)("inlineCode",{parentName:"p"},"--dry-run")," flag to test your package before publishing it."),(0,r.kt)("h3",{id:"step-3-install-your-package"},"Step 3: Install your package"),(0,r.kt)("p",null,"To install your package, run ",(0,r.kt)("inlineCode",{parentName:"p"},"npm install flyde-mypackage")," or ",(0,r.kt)("inlineCode",{parentName:"p"},"yarn add flyde-mypackage"),". You can now use the nodes in your Flyde projects."),(0,r.kt)("p",null,"That's it! You can now publish Flyde packages to npm and install them in your Flyde projects."),(0,r.kt)("p",null,"If you've built a cool package and would like to be featured on the Flyde website, please let us know ",(0,r.kt)("a",{parentName:"p",href:"https://discord.gg/CnaH2YfP43"},"here"),"."))}u.isMDXComponent=!0}}]);