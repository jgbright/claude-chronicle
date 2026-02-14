import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as i}from"./iframe-CKOTIaVG.js";import{B as ie}from"./diffUtils-CIqfrldN.js";import{C as re}from"./ClaudeMessageBlock-NjunDhp-.js";import{C as le}from"./ClaudeAnnotationBlock-DY2pWXUj.js";import{C as ce}from"./ClaudeCollapsedGroup-CkW3UVzK.js";import{b as _,d as W,e as g,g as m,h as c,i as M,j as H,c as de,k as O,l as K}from"./factories-CpYswzxf.js";import"./preload-helper-PPVm8Dsz.js";import"./CodeBlock-b1spH4y7.js";import"./MarkdownContent-_L1Yvs0p.js";import"./toolUtils-DbTaP7Ir.js";function V({messageId:n,onHide:a,onAnnotate:p}){const[l,o]=i.useState(!1),[h,d]=i.useState(!1),[x,y]=i.useState(""),k=i.useRef(null);i.useEffect(()=>{if(!l)return;const t=r=>{k.current&&!k.current.contains(r.target)&&o(!1)};return document.addEventListener("mousedown",t),()=>document.removeEventListener("mousedown",t)},[l]);const u=()=>{x.trim()&&(p(n,x.trim()),y(""),d(!1))};return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"message-actions",children:[e.jsx("button",{className:"message-actions__btn message-actions__btn--annotate",onClick:()=>{d(!h),o(!1)},title:"Add annotation","aria-label":"Add annotation",children:e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M13.5 8.5v5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h5"}),e.jsx("path",{d:"M11.5 1.5l3 3-7 7H4.5v-3l7-7z"})]})}),e.jsxs("div",{className:"message-actions__menu-anchor",ref:k,children:[e.jsx("button",{className:"message-actions__btn",onClick:()=>o(!l),title:"More actions","aria-label":"More actions","aria-expanded":l,children:e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"currentColor",children:[e.jsx("circle",{cx:"8",cy:"3",r:"1.5"}),e.jsx("circle",{cx:"8",cy:"8",r:"1.5"}),e.jsx("circle",{cx:"8",cy:"13",r:"1.5"})]})}),l&&e.jsxs("div",{className:"message-actions__menu",role:"menu",children:[e.jsx("button",{className:"message-actions__menu-item",role:"menuitem",onClick:()=>{a(n),o(!1)},children:"Hide"}),e.jsx("button",{className:"message-actions__menu-item",role:"menuitem",onClick:()=>{d(!0),o(!1)},children:"Annotate"})]})]})]}),h&&e.jsxs("div",{className:"message-actions__annotate-form",children:[e.jsx("textarea",{className:"message-actions__textarea",value:x,onChange:t=>y(t.target.value),placeholder:"Add commentary (Markdown supported)...",rows:3,autoFocus:!0}),e.jsxs("div",{className:"message-actions__annotate-buttons",children:[e.jsx("button",{className:"message-actions__form-btn",onClick:()=>d(!1),children:"Cancel"}),e.jsx("button",{className:"message-actions__form-btn message-actions__form-btn--primary",onClick:u,children:"Add"})]})]})]})}V.__docgenInfo={description:"",methods:[],displayName:"MessageActions",props:{messageId:{required:!0,tsType:{name:"string"},description:""},onHide:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onAnnotate:{required:!0,tsType:{name:"signature",type:"function",raw:"(afterId: string, content: string) => void",signature:{arguments:[{type:{name:"string"},name:"afterId"},{type:{name:"string"},name:"content"}],return:{name:"void"}}},description:""}}};const $=i.createContext(null),ue=$.Provider;function pe(){const n=i.useContext($);if(!n)throw new Error("useThemeComponents must be used within a ThemeComponentProvider");return n}function me(n,a,p){if(!n)return[];if((!a||!a.edits||a.edits.length===0)&&!p?.collapseAllToolResults)return n;const l=new Set,o=new Map,h=new Set,d=new Map,x=new Map,y=new Map,k=new Map;for(const t of a?.edits??[])switch(t.type){case"delete":l.add(t.blockId);break;case"collapse":if(t.blockIds.length>0){const r=t.blockIds[0];h.add(r),d.set(r,t.blockIds.length),x.set(r,new Set(t.blockIds));for(const b of t.blockIds)o.set(b,t.summary)}break;case"annotate":y.has(t.afterBlockId)||y.set(t.afterBlockId,[]),y.get(t.afterBlockId).push({id:t.id,content:t.content});break;case"editText":k.set(t.blockId,t.newContent);break}if(p?.collapseAllToolResults){const t=[];for(const r of n)r.role==="user"&&r.toolResults&&r.toolResults.length>0&&!l.has(r.id)&&!o.has(r.id)&&t.push(r.id);if(t.length>0){const r=t[0];h.add(r),d.set(r,t.length),x.set(r,new Set(t));for(const b of t)o.set(b,`${t.length} tool results`)}}const u=[];for(const t of n){if(l.has(t.id)){p?.showDeleted&&u.push({...t,isDeleted:!0});continue}if(o.has(t.id)){if(h.has(t.id)){const v=x.get(t.id),I=n.filter(j=>v.has(j.id));u.push({...t,isCollapsed:!0,collapseSummary:o.get(t.id),collapsedCount:d.get(t.id),collapsedMessages:I})}continue}let r={...t};k.has(t.id)&&(r={...r,textContent:k.get(t.id)}),u.push(r);const b=y.get(t.id);if(b)for(const v of b)u.push({id:v.id,role:"user",timestamp:t.timestamp,textContent:v.content,isAnnotation:!0})}return u}function fe({onUndo:n,onRedo:a,enabled:p}){i.useEffect(()=>{const l=o=>{const d=o.target.tagName;d==="INPUT"||d==="TEXTAREA"||!(o.ctrlKey||o.metaKey)||(o.key==="z"&&!o.shiftKey?(o.preventDefault(),n()):(o.key==="y"||o.key==="z"&&o.shiftKey)&&(o.preventDefault(),a()))};return document.addEventListener("keydown",l),()=>document.removeEventListener("keydown",l)},[n,a,p])}const he="/api";async function ge(n){const a=await fetch(`${he}/sessions/${n}/reveal`,{method:"POST"});if(!a.ok)throw new Error(`Failed to reveal session: ${a.statusText}`)}function G({session:n,manifest:a,onAddEdit:p,onRemoveEdit:l,onUndo:o=()=>{},onRedo:h=()=>{},onUpdateTitle:d,showDeleted:x=!1,collapseThinking:y=!1,collapseToolResults:k=!1,onToast:u}){const{MessageBlock:t,AnnotationBlock:r,CollapsedGroup:b}=pe(),[v,I]=i.useState(!1),[j,U]=i.useState(!1),[q,J]=i.useState(""),R=i.useRef(null),z=i.useMemo(()=>!!a&&a.edits.some(s=>s.type==="delete"),[a]),L=x&&z;fe({onUndo:o,onRedo:h,enabled:!0});const Q=i.useCallback(()=>{navigator.clipboard.writeText(n.info.filePath).then(()=>{I(!0),setTimeout(()=>I(!1),2e3)})},[n.info.filePath]),X=i.useCallback(()=>{ge(n.info.id).catch(()=>{})},[n.info.id]),Y=i.useCallback(()=>{d&&(J(n.info.title||n.info.projectName||""),U(!0))},[d,n.info.title,n.info.projectName]),P=i.useCallback(()=>{if(!d)return;const s=q.trim();d(s),U(!1)},[d,q]),Z=i.useCallback(s=>{s.key==="Enter"?P():s.key==="Escape"&&U(!1)},[P]);i.useEffect(()=>{j&&R.current&&(R.current.focus(),R.current.select())},[j]);const F=i.useMemo(()=>me(n.messages,a,{showDeleted:L,collapseAllToolResults:k}),[n.messages,a,L,k]),ee=i.useCallback(s=>{p&&(p({type:"delete",blockId:s}),u&&u("Message hidden",()=>o()))},[p,u,o]),te=i.useCallback((s,f)=>{p&&(p({type:"annotate",afterBlockId:s,content:f,id:`annotation-${Date.now()}`}),u&&u("Annotation added"))},[p,u]),ne=i.useCallback(s=>{if(!a||!l)return;const f=a.edits.findIndex(C=>C.type==="delete"&&C.blockId===s);f>=0&&(l(f),u&&u("Message restored"))},[a,l,u]),se=i.useCallback(s=>{if(!a||!l)return;const f=a.edits.findIndex(C=>C.type==="annotate"&&C.id===s);f>=0&&(l(f),u&&u("Annotation removed",()=>h()))},[a,l,u,h]),ae=n.info.title||n.info.projectName;return e.jsxs("div",{className:"session-viewer",children:[e.jsxs("div",{className:"session-viewer__info",children:[e.jsxs("div",{className:"session-viewer__info-main",children:[j?e.jsx("input",{ref:R,className:"session-viewer__title-input",value:q,onChange:s=>J(s.target.value),onBlur:P,onKeyDown:Z}):e.jsxs("span",{className:`session-viewer__title${d?" session-viewer__title--editable":""}`,onClick:Y,title:d?"Click to rename":void 0,children:[ae,d&&e.jsx("span",{className:"session-viewer__title-pencil",children:" ✎"})]}),e.jsxs("span",{className:"session-viewer__count",children:[F.length," messages",a&&a.edits.length>0&&e.jsxs(e.Fragment,{children:[" (",a.edits.length," edits applied)"]})]})]}),n.info.title&&n.info.projectName&&e.jsx("div",{className:"session-viewer__project-secondary",children:n.info.projectName}),n.info.filePath&&e.jsxs("div",{className:"session-viewer__filepath",children:[e.jsx("span",{className:"session-viewer__filepath-text",title:n.info.filePath,children:n.info.filePath}),e.jsx("button",{className:"session-viewer__copy-btn",onClick:Q,title:"Copy file path","aria-label":"Copy file path",children:v?"✓":"⧉"}),e.jsx("button",{className:"session-viewer__copy-btn",onClick:X,title:"Open in File Explorer","aria-label":"Open in File Explorer",children:"\\u238B"})]})]}),e.jsx(ie,{value:{hideThinking:y},children:e.jsx("div",{className:"session-viewer__messages",children:F.map((s,f)=>s.isCollapsed?e.jsx(b,{summary:s.collapseSummary||"",count:s.collapsedCount||0,children:s.collapsedMessages?.map((C,oe)=>e.jsx(t,{message:C},C.id||oe))},s.id||f):s.isAnnotation?e.jsx(r,{content:s.textContent||"",onDelete:l?()=>se(s.id):void 0},s.id||f):s.isDeleted?e.jsxs("div",{className:"session-viewer__deleted-ghost",children:[e.jsx(t,{message:s}),l&&e.jsx("button",{className:"session-viewer__restore-btn",onClick:()=>ne(s.id),children:"Restore"})]},s.id||f):e.jsxs("div",{className:"message-actions-wrapper",children:[e.jsx(t,{message:s}),p&&e.jsx(V,{messageId:s.id,onHide:ee,onAnnotate:te})]},s.id||f))})})]})}G.__docgenInfo={description:"",methods:[],displayName:"SessionViewer",props:{session:{required:!0,tsType:{name:"ParsedSession"},description:""},manifest:{required:!0,tsType:{name:"union",raw:"EditManifest | null",elements:[{name:"EditManifest"},{name:"null"}]},description:""},onAddEdit:{required:!1,tsType:{name:"signature",type:"function",raw:"(edit: Edit) => void",signature:{arguments:[{type:{name:"union",raw:`| DeleteEdit
| CollapseEdit
| AnnotateEdit
| EditTextEdit
| ReorderEdit`,elements:[{name:"DeleteEdit"},{name:"CollapseEdit"},{name:"AnnotateEdit"},{name:"EditTextEdit"},{name:"ReorderEdit"}]},name:"edit"}],return:{name:"void"}}},description:""},onRemoveEdit:{required:!1,tsType:{name:"signature",type:"function",raw:"(index: number) => void",signature:{arguments:[{type:{name:"number"},name:"index"}],return:{name:"void"}}},description:""},onUndo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"",defaultValue:{value:"() => {}",computed:!1}},onRedo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"",defaultValue:{value:"() => {}",computed:!1}},onUpdateTitle:{required:!1,tsType:{name:"signature",type:"function",raw:"(title: string) => void",signature:{arguments:[{type:{name:"string"},name:"title"}],return:{name:"void"}}},description:""},showDeleted:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},collapseThinking:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},collapseToolResults:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToast:{required:!1,tsType:{name:"signature",type:"function",raw:"(message: string, onUndo?: () => void) => void",signature:{arguments:[{type:{name:"string"},name:"message"},{type:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},name:"onUndo"}],return:{name:"void"}}},description:""}}};function xe({children:n}){return i.createElement(i.Fragment,null,n)}const ke={Wrapper:xe,MessageBlock:re,AnnotationBlock:le,CollapsedGroup:ce},w=n=>(...a)=>{console.log(`[${n}]`,...a)},Ee={component:G,parameters:{theme:"claude"},decorators:[n=>e.jsx(ue,{value:ke,children:e.jsx(n,{})})]},T={onAddEdit:w("onAddEdit"),onRemoveEdit:w("onRemoveEdit"),onUndo:w("onUndo"),onRedo:w("onRedo"),onUpdateTitle:w("onUpdateTitle"),onToast:w("onToast"),canUndo:!1,canRedo:!1},E={args:{...T,session:_(),manifest:null}},A={args:{...T,session:_({messages:[g({id:"u1",textContent:"Can you help me?"}),m({id:"a1",blocks:[c({text:"Sure, let me look."})]}),m({id:"a2",blocks:[c({text:"Here is my analysis."})]})]}),manifest:W({edits:[O("a1")]}),showDeleted:!0,canUndo:!0}},S={args:{...T,session:_({messages:[g({id:"u1",textContent:"Hello!"}),m({id:"a1",blocks:[c({text:"Hi there!"})]})]}),manifest:W({edits:[K("u1","This is a great question","ann-1")]})}},B={args:{...T,session:_({messages:[g({id:"u1",textContent:"Explain quantum computing."}),m({id:"a1",blocks:[c({type:"thinking",thinking:"The user wants a clear explanation. I should break this down into simple concepts: qubits, superposition, entanglement, and practical applications."}),c({type:"text",text:"Quantum computing uses qubits that can exist in superposition, allowing parallel processing of multiple states simultaneously."})]}),g({id:"u2",textContent:"What about entanglement?"}),m({id:"a2",blocks:[c({type:"thinking",thinking:"Now covering entanglement. I need to explain how measuring one qubit affects its entangled partner."}),c({type:"text",text:"Entanglement is a correlation between qubits where the state of one instantly determines the state of another, regardless of distance."})]})]}),manifest:null}},N={args:{...T,session:_({messages:[g({id:"u1",textContent:"Read and fix the config file."}),m({id:"a1",blocks:[c({type:"text",text:"Let me read the file first."}),c({type:"tool_use",name:"Read",id:"tool-1",input:{file_path:"config.json"}})]}),g({id:"tr1",textContent:void 0,toolResults:[M({toolUseId:"tool-1",content:'{ "port": 3000, "debug": true }'})]}),m({id:"a2",blocks:[c({type:"text",text:"I see the issue. Let me fix it."}),c({type:"tool_use",name:"Edit",id:"tool-2",input:{file_path:"config.json",old_string:'"debug": true',new_string:'"debug": false'}})]}),g({id:"tr2",textContent:void 0,toolResults:[M({toolUseId:"tool-2",content:"",result:H({type:"update",filePath:"config.json"})})]}),m({id:"a3",blocks:[c({type:"text",text:"Done! Debug mode is now disabled."})]})]}),manifest:null}},D={args:{...T,session:_({info:de({title:"Refactoring auth module"}),messages:[g({id:"u1",textContent:"Refactor the auth module to use JWT."}),m({id:"a1",blocks:[c({type:"thinking",thinking:"I need to identify the current auth implementation, design the JWT flow, and update the relevant files."}),c({type:"text",text:"I'll start by reading the current auth implementation."}),c({type:"tool_use",name:"Read",id:"tool-1",input:{file_path:"src/auth.ts"}})]}),g({id:"tr1",textContent:void 0,toolResults:[M({toolUseId:"tool-1",content:"export function authenticate(user, pass) { ... }"})]}),m({id:"a2",blocks:[c({type:"thinking",thinking:"The current implementation uses session-based auth. I'll convert to JWT with proper token signing."}),c({type:"text",text:"I'll now update the auth module to use JWT tokens."}),c({type:"tool_use",name:"Edit",id:"tool-2",input:{file_path:"src/auth.ts",old_string:"session-based",new_string:"jwt-based"}})]}),g({id:"tr2",textContent:void 0,toolResults:[M({toolUseId:"tool-2",content:"",result:H({type:"update",filePath:"src/auth.ts"})})]}),m({id:"a3",blocks:[c({type:"text",text:"The auth module has been updated to use JWT. Let me run the tests."})]}),m({id:"a4",blocks:[c({type:"tool_use",name:"Bash",id:"tool-3",input:{command:"npm test"}})]}),g({id:"tr3",textContent:void 0,toolResults:[M({toolUseId:"tool-3",result:{stdout:"All 42 tests passed.",stderr:""}})]}),m({id:"a5",blocks:[c({type:"text",text:"All tests pass. The refactoring is complete."})]})]}),manifest:W({edits:[O("a4"),K("a3","This is the key change that converts session auth to JWT.","ann-1")]}),canUndo:!0,canRedo:!1}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    session: createParsedSession(),
    manifest: null
  }
}`,...E.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [createUserMessage({
        id: 'u1',
        textContent: 'Can you help me?'
      }), createMessage({
        id: 'a1',
        blocks: [createContentBlock({
          text: 'Sure, let me look.'
        })]
      }), createMessage({
        id: 'a2',
        blocks: [createContentBlock({
          text: 'Here is my analysis.'
        })]
      })]
    }),
    manifest: createManifest({
      edits: [createDeleteEdit('a1')]
    }),
    showDeleted: true,
    canUndo: true
  }
}`,...A.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [createUserMessage({
        id: 'u1',
        textContent: 'Hello!'
      }), createMessage({
        id: 'a1',
        blocks: [createContentBlock({
          text: 'Hi there!'
        })]
      })]
    }),
    manifest: createManifest({
      edits: [createAnnotateEdit('u1', 'This is a great question', 'ann-1')]
    })
  }
}`,...S.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [createUserMessage({
        id: 'u1',
        textContent: 'Explain quantum computing.'
      }), createMessage({
        id: 'a1',
        blocks: [createContentBlock({
          type: 'thinking',
          thinking: 'The user wants a clear explanation. I should break this down into simple concepts: qubits, superposition, entanglement, and practical applications.'
        }), createContentBlock({
          type: 'text',
          text: 'Quantum computing uses qubits that can exist in superposition, allowing parallel processing of multiple states simultaneously.'
        })]
      }), createUserMessage({
        id: 'u2',
        textContent: 'What about entanglement?'
      }), createMessage({
        id: 'a2',
        blocks: [createContentBlock({
          type: 'thinking',
          thinking: 'Now covering entanglement. I need to explain how measuring one qubit affects its entangled partner.'
        }), createContentBlock({
          type: 'text',
          text: 'Entanglement is a correlation between qubits where the state of one instantly determines the state of another, regardless of distance.'
        })]
      })]
    }),
    manifest: null
  }
}`,...B.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [createUserMessage({
        id: 'u1',
        textContent: 'Read and fix the config file.'
      }), createMessage({
        id: 'a1',
        blocks: [createContentBlock({
          type: 'text',
          text: 'Let me read the file first.'
        }), createContentBlock({
          type: 'tool_use',
          name: 'Read',
          id: 'tool-1',
          input: {
            file_path: 'config.json'
          }
        })]
      }), createUserMessage({
        id: 'tr1',
        textContent: undefined,
        toolResults: [createToolResult({
          toolUseId: 'tool-1',
          content: '{ "port": 3000, "debug": true }'
        })]
      }), createMessage({
        id: 'a2',
        blocks: [createContentBlock({
          type: 'text',
          text: 'I see the issue. Let me fix it.'
        }), createContentBlock({
          type: 'tool_use',
          name: 'Edit',
          id: 'tool-2',
          input: {
            file_path: 'config.json',
            old_string: '"debug": true',
            new_string: '"debug": false'
          }
        })]
      }), createUserMessage({
        id: 'tr2',
        textContent: undefined,
        toolResults: [createToolResult({
          toolUseId: 'tool-2',
          content: '',
          result: createToolUseResultData({
            type: 'update',
            filePath: 'config.json'
          })
        })]
      }), createMessage({
        id: 'a3',
        blocks: [createContentBlock({
          type: 'text',
          text: 'Done! Debug mode is now disabled.'
        })]
      })]
    }),
    manifest: null
  }
}`,...N.parameters?.docs?.source}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    session: createParsedSession({
      info: createSessionInfo({
        title: 'Refactoring auth module'
      }),
      messages: [createUserMessage({
        id: 'u1',
        textContent: 'Refactor the auth module to use JWT.'
      }), createMessage({
        id: 'a1',
        blocks: [createContentBlock({
          type: 'thinking',
          thinking: 'I need to identify the current auth implementation, design the JWT flow, and update the relevant files.'
        }), createContentBlock({
          type: 'text',
          text: 'I\\'ll start by reading the current auth implementation.'
        }), createContentBlock({
          type: 'tool_use',
          name: 'Read',
          id: 'tool-1',
          input: {
            file_path: 'src/auth.ts'
          }
        })]
      }), createUserMessage({
        id: 'tr1',
        textContent: undefined,
        toolResults: [createToolResult({
          toolUseId: 'tool-1',
          content: 'export function authenticate(user, pass) { ... }'
        })]
      }), createMessage({
        id: 'a2',
        blocks: [createContentBlock({
          type: 'thinking',
          thinking: 'The current implementation uses session-based auth. I\\'ll convert to JWT with proper token signing.'
        }), createContentBlock({
          type: 'text',
          text: 'I\\'ll now update the auth module to use JWT tokens.'
        }), createContentBlock({
          type: 'tool_use',
          name: 'Edit',
          id: 'tool-2',
          input: {
            file_path: 'src/auth.ts',
            old_string: 'session-based',
            new_string: 'jwt-based'
          }
        })]
      }), createUserMessage({
        id: 'tr2',
        textContent: undefined,
        toolResults: [createToolResult({
          toolUseId: 'tool-2',
          content: '',
          result: createToolUseResultData({
            type: 'update',
            filePath: 'src/auth.ts'
          })
        })]
      }), createMessage({
        id: 'a3',
        blocks: [createContentBlock({
          type: 'text',
          text: 'The auth module has been updated to use JWT. Let me run the tests.'
        })]
      }), createMessage({
        id: 'a4',
        blocks: [createContentBlock({
          type: 'tool_use',
          name: 'Bash',
          id: 'tool-3',
          input: {
            command: 'npm test'
          }
        })]
      }), createUserMessage({
        id: 'tr3',
        textContent: undefined,
        toolResults: [createToolResult({
          toolUseId: 'tool-3',
          result: {
            stdout: 'All 42 tests passed.',
            stderr: ''
          }
        })]
      }), createMessage({
        id: 'a5',
        blocks: [createContentBlock({
          type: 'text',
          text: 'All tests pass. The refactoring is complete.'
        })]
      })]
    }),
    manifest: createManifest({
      edits: [createDeleteEdit('a4'), createAnnotateEdit('a3', 'This is the key change that converts session auth to JWT.', 'ann-1')]
    }),
    canUndo: true,
    canRedo: false
  }
}`,...D.parameters?.docs?.source}}};const Ae=["Default","WithDeletedItems","WithAnnotations","WithThinkingBlocks","ToolResultSession","FullEditingSession"];export{E as Default,D as FullEditingSession,N as ToolResultSession,S as WithAnnotations,A as WithDeletedItems,B as WithThinkingBlocks,Ae as __namedExportsOrder,Ee as default};
