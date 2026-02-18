import{j as e}from"./jsx-runtime-u17CrQMm.js";import{M as s}from"./MarkdownContent-CWM7uuTy.js";import"./CodeBlock-_T1rTjb5.js";import"./iframe-CJQCZEUI.js";import"./preload-helper-PPVm8Dsz.js";function a({content:r,onDelete:o}){return e.jsxs("div",{className:"copilot-annotation",children:[e.jsxs("div",{className:"copilot-annotation__header",children:[e.jsx("span",{className:"copilot-annotation__badge",children:"Commentary"}),o&&e.jsx("button",{className:"copilot-annotation__delete",onClick:o,children:"Remove"})]}),e.jsx("div",{className:"copilot-annotation__body",children:e.jsx(s,{content:r})})]})}a.__docgenInfo={description:"",methods:[],displayName:"CopilotAnnotationBlock",props:{content:{required:!0,tsType:{name:"string"},description:""},onDelete:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const d={component:a,parameters:{theme:"copilot"}},n={args:{content:"This section demonstrates how the session parser handles malformed JSONL input gracefully by skipping invalid lines rather than failing the entire parse."}},t={args:{content:"An important note about the refactoring approach chosen here.",onDelete:()=>{}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    content: 'This section demonstrates how the session parser handles malformed JSONL input gracefully by skipping invalid lines rather than failing the entire parse.'
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    content: 'An important note about the refactoring approach chosen here.',
    onDelete: () => {}
  }
}`,...t.parameters?.docs?.source}}};const h=["ReadOnly","WithRemoveButton"];export{n as ReadOnly,t as WithRemoveButton,h as __namedExportsOrder,d as default};
