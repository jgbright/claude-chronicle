import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as _}from"./iframe-CD0i-AUq.js";import"./preload-helper-PPVm8Dsz.js";function E(a,n){return n&&n!=="main"?n:a?/^\d/.test(a)?`v${a}`:a:null}function V({collapseThinking:a,onToggleCollapseThinking:n,collapseToolResults:o,onToggleCollapseToolResults:d,collapseFileReads:c,onToggleCollapseFileReads:u,showHidden:t,onToggleShowHidden:T,hasDeleteEdits:m}){const[s,r]=_.useState(!1),l=_.useRef(null);_.useEffect(()=>{if(!s)return;const p=f=>{l.current&&!l.current.contains(f.target)&&r(!1)};return document.addEventListener("mousedown",p),()=>document.removeEventListener("mousedown",p)},[s]);const i=[a,o,c,t].filter(Boolean).length;return e.jsxs("div",{className:"toolbar__dropdown",ref:l,children:[e.jsxs("button",{className:`toolbar__dropdown-btn${i>0?" toolbar__dropdown-btn--active":""}`,onClick:()=>r(!s),"aria-expanded":s,children:["Collapse",i>0&&` (${i})`," ▾"]}),s&&e.jsxs("div",{className:"toolbar__dropdown-menu",children:[e.jsxs("label",{className:"toolbar__dropdown-item",children:[e.jsx("input",{type:"checkbox",checked:a,onChange:n}),"Hide thinking"]}),e.jsxs("label",{className:"toolbar__dropdown-item",children:[e.jsx("input",{type:"checkbox",checked:o,onChange:d}),"Hide tool results"]}),e.jsxs("label",{className:"toolbar__dropdown-item",children:[e.jsx("input",{type:"checkbox",checked:c,onChange:u}),"Hide file reads"]}),e.jsxs("label",{className:`toolbar__dropdown-item${m?"":" toolbar__dropdown-item--disabled"}`,children:[e.jsx("input",{type:"checkbox",checked:t,onChange:T,disabled:!m}),"Show hidden blocks"]})]})]})}function $({saveState:a,onRetry:n}){return a==="idle"?null:e.jsxs("span",{className:`toolbar__save toolbar__save--${a}`,children:[a==="saving"&&"Saving...",a==="saved"&&"Saved ✓",a==="error"&&e.jsxs(e.Fragment,{children:["Save failed",n&&e.jsxs(e.Fragment,{children:[" — ",e.jsx("button",{className:"toolbar__save-retry",onClick:n,children:"Retry"})]})]})]})}function j({theme:a,onThemeChange:n,sessionTitle:o,onExport:d,hasSession:c,isCollapsed:u,onToggleCollapsed:t,version:T,branch:m,onUndo:s,onRedo:r,canUndo:l=!1,canRedo:i=!1,collapseThinking:p=!1,onToggleCollapseThinking:f,collapseToolResults:w=!1,onToggleCollapseToolResults:C,collapseFileReads:N=!1,onToggleCollapseFileReads:x,showHidden:q=!1,onToggleShowHidden:y,hasDeleteEdits:R=!1,saveState:k="idle",onRetrySave:U}){const S=E(T,m);return e.jsxs("div",{className:"toolbar",children:[e.jsxs("div",{className:"toolbar__left",children:[e.jsxs("h1",{className:"toolbar__brand",children:["Chronicle",S&&e.jsx("span",{className:"toolbar__descriptor",children:S})]}),o&&e.jsx("span",{className:"toolbar__title",children:o})]}),e.jsxs("div",{className:"toolbar__right",children:[c&&e.jsxs(e.Fragment,{children:[t&&e.jsx("button",{className:`toolbar__focus-btn${u?" toolbar__focus-btn--active":""}`,onClick:t,children:u?"Unfocus":"Focus"}),f&&C&&x&&y&&e.jsx(V,{collapseThinking:p,onToggleCollapseThinking:f,collapseToolResults:w,onToggleCollapseToolResults:C,collapseFileReads:N,onToggleCollapseFileReads:x,showHidden:q,onToggleShowHidden:y,hasDeleteEdits:R}),e.jsx($,{saveState:k,onRetry:U}),s&&e.jsx("button",{className:"toolbar__action-btn",onClick:s,disabled:!l,title:"Undo (Ctrl+Z)",children:"Undo"}),r&&e.jsx("button",{className:"toolbar__action-btn",onClick:r,disabled:!i,title:"Redo (Ctrl+Y)",children:"Redo"}),d&&e.jsx("button",{className:"toolbar__export-btn",onClick:d,children:"Export"})]}),e.jsxs("div",{className:"toolbar__theme-switch",children:[e.jsx("button",{className:`toolbar__theme-btn ${a==="claude"?"toolbar__theme-btn--active":""}`,onClick:()=>n("claude"),children:"Claude"}),e.jsx("button",{className:`toolbar__theme-btn ${a==="copilot"?"toolbar__theme-btn--active":""}`,onClick:()=>n("copilot"),children:"Copilot"})]})]})]})}j.__docgenInfo={description:"",methods:[],displayName:"Toolbar",props:{theme:{required:!0,tsType:{name:"union",raw:"'claude' | 'copilot'",elements:[{name:"literal",value:"'claude'"},{name:"literal",value:"'copilot'"}]},description:""},onThemeChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(theme: Theme) => void",signature:{arguments:[{type:{name:"union",raw:"'claude' | 'copilot'",elements:[{name:"literal",value:"'claude'"},{name:"literal",value:"'copilot'"}]},name:"theme"}],return:{name:"void"}}},description:""},sessionTitle:{required:!1,tsType:{name:"string"},description:""},onExport:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},hasSession:{required:!0,tsType:{name:"boolean"},description:""},isCollapsed:{required:!1,tsType:{name:"boolean"},description:""},onToggleCollapsed:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},version:{required:!1,tsType:{name:"string"},description:""},branch:{required:!1,tsType:{name:"string"},description:""},onUndo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onRedo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},canUndo:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},canRedo:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},collapseThinking:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToggleCollapseThinking:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},collapseToolResults:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToggleCollapseToolResults:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},collapseFileReads:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToggleCollapseFileReads:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},showHidden:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToggleShowHidden:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},hasDeleteEdits:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},saveState:{required:!1,tsType:{name:"union",raw:"'idle' | 'saving' | 'saved' | 'error'",elements:[{name:"literal",value:"'idle'"},{name:"literal",value:"'saving'"},{name:"literal",value:"'saved'"},{name:"literal",value:"'error'"}]},description:"",defaultValue:{value:"'idle'",computed:!1}},onRetrySave:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const D={component:j},h={args:{theme:"claude",onThemeChange:()=>{},sessionTitle:"My Session",onExport:()=>{},hasSession:!0,isCollapsed:!1,onToggleCollapsed:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:!0,canRedo:!1,onToggleCollapseThinking:()=>{},onToggleCollapseToolResults:()=>{},onToggleShowHidden:()=>{}},parameters:{theme:"claude"}},g={args:{theme:"copilot",onThemeChange:()=>{},sessionTitle:"My Session",onExport:()=>{},hasSession:!0,isCollapsed:!1,onToggleCollapsed:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:!1,canRedo:!1},parameters:{theme:"copilot"}},b={args:{theme:"claude",onThemeChange:()=>{},hasSession:!1,isCollapsed:!1,onToggleCollapsed:()=>{}},parameters:{theme:"claude"}},v={args:{theme:"claude",onThemeChange:()=>{},sessionTitle:"Saved Session",hasSession:!0,isCollapsed:!1,onToggleCollapsed:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:!0,canRedo:!1,saveState:"saved"},parameters:{theme:"claude"}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}};const I=["ClaudeTheme","CopilotTheme","NoSession","WithSaveState"];export{h as ClaudeTheme,g as CopilotTheme,b as NoSession,v as WithSaveState,I as __namedExportsOrder,D as default};
