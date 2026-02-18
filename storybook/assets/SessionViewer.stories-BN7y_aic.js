import{j as t}from"./jsx-runtime-u17CrQMm.js";import{r}from"./iframe-CJQCZEUI.js";import{B as re}from"./diffUtils-DWat3MdG.js";import{C as le}from"./ClaudeMessageBlock-ClTsykaf.js";import{C as ce}from"./ClaudeAnnotationBlock-DPcC7IKN.js";import{C as de}from"./ClaudeCollapsedGroup-CeEwF8jG.js";import{b as _,d as F,e as h,g as p,h as d,i as j,j as O,c as ue,k as V,l as $}from"./factories-CpYswzxf.js";import"./preload-helper-PPVm8Dsz.js";import"./CodeBlock-_T1rTjb5.js";import"./MarkdownContent-CWM7uuTy.js";import"./toolUtils-DbTaP7Ir.js";function K({messageId:n,onHide:a,onAnnotate:i}){const[c,o]=r.useState(!1),[f,u]=r.useState(!1),[g,y]=r.useState(""),x=r.useRef(null);r.useEffect(()=>{if(!c)return;const e=l=>{x.current&&!x.current.contains(l.target)&&o(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[c]);const k=()=>{g.trim()&&(i(n,g.trim()),y(""),u(!1))};return t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:"message-actions",children:[t.jsx("button",{className:"message-actions__btn message-actions__btn--annotate",onClick:()=>{u(!f),o(!1)},title:"Add annotation","aria-label":"Add annotation",children:t.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[t.jsx("path",{d:"M13.5 8.5v5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h5"}),t.jsx("path",{d:"M11.5 1.5l3 3-7 7H4.5v-3l7-7z"})]})}),t.jsxs("div",{className:"message-actions__menu-anchor",ref:x,children:[t.jsx("button",{className:"message-actions__btn",onClick:()=>o(!c),title:"More actions","aria-label":"More actions","aria-expanded":c,children:t.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"currentColor",children:[t.jsx("circle",{cx:"8",cy:"3",r:"1.5"}),t.jsx("circle",{cx:"8",cy:"8",r:"1.5"}),t.jsx("circle",{cx:"8",cy:"13",r:"1.5"})]})}),c&&t.jsxs("div",{className:"message-actions__menu",role:"menu",children:[t.jsx("button",{className:"message-actions__menu-item",role:"menuitem",onClick:()=>{a(n),o(!1)},children:"Hide"}),t.jsx("button",{className:"message-actions__menu-item",role:"menuitem",onClick:()=>{u(!0),o(!1)},children:"Annotate"})]})]})]}),f&&t.jsxs("div",{className:"message-actions__annotate-form",children:[t.jsx("textarea",{className:"message-actions__textarea",value:g,onChange:e=>y(e.target.value),placeholder:"Add commentary (Markdown supported)...",rows:3,autoFocus:!0}),t.jsxs("div",{className:"message-actions__annotate-buttons",children:[t.jsx("button",{className:"message-actions__form-btn",onClick:()=>u(!1),children:"Cancel"}),t.jsx("button",{className:"message-actions__form-btn message-actions__form-btn--primary",onClick:k,children:"Add"})]})]})]})}K.__docgenInfo={description:"",methods:[],displayName:"MessageActions",props:{messageId:{required:!0,tsType:{name:"string"},description:""},onHide:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onAnnotate:{required:!0,tsType:{name:"signature",type:"function",raw:"(afterId: string, content: string) => void",signature:{arguments:[{type:{name:"string"},name:"afterId"},{type:{name:"string"},name:"content"}],return:{name:"void"}}},description:""}}};const G=r.createContext(null),pe=G.Provider;function me(){const n=r.useContext(G);if(!n)throw new Error("useThemeComponents must be used within a ThemeComponentProvider");return n}function fe(n){return n.role!=="user"||!n.toolResults?.length?!1:n.toolResults.some(a=>{const i=a.result;if(!i||i.type!=="text")return!1;const c=!!(i.filePath||i.file||i.originalFile),o=typeof i.content=="string"||!!i.truncated;return c&&o})}function he(n,a,i){if(!n)return[];if((!a||!a.edits||a.edits.length===0)&&!i?.collapseAllToolResults&&!i?.collapseReadResults)return n;const c=new Set,o=new Map,f=new Set,u=new Map,g=new Map,y=new Map,x=new Map;for(const e of a?.edits??[])switch(e.type){case"delete":c.add(e.blockId);break;case"collapse":if(e.blockIds.length>0){const l=e.blockIds[0];f.add(l),u.set(l,e.blockIds.length),g.set(l,new Set(e.blockIds));for(const b of e.blockIds)o.set(b,e.summary)}break;case"annotate":y.has(e.afterBlockId)||y.set(e.afterBlockId,[]),y.get(e.afterBlockId).push({id:e.id,content:e.content});break;case"editText":x.set(e.blockId,e.newContent);break}if(i?.collapseAllToolResults||i?.collapseReadResults){const e=[];for(const l of n)l.role==="user"&&l.toolResults&&l.toolResults.length>0&&!c.has(l.id)&&!o.has(l.id)&&(i?.collapseAllToolResults||fe(l))&&e.push(l.id);if(e.length>0){const l=e[0];f.add(l),u.set(l,e.length),g.set(l,new Set(e));for(const b of e)o.set(b,i?.collapseAllToolResults?`${e.length} tool results`:`${e.length} file reads`)}}const k=[];for(const e of n){if(c.has(e.id)){i?.showDeleted&&k.push({...e,isDeleted:!0});continue}if(o.has(e.id)){if(f.has(e.id)){const v=g.get(e.id),D=n.filter(R=>v.has(R.id));k.push({...e,isCollapsed:!0,collapseSummary:o.get(e.id),collapsedCount:u.get(e.id),collapsedMessages:D})}continue}let l={...e};x.has(e.id)&&(l={...l,textContent:x.get(e.id)}),k.push(l);const b=y.get(e.id);if(b)for(const v of b)k.push({id:v.id,role:"user",timestamp:e.timestamp,textContent:v.content,isAnnotation:!0})}return k}function ge({onUndo:n,onRedo:a,enabled:i}){r.useEffect(()=>{const c=o=>{const u=o.target.tagName;u==="INPUT"||u==="TEXTAREA"||!(o.ctrlKey||o.metaKey)||(o.key==="z"&&!o.shiftKey?(o.preventDefault(),n()):(o.key==="y"||o.key==="z"&&o.shiftKey)&&(o.preventDefault(),a()))};return document.addEventListener("keydown",c),()=>document.removeEventListener("keydown",c)},[n,a,i])}const xe="/api";async function ke(n){const a=await fetch(`${xe}/sessions/${n}/reveal`,{method:"POST"});if(!a.ok)throw new Error(`Failed to reveal session: ${a.statusText}`)}function z({session:n,manifest:a,onAddEdit:i,onRemoveEdit:c,onUndo:o=()=>{},onRedo:f=()=>{},onUpdateTitle:u,showDeleted:g=!1,collapseThinking:y=!1,collapseToolResults:x=!1,collapseFileReads:k=!1,onToast:e}){const{MessageBlock:l,AnnotationBlock:b,CollapsedGroup:v}=me(),[D,R]=r.useState(!1),[U,q]=r.useState(!1),[P,J]=r.useState(""),M=r.useRef(null),Q=r.useMemo(()=>!!a&&a.edits.some(s=>s.type==="delete"),[a]),L=g&&Q;ge({onUndo:o,onRedo:f,enabled:!0});const X=r.useCallback(()=>{navigator.clipboard.writeText(n.info.filePath).then(()=>{R(!0),setTimeout(()=>R(!1),2e3)})},[n.info.filePath]),Y=r.useCallback(()=>{ke(n.info.id).catch(()=>{})},[n.info.id]),Z=r.useCallback(()=>{u&&(J(n.info.title||n.info.projectName||""),q(!0))},[u,n.info.title,n.info.projectName]),W=r.useCallback(()=>{if(!u)return;const s=P.trim();u(s),q(!1)},[u,P]),ee=r.useCallback(s=>{s.key==="Enter"?W():s.key==="Escape"&&q(!1)},[W]);r.useEffect(()=>{U&&M.current&&(M.current.focus(),M.current.select())},[U]);const H=r.useMemo(()=>he(n.messages,a,{showDeleted:L,collapseAllToolResults:x,collapseReadResults:k}),[n.messages,a,L,x,k]),te=r.useCallback(s=>{i&&(i({type:"delete",blockId:s}),e&&e("Message hidden",()=>o()))},[i,e,o]),ne=r.useCallback((s,m)=>{i&&(i({type:"annotate",afterBlockId:s,content:m,id:`annotation-${Date.now()}`}),e&&e("Annotation added"))},[i,e]),se=r.useCallback(s=>{if(!a||!c)return;const m=a.edits.findIndex(C=>C.type==="delete"&&C.blockId===s);m>=0&&(c(m),e&&e("Message restored"))},[a,c,e]),ae=r.useCallback(s=>{if(!a||!c)return;const m=a.edits.findIndex(C=>C.type==="annotate"&&C.id===s);m>=0&&(c(m),e&&e("Annotation removed",()=>f()))},[a,c,e,f]),oe=n.info.title||n.info.projectName;return t.jsxs("div",{className:"session-viewer",children:[t.jsxs("div",{className:"session-viewer__info",children:[t.jsxs("div",{className:"session-viewer__info-main",children:[U?t.jsx("input",{ref:M,className:"session-viewer__title-input",value:P,onChange:s=>J(s.target.value),onBlur:W,onKeyDown:ee}):t.jsxs("span",{className:`session-viewer__title${u?" session-viewer__title--editable":""}`,onClick:Z,title:u?"Click to rename":void 0,children:[oe,u&&t.jsx("span",{className:"session-viewer__title-pencil",children:" ✎"})]}),t.jsxs("span",{className:"session-viewer__count",children:[H.length," messages",a&&a.edits.length>0&&t.jsxs(t.Fragment,{children:[" (",a.edits.length," edits applied)"]})]})]}),n.info.title&&n.info.projectName&&t.jsx("div",{className:"session-viewer__project-secondary",children:n.info.projectName}),n.info.filePath&&t.jsxs("div",{className:"session-viewer__filepath",children:[t.jsx("span",{className:"session-viewer__filepath-text",title:n.info.filePath,children:n.info.filePath}),t.jsx("button",{className:"session-viewer__copy-btn",onClick:X,title:"Copy file path","aria-label":"Copy file path",children:D?"✓":"⧉"}),t.jsx("button",{className:"session-viewer__copy-btn",onClick:Y,title:"Open in File Explorer","aria-label":"Open in File Explorer",children:"\\u238B"})]})]}),t.jsx(re,{value:{hideThinking:y},children:t.jsx("div",{className:"session-viewer__messages",children:H.map((s,m)=>s.isCollapsed?t.jsx(v,{summary:s.collapseSummary||"",count:s.collapsedCount||0,children:s.collapsedMessages?.map((C,ie)=>t.jsx(l,{message:C},C.id||ie))},s.id||m):s.isAnnotation?t.jsx(b,{content:s.textContent||"",onDelete:c?()=>ae(s.id):void 0},s.id||m):s.isDeleted?t.jsxs("div",{className:"session-viewer__deleted-ghost",children:[t.jsx(l,{message:s}),c&&t.jsx("button",{className:"session-viewer__restore-btn",onClick:()=>se(s.id),children:"Restore"})]},s.id||m):t.jsxs("div",{className:"message-actions-wrapper",children:[t.jsx(l,{message:s}),i&&t.jsx(K,{messageId:s.id,onHide:te,onAnnotate:ne})]},s.id||m))})})]})}z.__docgenInfo={description:"",methods:[],displayName:"SessionViewer",props:{session:{required:!0,tsType:{name:"ParsedSession"},description:""},manifest:{required:!0,tsType:{name:"union",raw:"EditManifest | null",elements:[{name:"EditManifest"},{name:"null"}]},description:""},onAddEdit:{required:!1,tsType:{name:"signature",type:"function",raw:"(edit: Edit) => void",signature:{arguments:[{type:{name:"union",raw:`| DeleteEdit
| CollapseEdit
| AnnotateEdit
| EditTextEdit
| ReorderEdit`,elements:[{name:"DeleteEdit"},{name:"CollapseEdit"},{name:"AnnotateEdit"},{name:"EditTextEdit"},{name:"ReorderEdit"}]},name:"edit"}],return:{name:"void"}}},description:""},onRemoveEdit:{required:!1,tsType:{name:"signature",type:"function",raw:"(index: number) => void",signature:{arguments:[{type:{name:"number"},name:"index"}],return:{name:"void"}}},description:""},onUndo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"",defaultValue:{value:"() => {}",computed:!1}},onRedo:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"",defaultValue:{value:"() => {}",computed:!1}},onUpdateTitle:{required:!1,tsType:{name:"signature",type:"function",raw:"(title: string) => void",signature:{arguments:[{type:{name:"string"},name:"title"}],return:{name:"void"}}},description:""},showDeleted:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},collapseThinking:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},collapseToolResults:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},collapseFileReads:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onToast:{required:!1,tsType:{name:"signature",type:"function",raw:"(message: string, onUndo?: () => void) => void",signature:{arguments:[{type:{name:"string"},name:"message"},{type:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},name:"onUndo"}],return:{name:"void"}}},description:""}}};function ye({children:n}){return r.createElement(r.Fragment,null,n)}const be={Wrapper:ye,MessageBlock:le,AnnotationBlock:ce,CollapsedGroup:de},w=n=>(...a)=>{console.log(`[${n}]`,...a)},Be={component:z,parameters:{theme:"claude"},decorators:[n=>t.jsx(pe,{value:be,children:t.jsx(n,{})})]},T={onAddEdit:w("onAddEdit"),onRemoveEdit:w("onRemoveEdit"),onUndo:w("onUndo"),onRedo:w("onRedo"),onUpdateTitle:w("onUpdateTitle"),onToast:w("onToast"),canUndo:!1,canRedo:!1},I={args:{...T,session:_(),manifest:null}},E={args:{...T,session:_({messages:[h({id:"u1",textContent:"Can you help me?"}),p({id:"a1",blocks:[d({text:"Sure, let me look."})]}),p({id:"a2",blocks:[d({text:"Here is my analysis."})]})]}),manifest:F({edits:[V("a1")]}),showDeleted:!0,canUndo:!0}},A={args:{...T,session:_({messages:[h({id:"u1",textContent:"Hello!"}),p({id:"a1",blocks:[d({text:"Hi there!"})]})]}),manifest:F({edits:[$("u1","This is a great question","ann-1")]})}},B={args:{...T,session:_({messages:[h({id:"u1",textContent:"Explain quantum computing."}),p({id:"a1",blocks:[d({type:"thinking",thinking:"The user wants a clear explanation. I should break this down into simple concepts: qubits, superposition, entanglement, and practical applications."}),d({type:"text",text:"Quantum computing uses qubits that can exist in superposition, allowing parallel processing of multiple states simultaneously."})]}),h({id:"u2",textContent:"What about entanglement?"}),p({id:"a2",blocks:[d({type:"thinking",thinking:"Now covering entanglement. I need to explain how measuring one qubit affects its entangled partner."}),d({type:"text",text:"Entanglement is a correlation between qubits where the state of one instantly determines the state of another, regardless of distance."})]})]}),manifest:null}},S={args:{...T,session:_({messages:[h({id:"u1",textContent:"Read and fix the config file."}),p({id:"a1",blocks:[d({type:"text",text:"Let me read the file first."}),d({type:"tool_use",name:"Read",id:"tool-1",input:{file_path:"config.json"}})]}),h({id:"tr1",textContent:void 0,toolResults:[j({toolUseId:"tool-1",content:'{ "port": 3000, "debug": true }'})]}),p({id:"a2",blocks:[d({type:"text",text:"I see the issue. Let me fix it."}),d({type:"tool_use",name:"Edit",id:"tool-2",input:{file_path:"config.json",old_string:'"debug": true',new_string:'"debug": false'}})]}),h({id:"tr2",textContent:void 0,toolResults:[j({toolUseId:"tool-2",content:"",result:O({type:"update",filePath:"config.json"})})]}),p({id:"a3",blocks:[d({type:"text",text:"Done! Debug mode is now disabled."})]})]}),manifest:null}},N={args:{...T,session:_({info:ue({title:"Refactoring auth module"}),messages:[h({id:"u1",textContent:"Refactor the auth module to use JWT."}),p({id:"a1",blocks:[d({type:"thinking",thinking:"I need to identify the current auth implementation, design the JWT flow, and update the relevant files."}),d({type:"text",text:"I'll start by reading the current auth implementation."}),d({type:"tool_use",name:"Read",id:"tool-1",input:{file_path:"src/auth.ts"}})]}),h({id:"tr1",textContent:void 0,toolResults:[j({toolUseId:"tool-1",content:"export function authenticate(user, pass) { ... }"})]}),p({id:"a2",blocks:[d({type:"thinking",thinking:"The current implementation uses session-based auth. I'll convert to JWT with proper token signing."}),d({type:"text",text:"I'll now update the auth module to use JWT tokens."}),d({type:"tool_use",name:"Edit",id:"tool-2",input:{file_path:"src/auth.ts",old_string:"session-based",new_string:"jwt-based"}})]}),h({id:"tr2",textContent:void 0,toolResults:[j({toolUseId:"tool-2",content:"",result:O({type:"update",filePath:"src/auth.ts"})})]}),p({id:"a3",blocks:[d({type:"text",text:"The auth module has been updated to use JWT. Let me run the tests."})]}),p({id:"a4",blocks:[d({type:"tool_use",name:"Bash",id:"tool-3",input:{command:"npm test"}})]}),h({id:"tr3",textContent:void 0,toolResults:[j({toolUseId:"tool-3",result:{stdout:"All 42 tests passed.",stderr:""}})]}),p({id:"a5",blocks:[d({type:"text",text:"All tests pass. The refactoring is complete."})]})]}),manifest:F({edits:[V("a4"),$("a3","This is the key change that converts session auth to JWT.","ann-1")]}),canUndo:!0,canRedo:!1}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    session: createParsedSession(),
    manifest: null
  }
}`,...I.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
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
}`,...A.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}};const Se=["Default","WithDeletedItems","WithAnnotations","WithThinkingBlocks","ToolResultSession","FullEditingSession"];export{I as Default,N as FullEditingSession,S as ToolResultSession,A as WithAnnotations,E as WithDeletedItems,B as WithThinkingBlocks,Se as __namedExportsOrder,Be as default};
