import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as i}from"./iframe-CKOTIaVG.js";import{C as m,a as d}from"./index.esm-BW6iMnzH.js";import"./preload-helper-PPVm8Dsz.js";function t({summary:n,count:c,children:r}){const[s,p]=i.useState(!1);return e.jsxs("div",{className:"copilot-collapsed",children:[e.jsxs("button",{className:"copilot-collapsed__header",onClick:()=>p(!s),"aria-expanded":s,children:[s?e.jsx(m,{size:14}):e.jsx(d,{size:14}),e.jsx("span",{className:"copilot-collapsed__summary",children:n}),e.jsxs("span",{className:"copilot-collapsed__count",children:[c," items"]})]}),s&&r&&e.jsx("div",{className:"copilot-collapsed__content",children:r})]})}t.__docgenInfo={description:"",methods:[],displayName:"CopilotCollapsedGroup",props:{summary:{required:!0,tsType:{name:"string"},description:""},count:{required:!0,tsType:{name:"number"},description:""},children:{required:!1,tsType:{name:"ReactNode"},description:""}}};const g={component:t,parameters:{theme:"copilot"}},o={args:{summary:"File operations",count:5}},a={args:{summary:"Refactored session parser to handle edge cases in JSONL format",count:12}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    summary: 'File operations',
    count: 5
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    summary: 'Refactored session parser to handle edge cases in JSONL format',
    count: 12
  }
}`,...a.parameters?.docs?.source}}};const h=["Default","LongSummary"];export{o as Default,a as LongSummary,h as __namedExportsOrder,g as default};
