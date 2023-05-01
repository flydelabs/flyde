"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[3432],{54852:(e,t,r)=>{r.d(t,{Zo:()=>s,kt:()=>u});var n=r(49231);function i(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){i(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function o(e,t){if(null==e)return{};var r,n,i=function(e,t){if(null==e)return{};var r,n,i={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(i[r]=e[r]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}var p=n.createContext({}),c=function(e){var t=n.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},s=function(e){var t=c(e.components);return n.createElement(p.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,i=e.mdxType,a=e.originalType,p=e.parentName,s=o(e,["components","mdxType","originalType","parentName"]),f=c(r),u=i,m=f["".concat(p,".").concat(u)]||f[u]||d[u]||a;return r?n.createElement(m,l(l({ref:t},s),{},{components:r})):n.createElement(m,l({ref:t},s))}));function u(e,t){var r=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var a=r.length,l=new Array(a);l[0]=f;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o.mdxType="string"==typeof e?e:i,l[1]=o;for(var c=2;c<a;c++)l[c]=r[c];return n.createElement.apply(null,l)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},20407:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>p,contentTitle:()=>l,default:()=>d,frontMatter:()=>a,metadata:()=>o,toc:()=>c});var n=r(45675),i=(r(49231),r(54852));const a={id:"PartStyle",title:"Interface: PartStyle",sidebar_label:"PartStyle",sidebar_position:0,custom_edit_url:null},l=void 0,o={unversionedId:"api-reference/interfaces/PartStyle",id:"api-reference/interfaces/PartStyle",title:"Interface: PartStyle",description:"Properties",source:"@site/docs/api-reference/interfaces/PartStyle.md",sourceDirName:"api-reference/interfaces",slug:"/api-reference/interfaces/PartStyle",permalink:"/docs/api-reference/interfaces/PartStyle",draft:!1,editUrl:null,tags:[],version:"current",sidebarPosition:0,frontMatter:{id:"PartStyle",title:"Interface: PartStyle",sidebar_label:"PartStyle",sidebar_position:0,custom_edit_url:null},sidebar:"tutorialSidebar",previous:{title:"PartInstanceConfig",permalink:"/docs/api-reference/interfaces/PartInstanceConfig"},next:{title:"RefPartInstance",permalink:"/docs/api-reference/interfaces/RefPartInstance"}},p={},c=[{value:"Properties",id:"properties",level:2},{value:"color",id:"color",level:3},{value:"Defined in",id:"defined-in",level:4},{value:"cssOverride",id:"cssoverride",level:3},{value:"Defined in",id:"defined-in-1",level:4},{value:"icon",id:"icon",level:3},{value:"Defined in",id:"defined-in-2",level:4},{value:"size",id:"size",level:3},{value:"Defined in",id:"defined-in-3",level:4}],s={toc:c};function d(e){let{components:t,...r}=e;return(0,i.kt)("wrapper",(0,n.Z)({},s,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"color"},"color"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"color"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string")," ","|"," ","[",(0,i.kt)("inlineCode",{parentName:"p"},"string"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"string"),"]"),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/FlydeHQ/flyde/blob/0975600/core/src/part/part.ts#L69"},"core/src/part/part.ts:69")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"cssoverride"},"cssOverride"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"cssOverride"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"Record"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"string"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"string"),">"),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/FlydeHQ/flyde/blob/0975600/core/src/part/part.ts#L70"},"core/src/part/part.ts:70")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"icon"},"icon"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"icon"),": ",(0,i.kt)("a",{parentName:"p",href:"/docs/api-reference/modules#parttypeicon"},(0,i.kt)("inlineCode",{parentName:"a"},"PartTypeIcon"))),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/FlydeHQ/flyde/blob/0975600/core/src/part/part.ts#L67"},"core/src/part/part.ts:67")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"size"},"size"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"size"),": ",(0,i.kt)("a",{parentName:"p",href:"/docs/api-reference/modules#partstylesize"},(0,i.kt)("inlineCode",{parentName:"a"},"PartStyleSize"))),(0,i.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/FlydeHQ/flyde/blob/0975600/core/src/part/part.ts#L68"},"core/src/part/part.ts:68")))}d.isMDXComponent=!0}}]);