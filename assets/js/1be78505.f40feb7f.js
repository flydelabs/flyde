"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[514,893],{3670:function(e,t,a){a.r(t),a.d(t,{default:function(){return Te}});var n=a(7378),r=a(8944),l=a(8831),i=a(5484),o=a(9024),c=a(3149),s=a(5611),d=a(2095),m=a(9274),u=a(9213),b=a(3457),p=a(4993);var v="backToTopButton_iEvu",h="backToTopButtonShow_DO8w";function f(){var e=function(e){var t=e.threshold,a=(0,n.useState)(!1),r=a[0],l=a[1],i=(0,n.useRef)(!1),o=(0,b.Ct)(),c=o.startScroll,s=o.cancelScroll;return(0,b.RF)((function(e,a){var n=e.scrollY,r=null==a?void 0:a.scrollY;r&&(i.current?i.current=!1:n>=r?(s(),l(!1)):n<t?l(!1):n+window.innerHeight<document.documentElement.scrollHeight&&l(!0))})),(0,p.S)((function(e){e.location.hash&&(i.current=!0,l(!1))})),{shown:r,scrollToTop:function(){return c(0)}}}({threshold:300}),t=e.shown,a=e.scrollToTop;return n.createElement("button",{"aria-label":(0,u.I)({id:"theme.BackToTopButton.buttonAriaLabel",message:"Scroll back to top",description:"The ARIA label for the back to top button"}),className:(0,r.Z)("clean-btn",i.k.common.backToTopButton,v,t&&h),type:"button",onClick:a})}var E=a(5331),g=a(8357),k=a(624),_=a(898),C=a(2685);function I(e){return n.createElement("svg",(0,C.Z)({width:"20",height:"20","aria-hidden":"true"},e),n.createElement("g",{fill:"#7a7a7a"},n.createElement("path",{d:"M9.992 10.023c0 .2-.062.399-.172.547l-4.996 7.492a.982.982 0 01-.828.454H1c-.55 0-1-.453-1-1 0-.2.059-.403.168-.551l4.629-6.942L.168 3.078A.939.939 0 010 2.528c0-.548.45-.997 1-.997h2.996c.352 0 .649.18.828.45L9.82 9.472c.11.148.172.347.172.55zm0 0"}),n.createElement("path",{d:"M19.98 10.023c0 .2-.058.399-.168.547l-4.996 7.492a.987.987 0 01-.828.454h-3c-.547 0-.996-.453-.996-1 0-.2.059-.403.168-.551l4.625-6.942-4.625-6.945a.939.939 0 01-.168-.55 1 1 0 01.996-.997h3c.348 0 .649.18.828.45l4.996 7.492c.11.148.168.347.168.55zm0 0"})))}var Z="collapseSidebarButton_oTwn",N="collapseSidebarButtonIcon_pMEX";function S(e){var t=e.onClick;return n.createElement("button",{type:"button",title:(0,u.I)({id:"theme.docs.sidebar.collapseButtonTitle",message:"Collapse sidebar",description:"The title attribute for collapse button of doc sidebar"}),"aria-label":(0,u.I)({id:"theme.docs.sidebar.collapseButtonAriaLabel",message:"Collapse sidebar",description:"The title attribute for collapse button of doc sidebar"}),className:(0,r.Z)("button button--secondary button--outline",Z),onClick:t},n.createElement(I,{className:N}))}var T=a(10),x=a(1244),y=a(8219),L=Symbol("EmptyContext"),w=n.createContext(L);function A(e){var t=e.children,a=(0,n.useState)(null),r=a[0],l=a[1],i=(0,n.useMemo)((function(){return{expandedItem:r,setExpandedItem:l}}),[r]);return n.createElement(w.Provider,{value:i},t)}var M=a(376),B=a(8862),P=a(1884),F=a(6457),H=["item","onItemClick","activePath","level","index"];function R(e){var t=e.categoryLabel,a=e.onClick;return n.createElement("button",{"aria-label":(0,u.I)({id:"theme.DocSidebarItem.toggleCollapsedCategoryAriaLabel",message:"Toggle the collapsible sidebar category '{label}'",description:"The ARIA label to toggle the collapsible sidebar category"},{label:t}),type:"button",className:"clean-btn menu__caret",onClick:a})}function W(e){var t=e.item,a=e.onItemClick,l=e.activePath,c=e.level,s=e.index,d=(0,x.Z)(e,H),m=t.items,u=t.label,b=t.collapsible,p=t.className,v=t.href,h=(0,k.L)().docs.sidebar.autoCollapseCategories,f=function(e){var t=(0,F.Z)();return(0,n.useMemo)((function(){return e.href?e.href:!t&&e.collapsible?(0,o.Wl)(e):void 0}),[e,t])}(t),E=(0,o._F)(t,l),g=(0,B.Mg)(v,l),_=(0,M.u)({initialState:function(){return!!b&&(!E&&t.collapsed)}}),I=_.collapsed,Z=_.setCollapsed,N=function(){var e=(0,n.useContext)(w);if(e===L)throw new y.i6("DocSidebarItemsExpandedStateProvider");return e}(),S=N.expandedItem,T=N.setExpandedItem,A=function(e){void 0===e&&(e=!I),T(e?null:s),Z(e)};return function(e){var t=e.isActive,a=e.collapsed,r=e.updateCollapsed,l=(0,y.D9)(t);(0,n.useEffect)((function(){t&&!l&&a&&r(!1)}),[t,l,a,r])}({isActive:E,collapsed:I,updateCollapsed:A}),(0,n.useEffect)((function(){b&&S&&S!==s&&h&&Z(!0)}),[b,S,s,Z,h]),n.createElement("li",{className:(0,r.Z)(i.k.docs.docSidebarItemCategory,i.k.docs.docSidebarItemCategoryLevel(c),"menu__list-item",{"menu__list-item--collapsed":I},p)},n.createElement("div",{className:(0,r.Z)("menu__list-item-collapsible",{"menu__list-item-collapsible--active":g})},n.createElement(P.Z,(0,C.Z)({className:(0,r.Z)("menu__link",{"menu__link--sublist":b,"menu__link--sublist-caret":!v&&b,"menu__link--active":E}),onClick:b?function(e){null==a||a(t),v?A(!1):(e.preventDefault(),A())}:function(){null==a||a(t)},"aria-current":g?"page":void 0,"aria-expanded":b?!I:void 0,href:b?null!=f?f:"#":f},d),u),v&&b&&n.createElement(R,{categoryLabel:u,onClick:function(e){e.preventDefault(),A()}})),n.createElement(M.z,{lazy:!0,as:"ul",className:"menu__list",collapsed:I},n.createElement(Q,{items:m,tabIndex:I?-1:0,onItemClick:a,activePath:l,level:c+1})))}var D=a(5626),Y=a(8241),z="menuExternalLink_BiEj",j=["item","onItemClick","activePath","level","index"];function O(e){var t=e.item,a=e.onItemClick,l=e.activePath,c=e.level,s=(e.index,(0,x.Z)(e,j)),d=t.href,m=t.label,u=t.className,b=(0,o._F)(t,l),p=(0,D.Z)(d);return n.createElement("li",{className:(0,r.Z)(i.k.docs.docSidebarItemLink,i.k.docs.docSidebarItemLinkLevel(c),"menu__list-item",u),key:m},n.createElement(P.Z,(0,C.Z)({className:(0,r.Z)("menu__link",!p&&z,{"menu__link--active":b}),"aria-current":b?"page":void 0,to:d},p&&{onClick:a?function(){return a(t)}:void 0},s),m,!p&&n.createElement(Y.Z,null)))}var V="menuHtmlItem_OniL";function G(e){var t=e.item,a=e.level,l=e.index,o=t.value,c=t.defaultStyle,s=t.className;return n.createElement("li",{className:(0,r.Z)(i.k.docs.docSidebarItemLink,i.k.docs.docSidebarItemLinkLevel(a),c&&[V,"menu__list-item"],s),key:l,dangerouslySetInnerHTML:{__html:o}})}var K=["item"];function U(e){var t=e.item,a=(0,x.Z)(e,K);switch(t.type){case"category":return n.createElement(W,(0,C.Z)({item:t},a));case"html":return n.createElement(G,(0,C.Z)({item:t},a));default:return n.createElement(O,(0,C.Z)({item:t},a))}}var q=["items"];function J(e){var t=e.items,a=(0,x.Z)(e,q);return n.createElement(A,null,t.map((function(e,t){return n.createElement(U,(0,C.Z)({key:t,item:e,index:t},a))})))}var Q=(0,n.memo)(J),X="menu_jmj1",$="menuWithAnnouncementBar_YufC";function ee(e){var t=e.path,a=e.sidebar,l=e.className,o=function(){var e=(0,T.nT)().isActive,t=(0,n.useState)(e),a=t[0],r=t[1];return(0,b.RF)((function(t){var a=t.scrollY;e&&r(0===a)}),[e]),e&&a}();return n.createElement("nav",{className:(0,r.Z)("menu thin-scrollbar",X,o&&$,l)},n.createElement("ul",{className:(0,r.Z)(i.k.docs.docSidebarMenu,"menu__list")},n.createElement(Q,{items:a,activePath:t,level:1})))}var te="sidebar_CUen",ae="sidebarWithHideableNavbar_w4KB",ne="sidebarHidden_k6VE",re="sidebarLogo_CYvI";function le(e){var t=e.path,a=e.sidebar,l=e.onCollapse,i=e.isHidden,o=(0,k.L)(),c=o.navbar.hideOnScroll,s=o.docs.sidebar.hideable;return n.createElement("div",{className:(0,r.Z)(te,c&&ae,i&&ne)},c&&n.createElement(_.Z,{tabIndex:-1,className:re}),n.createElement(ee,{path:t,sidebar:a}),s&&n.createElement(S,{onClick:l}))}var ie=n.memo(le),oe=a(3471),ce=a(2335),se=function(e){var t=e.sidebar,a=e.path,l=(0,ce.e)();return n.createElement("ul",{className:(0,r.Z)(i.k.docs.docSidebarMenu,"menu__list")},n.createElement(Q,{items:t,activePath:a,onItemClick:function(e){"category"===e.type&&e.href&&l.toggle(),"link"===e.type&&l.toggle()},level:1}))};function de(e){return n.createElement(oe.Zo,{component:se,props:e})}var me=n.memo(de);function ue(e){var t=(0,g.i)(),a="desktop"===t||"ssr"===t,r="mobile"===t;return n.createElement(n.Fragment,null,a&&n.createElement(ie,e),r&&n.createElement(me,e))}var be="expandButton_YOoA",pe="expandButtonIcon_GZLG";function ve(e){var t=e.toggleSidebar;return n.createElement("div",{className:be,title:(0,u.I)({id:"theme.docs.sidebar.expandButtonTitle",message:"Expand sidebar",description:"The ARIA label and title attribute for expand button of doc sidebar"}),"aria-label":(0,u.I)({id:"theme.docs.sidebar.expandButtonAriaLabel",message:"Expand sidebar",description:"The ARIA label and title attribute for expand button of doc sidebar"}),tabIndex:0,role:"button",onKeyDown:t,onClick:t},n.createElement(I,{className:pe}))}var he="docSidebarContainer_y0RQ",fe="docSidebarContainerHidden_uArb";function Ee(e){var t,a=e.children,r=(0,d.V)();return n.createElement(n.Fragment,{key:null!=(t=null==r?void 0:r.name)?t:"noSidebar"},a)}function ge(e){var t=e.sidebar,a=e.hiddenSidebarContainer,l=e.setHiddenSidebarContainer,o=(0,E.TH)().pathname,c=(0,n.useState)(!1),s=c[0],d=c[1],m=(0,n.useCallback)((function(){s&&d(!1),l((function(e){return!e}))}),[l,s]);return n.createElement("aside",{className:(0,r.Z)(i.k.docs.docSidebarContainer,he,a&&fe),onTransitionEnd:function(e){e.currentTarget.classList.contains(he)&&a&&d(!0)}},n.createElement(Ee,null,n.createElement(ue,{sidebar:t,path:o,onCollapse:m,isHidden:s})),s&&n.createElement(ve,{toggleSidebar:m}))}var ke={docMainContainer:"docMainContainer_sTIZ",docMainContainerEnhanced:"docMainContainerEnhanced_iSjt",docItemWrapperEnhanced:"docItemWrapperEnhanced_PxMR"};function _e(e){var t=e.hiddenSidebarContainer,a=e.children,l=(0,d.V)();return n.createElement("main",{className:(0,r.Z)(ke.docMainContainer,(t||!l)&&ke.docMainContainerEnhanced)},n.createElement("div",{className:(0,r.Z)("container padding-top--md padding-bottom--lg",ke.docItemWrapper,t&&ke.docItemWrapperEnhanced)},a))}var Ce="docPage_KLoz",Ie="docsWrapper_ct1J";function Ze(e){var t=e.children,a=(0,d.V)(),r=(0,n.useState)(!1),l=r[0],i=r[1];return n.createElement(m.Z,{wrapperClassName:Ie},n.createElement(f,null),n.createElement("div",{className:Ce},a&&n.createElement(ge,{sidebar:a.items,hiddenSidebarContainer:l,setHiddenSidebarContainer:i}),n.createElement(_e,{hiddenSidebarContainer:l},t)))}var Ne=a(3893),Se=a(505);function Te(e){var t=e.versionMetadata,a=(0,o.hI)(e);if(!a)return n.createElement(Ne.default,null);var m=a.docElement,u=a.sidebarName,b=a.sidebarItems;return n.createElement(n.Fragment,null,n.createElement(Se.Z,{version:t.version,tag:(0,c.os)(t.pluginId,t.version)}),n.createElement(l.FG,{className:(0,r.Z)(i.k.wrapper.docsPages,i.k.page.docsDocPage,e.versionMetadata.className)},n.createElement(s.q,{version:t},n.createElement(d.b,{name:u,items:b},n.createElement(Ze,null,m)))))}},3893:function(e,t,a){a.r(t),a.d(t,{default:function(){return o}});var n=a(7378),r=a(9213),l=a(8831),i=a(9274);function o(){return n.createElement(n.Fragment,null,n.createElement(l.d,{title:(0,r.I)({id:"theme.NotFound.title",message:"Page Not Found"})}),n.createElement(i.Z,null,n.createElement("main",{className:"container margin-vert--xl"},n.createElement("div",{className:"row"},n.createElement("div",{className:"col col--6 col--offset-3"},n.createElement("h1",{className:"hero__title"},n.createElement(r.Z,{id:"theme.NotFound.title",description:"The title of the 404 page"},"Page Not Found")),n.createElement("p",null,n.createElement(r.Z,{id:"theme.NotFound.p1",description:"The first paragraph of the 404 page"},"We could not find what you were looking for.")),n.createElement("p",null,n.createElement(r.Z,{id:"theme.NotFound.p2",description:"The 2nd paragraph of the 404 page"},"Please contact the owner of the site that linked you to the original URL and let them know their link is broken.")))))))}}}]);