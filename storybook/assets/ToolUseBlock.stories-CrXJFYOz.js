import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as g}from"./iframe-CKOTIaVG.js";import{C as r}from"./CodeBlock-b1spH4y7.js";import{t as h,g as _}from"./toolUtils-DbTaP7Ir.js";import"./preload-helper-PPVm8Dsz.js";function p({toolName:o,input:s}){const[d,u]=g.useState(!1),m=h(o,s);return e.jsxs("div",{className:"tool-use",children:[e.jsxs("button",{className:"tool-use__header",onClick:()=>u(!d),children:[e.jsx("span",{className:"tool-use__icon",children:d?"▾":"▸"}),e.jsx("span",{className:"tool-use__name",children:o}),m&&e.jsx("span",{className:"tool-use__summary",children:m})]}),d&&e.jsxs("div",{className:"tool-use__body",children:[o==="Bash"&&!!s.command&&e.jsx(r,{code:String(s.command),language:"bash"}),(o==="Read"||o==="Write"||o==="Edit")&&e.jsxs("div",{className:"tool-use__detail",children:[e.jsx("div",{className:"tool-use__filepath",children:String(s.file_path||"")}),o==="Edit"&&!!s.old_string&&e.jsxs("div",{className:"tool-use__edit",children:[e.jsx("div",{className:"tool-use__edit-label",children:"Replace:"}),e.jsx(r,{code:String(s.old_string),language:"text",isError:!0}),e.jsx("div",{className:"tool-use__edit-label",children:"With:"}),e.jsx(r,{code:String(s.new_string||""),language:"text"})]}),o==="Write"&&!!s.content&&e.jsx(r,{code:String(s.content).slice(0,3e3),language:_(String(s.file_path||""))})]}),o==="Glob"&&e.jsxs("div",{className:"tool-use__detail",children:["Pattern: ",e.jsx("code",{children:String(s.pattern||"")}),s.path?e.jsxs(e.Fragment,{children:[" ","in ",e.jsx("code",{children:String(s.path)})]}):null]}),o==="Grep"&&e.jsxs("div",{className:"tool-use__detail",children:["Pattern: ",e.jsx("code",{children:String(s.pattern||"")}),s.path?e.jsxs(e.Fragment,{children:[" ","in ",e.jsx("code",{children:String(s.path)})]}):null,s.glob?e.jsxs(e.Fragment,{children:[" ","matching ",e.jsx("code",{children:String(s.glob)})]}):null]}),!["Bash","Read","Write","Edit","Glob","Grep"].includes(o)&&e.jsx(r,{code:JSON.stringify(s,null,2),language:"json"})]})]})}p.__docgenInfo={description:"",methods:[],displayName:"ToolUseBlock",props:{toolName:{required:!0,tsType:{name:"string"},description:""},toolId:{required:!0,tsType:{name:"string"},description:""},input:{required:!0,tsType:{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},description:""}}};const B={component:p},n={args:{toolName:"Bash",toolId:"tool_01ABC",input:{command:"go test ./internal/session/ -v -count=1"}}},t={args:{toolName:"Read",toolId:"tool_02DEF",input:{file_path:"/home/user/repos/claude-chronicle/internal/session/parser.go"}}},a={args:{toolName:"Write",toolId:"tool_03GHI",input:{file_path:"/home/user/repos/claude-chronicle/web/src/App.tsx",content:`import { BrowserRouter } from 'react-router-dom';
import { SessionList } from './pages/SessionList';

export function App() {
  return (
    <BrowserRouter>
      <SessionList />
    </BrowserRouter>
  );
}`}}},i={args:{toolName:"Edit",toolId:"tool_04JKL",input:{file_path:"/home/user/repos/claude-chronicle/internal/api/server.go",old_string:'mux.HandleFunc("GET /api/sessions", s.listSessions)',new_string:`mux.HandleFunc("GET /api/sessions", s.listSessions)
mux.HandleFunc("GET /api/sessions/{id}/manifest", s.getManifest)`}}},l={args:{toolName:"Glob",toolId:"tool_05MNO",input:{pattern:"**/*.test.{ts,tsx}"}}},c={args:{toolName:"Grep",toolId:"tool_06PQR",input:{pattern:"func.*handleExport",path:"/home/user/repos/claude-chronicle/internal/",glob:"*.go"}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    toolName: 'Bash',
    toolId: 'tool_01ABC',
    input: {
      command: 'go test ./internal/session/ -v -count=1'
    }
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    toolName: 'Read',
    toolId: 'tool_02DEF',
    input: {
      file_path: '/home/user/repos/claude-chronicle/internal/session/parser.go'
    }
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    toolName: 'Write',
    toolId: 'tool_03GHI',
    input: {
      file_path: '/home/user/repos/claude-chronicle/web/src/App.tsx',
      content: \`import { BrowserRouter } from 'react-router-dom';
import { SessionList } from './pages/SessionList';

export function App() {
  return (
    <BrowserRouter>
      <SessionList />
    </BrowserRouter>
  );
}\`
    }
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    toolName: 'Edit',
    toolId: 'tool_04JKL',
    input: {
      file_path: '/home/user/repos/claude-chronicle/internal/api/server.go',
      old_string: 'mux.HandleFunc("GET /api/sessions", s.listSessions)',
      new_string: \`mux.HandleFunc("GET /api/sessions", s.listSessions)
mux.HandleFunc("GET /api/sessions/{id}/manifest", s.getManifest)\`
    }
  }
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    toolName: 'Glob',
    toolId: 'tool_05MNO',
    input: {
      pattern: '**/*.test.{ts,tsx}'
    }
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    toolName: 'Grep',
    toolId: 'tool_06PQR',
    input: {
      pattern: 'func.*handleExport',
      path: '/home/user/repos/claude-chronicle/internal/',
      glob: '*.go'
    }
  }
}`,...c.parameters?.docs?.source}}};const G=["BashCommand","ReadFile","WriteFile","EditFile","GlobSearch","GrepSearch"];export{n as BashCommand,i as EditFile,l as GlobSearch,c as GrepSearch,t as ReadFile,a as WriteFile,G as __namedExportsOrder,B as default};
