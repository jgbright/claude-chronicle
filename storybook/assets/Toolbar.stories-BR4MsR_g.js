import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as v}from"./iframe-CJQASDKF.js";import"./preload-helper-PPVm8Dsz.js";function k(n,a){return a&&a!=="main"?a:n?/^\d/.test(n)?`v${n}`:n:null}function U({collapseThinking:n,onToggleCollapseThinking:a,collapseToolResults:r,onToggleCollapseToolResults:i,showHidden:d,onToggleShowHidden:c,hasDeleteEdits:l}){const[o,u]=v.useState(!1),s=v.useRef(null);v.useEffect(()=>{if(!o)return;const m=b=>{s.current&&!s.current.contains(b.target)&&u(!1)};return document.addEventListener("mousedown",m),()=>document.removeEventListener("mousedown",m)},[o]);const t=[n,r,d].filter(Boolean).length;return e.jsxs("div",{className:"toolbar__dropdown",ref:s,children:[e.jsxs("button",{className:`toolbar__dropdown-btn${t>0?" toolbar__dropdown-btn--active":""}`,onClick:()=>u(!o),"aria-expanded":o,children:["Collapse",t>0&&` (${t})`," ▾"]}),o&&e.jsxs("div",{className:"toolbar__dropdown-menu",children:[e.jsxs("label",{className:"toolbar__dropdown-item",children:[e.jsx("input",{type:"checkbox",checked:n,onChange:a}),"Hide thinking"]}),e.jsxs("label",{className:"toolbar__dropdown-item",children:[e.jsx("input",{type:"checkbox",checked:r,onChange:i}),"Hide tool results"]}),e.jsxs("label",{className:`toolbar__dropdown-item${l?"":" toolbar__dropdown-item--disabled"}`,children:[e.jsx("input",{type:"checkbox",checked:d,onChange:c,disabled:!l}),"Show hidden blocks"]})]})]})}function E({saveState:n,onRetry:a}){return n==="idle"?null:e.jsxs("span",{className:`toolbar__save toolbar__save--${n}`,children:[n==="saving"&&"Saving...",n==="saved"&&"Saved ✓",n==="error"&&e.jsxs(e.Fragment,{children:["Save failed",a&&e.jsxs(e.Fragment,{children:[" — ",e.jsx("button",{className:"toolbar__save-retry",onClick:a,children:"Retry"})]})]})]})}function y({theme:n,onThemeChange:a,sessionTitle:r,onExport:i,hasSession:d,isCollapsed:c,onToggleCollapsed:l,version:o,branch:u,onUndo:s,onRedo:t,canUndo:m=!1,canRedo:b=!1,collapseThinking:S=!1,onToggleCollapseThinking:T,collapseToolResults:j=!1,onToggleCollapseToolResults:_,showHidden:w=!1,onToggleShowHidden:C,hasDeleteEdits:N=!1,saveState:q="idle",onRetrySave:R}){const x=k(o,u);return e.jsxs("div",{className:"toolbar",children:[e.jsxs("div",{className:"toolbar__left",children:[e.jsxs("h1",{className:"toolbar__brand",children:["Chronicle",x&&e.jsx("span",{className:"toolbar__descriptor",children:x})]}),r&&e.jsx("span",{className:"toolbar__title",children:r})]}),e.jsxs("div",{className:"toolbar__right",children:[d&&e.jsxs(e.Fragment,{children:[l&&e.jsx("button",{className:`toolbar__focus-btn${c?" toolbar__focus-btn--active":""}`,onClick:l,children:c?"Unfocus":"Focus"}),T&&_&&C&&e.jsx(U,{collapseThinking:S,onToggleCollapseThinking:T,collapseToolResults:j,onToggleCollapseToolResults:_,showHidden:w,onToggleShowHidden:C,hasDeleteEdits:N}),e.jsx(E,{saveState:q,onRetry:R}),s&&e.jsx("button",{className:"toolbar__action-btn",onClick:s,disabled:!m,title:"Undo (Ctrl+Z)",children:"Undo"}),t&&e.jsx("button",{className:"toolbar__action-btn",onClick:t,disabled:!b,title:"Redo (Ctrl+Y)",children:"Redo"}),i&&e.jsx("button",{className:"toolbar__export-btn",onClick:i,children:"Export"})]}),e.jsxs("div",{className:"toolbar__theme-switch",children:[e.jsx("button",{className:`toolbar__theme-btn ${n==="claude"?"toolbar__theme-btn--active":""}`,onClick:()=>a("claude"),children:"Claude"}),e.jsx("button",{className:`toolbar__theme-btn ${n==="copilot"?"toolbar__theme-btn--active":""}`,onClick:()=>a("copilot"),children:"Copilot"})]})]})]})}y.__docgenInfo={description:"",methods:[],displayName:"Toolbar",props:{theme:{required:!0,tsType:{name:"union",raw:"'claude' | 'copilot'",elements:[{name:"literal",value:"'claude'"},{name:"literal",value:"'copilot'"}]},description:""},onThemeChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(theme: Theme) => void",signature:{arguments:[{type:{name:"union",raw:"'claude' | 'copilot'",elements:[{name:"literal",value:"'claude'"},{name:"literal",value:"'copilot'"}]},name:"theme"}],return:{name:"void"}}},description:""},sessionTitle:{required:!1,tsType:{name:"string"},description:""},onExport:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},hasSession:{required:!0,tsType:{name:"boolean"},description:""},isCollapsed:{required:!1,tsType:{name:"boolean"},description:""},onToggleCollapsed:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},version:{required:!1,tsType:{name:"string"},description:""},branch:{required:!1,tsType:{name:"string"},description:""},onUndo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onRedo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},canUndo:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},canRedo:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},collapseThinking:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToggleCollapseThinking:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},collapseToolResults:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToggleCollapseToolResults:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},showHidden:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToggleShowHidden:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},hasDeleteEdits:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},saveState:{required:!1,tsType:{name:"union",raw:"'idle' | 'saving' | 'saved' | 'error'",elements:[{name:"literal",value:"'idle'"},{name:"literal",value:"'saving'"},{name:"literal",value:"'saved'"},{name:"literal",value:"'error'"}]},description:"",defaultValue:{value:"'idle'",computed:!1}},onRetrySave:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const H={component:y},p={args:{theme:"claude",onThemeChange:()=>{},sessionTitle:"My Session",onExport:()=>{},hasSession:!0,isCollapsed:!1,onToggleCollapsed:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:!0,canRedo:!1,onToggleCollapseThinking:()=>{},onToggleCollapseToolResults:()=>{},onToggleShowHidden:()=>{}},parameters:{theme:"claude"}},h={args:{theme:"copilot",onThemeChange:()=>{},sessionTitle:"My Session",onExport:()=>{},hasSession:!0,isCollapsed:!1,onToggleCollapsed:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:!1,canRedo:!1},parameters:{theme:"copilot"}},f={args:{theme:"claude",onThemeChange:()=>{},hasSession:!1,isCollapsed:!1,onToggleCollapsed:()=>{}},parameters:{theme:"claude"}},g={args:{theme:"claude",onThemeChange:()=>{},sessionTitle:"Saved Session",hasSession:!0,isCollapsed:!1,onToggleCollapsed:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:!0,canRedo:!1,saveState:"saved"},parameters:{theme:"claude"}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    sessionTitle: 'My Session',
    onExport: () => {},
    hasSession: true,
    isCollapsed: false,
    onToggleCollapsed: () => {},
    onUndo: () => {},
    onRedo: () => {},
    canUndo: true,
    canRedo: false,
    onToggleCollapseThinking: () => {},
    onToggleCollapseToolResults: () => {},
    onToggleShowHidden: () => {}
  },
  parameters: {
    theme: 'claude'
  }
}`,...p.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    theme: 'copilot',
    onThemeChange: () => {},
    sessionTitle: 'My Session',
    onExport: () => {},
    hasSession: true,
    isCollapsed: false,
    onToggleCollapsed: () => {},
    onUndo: () => {},
    onRedo: () => {},
    canUndo: false,
    canRedo: false
  },
  parameters: {
    theme: 'copilot'
  }
}`,...h.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    hasSession: false,
    isCollapsed: false,
    onToggleCollapsed: () => {}
  },
  parameters: {
    theme: 'claude'
  }
}`,...f.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    sessionTitle: 'Saved Session',
    hasSession: true,
    isCollapsed: false,
    onToggleCollapsed: () => {},
    onUndo: () => {},
    onRedo: () => {},
    canUndo: true,
    canRedo: false,
    saveState: 'saved'
  },
  parameters: {
    theme: 'claude'
  }
}`,...g.parameters?.docs?.source}}};const M=["ClaudeTheme","CopilotTheme","NoSession","WithSaveState"];export{p as ClaudeTheme,h as CopilotTheme,f as NoSession,g as WithSaveState,M as __namedExportsOrder,H as default};
