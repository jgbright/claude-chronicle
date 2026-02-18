import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as T}from"./iframe-CJQCZEUI.js";import{P as z,b as D,C as B,a as U,F as S,S as G,T as A}from"./index.esm-BjGUuoTt.js";import{C as l}from"./CodeBlock-_T1rTjb5.js";import{M as R}from"./MarkdownContent-CWM7uuTy.js";import{t as O,g as J}from"./toolUtils-DbTaP7Ir.js";import{u as H,c as L,B as $}from"./diffUtils-DWat3MdG.js";import{m as V,g as d,h as i,e as p,i as M,j as F}from"./factories-CpYswzxf.js";import"./preload-helper-PPVm8Dsz.js";function q(t){switch(t){case"Edit":return"Update";case"Grep":return"Search";case"Glob":return"Search";case"WebFetch":return"Fetch";case"WebSearch":return"Search";default:return t}}function Y(t){switch(t){case"Bash":return e.jsx(A,{size:14});case"Grep":case"Glob":case"WebSearch":return e.jsx(G,{size:14});default:return e.jsx(S,{size:14})}}function K({content:t}){const[n,s]=T.useState(!1),a=t.slice(0,150).replace(/\n/g," ");return e.jsxs("div",{className:"copilot-thinking",children:[e.jsxs("button",{className:"copilot-thinking__header",onClick:()=>s(!n),"aria-expanded":n,children:[n?e.jsx(B,{size:12}):e.jsx(U,{size:12}),e.jsxs("span",{className:"copilot-thinking__label",children:["Thinking",!n&&e.jsxs("span",{className:"copilot-thinking__dots",children:[e.jsx("span",{className:"copilot-thinking__dot"}),e.jsx("span",{className:"copilot-thinking__dot"}),e.jsx("span",{className:"copilot-thinking__dot"})]})]}),!n&&e.jsxs("span",{className:"copilot-thinking__preview",children:[a,"..."]})]}),n&&e.jsx("div",{className:"copilot-thinking__body",children:e.jsx("pre",{className:"copilot-thinking__content",children:t})})]})}function Q({block:t}){const[n,s]=T.useState(!1),a=t.name||"unknown",o=t.input||{},c=O(a,o),r=q(a);return e.jsxs("div",{className:"copilot-tool",children:[e.jsxs("button",{className:"copilot-tool__header",onClick:()=>s(!n),"aria-expanded":n,children:[e.jsx("span",{className:"copilot-tool__icon",children:Y(a)}),e.jsxs("span",{className:"copilot-tool__name",children:["Used ",r]}),c&&e.jsx("span",{className:"copilot-tool__summary",children:c}),e.jsx("span",{className:"copilot-tool__toggle",children:n?e.jsx(B,{size:12}):e.jsx(U,{size:12})})]}),n&&e.jsxs("div",{className:"copilot-tool__body",children:[a==="Bash"&&!!o.command&&e.jsx(l,{code:String(o.command),language:"bash"}),(a==="Read"||a==="Write"||a==="Edit")&&e.jsxs("div",{className:"copilot-tool__detail",children:[e.jsx("div",{className:"copilot-tool__filepath",children:String(o.file_path||"")}),a==="Edit"&&!!o.old_string&&e.jsxs("div",{className:"copilot-tool__edit",children:[e.jsx("div",{className:"copilot-tool__edit-label",children:"Replace:"}),e.jsx(l,{code:String(o.old_string),language:"text",isError:!0}),e.jsx("div",{className:"copilot-tool__edit-label",children:"With:"}),e.jsx(l,{code:String(o.new_string||""),language:"text"})]}),a==="Write"&&!!o.content&&e.jsx(l,{code:String(o.content).slice(0,3e3),language:J(String(o.file_path||""))})]}),a==="Glob"&&e.jsxs("div",{className:"copilot-tool__detail",children:["Pattern: ",e.jsx("code",{children:String(o.pattern||"")}),o.path?e.jsxs(e.Fragment,{children:[" ","in ",e.jsx("code",{children:String(o.path)})]}):null]}),a==="Grep"&&e.jsxs("div",{className:"copilot-tool__detail",children:["Pattern: ",e.jsx("code",{children:String(o.pattern||"")}),o.path?e.jsxs(e.Fragment,{children:[" ","in ",e.jsx("code",{children:String(o.path)})]}):null,o.glob?e.jsxs(e.Fragment,{children:[" ","matching ",e.jsx("code",{children:String(o.glob)})]}):null]}),!["Bash","Read","Write","Edit","Glob","Grep"].includes(a)&&e.jsx(l,{code:JSON.stringify(o,null,2),language:"json"})]})]})}function X({result:t}){const n=t.result;if(n?.stdout||n?.stderr)return e.jsxs("div",{className:"copilot-tool-result",children:[n.stdout&&e.jsx(l,{code:n.stdout,language:"text"}),n.stderr&&e.jsx(l,{code:n.stderr,language:"text",isError:!0})]});if(n?.type==="text"||n?.type==="create"||n?.type==="update")return e.jsx(te,{result:n});if(n?.filenames)return e.jsxs("div",{children:[e.jsxs("div",{className:"copilot-tool-result__count",children:[n.numFiles," file(s) found"]}),e.jsx(l,{code:n.filenames.join(`
`),language:"text"})]});if(t.content){const s=typeof t.content=="string"?t.content:JSON.stringify(t.content),a=s.length>2e3?s.slice(0,2e3)+`
... (truncated)`:s;return e.jsx(l,{code:a,language:"text"})}return null}function Z({patches:t}){const[n,s]=T.useState(new Set),a=o=>{s(c=>{const r=new Set(c);return r.has(o)?r.delete(o):r.add(o),r})};return e.jsx("div",{className:"copilot-diff",children:t.map((o,c)=>{const{added:r,removed:I}=L([o]),C=n.has(c);return e.jsxs("div",{children:[e.jsxs("button",{className:"copilot-diff__header",onClick:()=>a(c),"aria-expanded":C,children:[e.jsx("span",{className:"copilot-diff__toggle",children:C?e.jsx(B,{size:12}):e.jsx(U,{size:12})}),e.jsx("span",{className:"copilot-diff__path",children:o.newFileName||o.oldFileName}),r>0&&e.jsxs("span",{className:"copilot-diff__added",children:["+",r]}),I>0&&e.jsxs("span",{className:"copilot-diff__removed",children:["-",I]})]}),C&&e.jsx("div",{className:"copilot-diff__hunks",children:Array.isArray(o.hunks)&&o.hunks.map((E,P)=>e.jsx(ee,{hunk:E},P))})]},c)})})}function ee({hunk:t}){const n=[];if(t.changes)for(const s of t.changes)n.push({type:s.type,content:s.content,oldLine:s.oldLine,newLine:s.newLine});else if(t.lines)for(const s of t.lines)s.startsWith("+")&&!s.startsWith("+++")?n.push({type:"add",content:s.slice(1)}):s.startsWith("-")&&!s.startsWith("---")?n.push({type:"del",content:s.slice(1)}):n.push({type:"normal",content:s.startsWith(" ")?s.slice(1):s});return n.length===0?null:e.jsxs("div",{className:"copilot-diff__hunk",children:[e.jsxs("div",{className:"copilot-diff__hunk-header",children:["@@ -",t.oldStart,",",t.oldLines," +",t.newStart,",",t.newLines," @@"]}),n.map((s,a)=>e.jsxs("div",{className:`copilot-diff__line copilot-diff__line--${s.type==="add"?"added":s.type==="del"||s.type==="remove"?"removed":"normal"}`,children:[e.jsx("span",{className:"copilot-diff__line-prefix",children:s.type==="add"?"+":s.type==="del"||s.type==="remove"?"-":" "}),e.jsx("span",{className:"copilot-diff__line-content",children:s.content})]},a))]})}function te({result:t}){const s=(t.filePath||"").split(/[/\\]/).slice(-3).join("/");if(t.structuredPatch&&t.structuredPatch.length>0){const{added:c,removed:r}=L(t.structuredPatch);return e.jsxs("div",{className:"copilot-file-change copilot-file-change--diff",children:[e.jsx(S,{size:14}),e.jsx("span",{className:"copilot-file-change__path",children:s}),c>0&&e.jsxs("span",{className:"copilot-diff__added",children:["+",c]}),r>0&&e.jsxs("span",{className:"copilot-diff__removed",children:["-",r]}),e.jsx(Z,{patches:t.structuredPatch})]})}let a="Read",o="copilot-file-change__badge--read";return t.type==="create"?(a="Created",o="copilot-file-change__badge--create"):t.type==="update"&&(a="Updated",o="copilot-file-change__badge--update"),e.jsxs("div",{className:"copilot-file-change",children:[e.jsx(S,{size:14}),e.jsx("span",{className:`copilot-file-change__badge ${o}`,children:a}),e.jsx("span",{className:"copilot-file-change__path",children:s})]})}function ne({block:t}){const{hideThinking:n}=H();if(n&&t.type==="thinking")return null;switch(t.type){case"text":return e.jsx(R,{content:t.text||""});case"thinking":return e.jsx(K,{content:t.thinking||""});case"tool_use":return e.jsx(Q,{block:t});default:return null}}function W({message:t}){const n=t.role==="user";return e.jsxs("div",{className:`copilot-message copilot-message--${t.role}`,children:[e.jsx("div",{className:"copilot-message__avatar",children:e.jsx("div",{className:`copilot-message__avatar-icon copilot-message__avatar-icon--${t.role}`,children:n?e.jsx(z,{size:16}):e.jsx(D,{size:16})})}),e.jsxs("div",{className:"copilot-message__content",children:[e.jsxs("div",{className:"copilot-message__header",children:[e.jsx("span",{className:"copilot-message__role",children:n?"You":"Copilot"}),t.timestamp&&e.jsx("span",{className:"copilot-message__time",children:V(t.timestamp)})]}),e.jsx("div",{className:"copilot-message__body",children:n?e.jsx(se,{message:t}):t.blocks?.map((s,a)=>e.jsx(ne,{block:s},a))})]})]})}function se({message:t}){return t.textContent?e.jsx(R,{content:t.textContent}):t.toolResults&&t.toolResults.length>0?e.jsx("div",{className:"copilot-tool-results",children:t.toolResults.map((n,s)=>e.jsx(X,{result:n},s))}):e.jsx("span",{className:"copilot-message__empty",children:"(empty message)"})}W.__docgenInfo={description:"",methods:[],displayName:"CopilotMessageBlock",props:{message:{required:!0,tsType:{name:"Message"},description:""}}};const me={component:W,parameters:{theme:"copilot"}},u={args:{message:p({textContent:"Can you help me refactor this function?"})}},m={args:{message:p({textContent:"What does this function do?\n\n```typescript\nfunction parse(raw: string) {\n  return JSON.parse(raw);\n}\n```"})}},h={args:{message:d({blocks:[i({type:"text",text:"Sure! I can help you refactor that function. Let me take a look at the code and suggest some improvements for readability and maintainability."})]})}},g={args:{message:d({blocks:[i({type:"thinking",thinking:"The user wants to refactor a function. I should consider the current structure, identify code smells like long parameter lists or deeply nested conditionals, and suggest a cleaner approach using extract method or early returns."}),i({type:"text",text:"I see a few opportunities to improve this function. We can extract the validation logic into a separate helper and use early returns to reduce nesting."})]})}},x={args:{message:d({blocks:[i({type:"tool_use",id:"tool-1",name:"Read",input:{file_path:"/src/utils/parser.ts"}})]})}},f={args:{message:p({textContent:void 0,toolResults:[M({toolUseId:"tool-1",content:`export function parseConfig(raw: string): Config {
  const data = JSON.parse(raw);
  return validate(data);
}`})]})}},_={args:{message:d({blocks:[i({type:"text",text:`Here's a comprehensive refactoring plan:

1. **Extract validation** into \`validateInput()\`
2. **Simplify conditionals** using early returns
3. **Add type guards** for runtime safety

> Note: These changes are backwards-compatible.

\`\`\`typescript
function validateInput(data: unknown): data is ValidInput {
  return typeof data === "object" && data !== null;
}
\`\`\`

Shall I proceed with the implementation?`})]})}},y={args:{message:d({blocks:[i({type:"tool_use",name:"Bash",id:"tool-bash",input:{command:"npm test"}})]})}},j={args:{message:d({blocks:[i({type:"tool_use",name:"Edit",id:"tool-edit",input:{file_path:"web/src/themes/copilot/copilot.css",old_string:"padding: 12px 16px;",new_string:"padding: 4px 12px;"}})]})}},k={args:{message:d({blocks:[i({type:"tool_use",name:"Grep",id:"tool-grep",input:{pattern:"CopilotMessageBlock",path:"web/src/",glob:"*.tsx"}})]})}},b={args:{message:d({blocks:[i({type:"text",text:"Let me read those files and make the changes."}),i({type:"tool_use",name:"Read",id:"tool-r1",input:{file_path:"web/src/session/types.ts"}}),i({type:"tool_use",name:"Edit",id:"tool-e1",input:{file_path:"web/src/themes/copilot/copilot.css",old_string:"old",new_string:"new"}}),i({type:"tool_use",name:"Bash",id:"tool-b1",input:{command:"cd web && npm test"}})]})}},v={args:{message:p({textContent:void 0,toolResults:[M({toolUseId:"tool-edit-1",content:"",result:F({type:"update",filePath:"web/src/themes/copilot/copilot.css",structuredPatch:[{oldFileName:"web/src/themes/copilot/copilot.css",newFileName:"web/src/themes/copilot/copilot.css",hunks:[{oldStart:69,oldLines:5,newStart:69,newLines:4,changes:[{type:"normal",content:".copilot-message {"},{type:"del",content:"  padding: 12px 16px;",oldLine:71},{type:"add",content:"  padding: 4px 12px;",newLine:71},{type:"del",content:"  gap: var(--space-3);",oldLine:72},{type:"add",content:"  gap: var(--space-2);",newLine:72},{type:"normal",content:"  transition: background var(--transition-base);"}]}]}]})})]})}},w={args:{message:p({textContent:void 0,toolResults:[M({toolUseId:"tool-create-1",content:"",result:F({type:"create",filePath:"web/src/shared/diffUtils.ts"})})]})}},N={render:()=>e.jsx($,{value:{hideThinking:!0},children:e.jsx(W,{message:d({blocks:[i({type:"thinking",thinking:"This reasoning should be hidden when hideThinking is true."}),i({type:"text",text:"The text remains visible even when thinking is hidden."})]})})})};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: 'Can you help me refactor this function?'
    })
  }
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:"{\n  args: {\n    message: createUserMessage({\n      textContent: 'What does this function do?\\n\\n```typescript\\nfunction parse(raw: string) {\\n  return JSON.parse(raw);\\n}\\n```'\n    })\n  }\n}",...m.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'text',
        text: 'Sure! I can help you refactor that function. Let me take a look at the code and suggest some improvements for readability and maintainability.'
      })]
    })
  }
}`,...h.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'thinking',
        thinking: 'The user wants to refactor a function. I should consider the current structure, identify code smells like long parameter lists or deeply nested conditionals, and suggest a cleaner approach using extract method or early returns.'
      }), createContentBlock({
        type: 'text',
        text: 'I see a few opportunities to improve this function. We can extract the validation logic into a separate helper and use early returns to reduce nesting.'
      })]
    })
  }
}`,...g.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'tool_use',
        id: 'tool-1',
        name: 'Read',
        input: {
          file_path: '/src/utils/parser.ts'
        }
      })]
    })
  }
}`,...x.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [createToolResult({
        toolUseId: 'tool-1',
        content: 'export function parseConfig(raw: string): Config {\\n  const data = JSON.parse(raw);\\n  return validate(data);\\n}'
      })]
    })
  }
}`,...f.parameters?.docs?.source}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'text',
        text: 'Here\\'s a comprehensive refactoring plan:\\n\\n1. **Extract validation** into \`validateInput()\`\\n2. **Simplify conditionals** using early returns\\n3. **Add type guards** for runtime safety\\n\\n> Note: These changes are backwards-compatible.\\n\\n\`\`\`typescript\\nfunction validateInput(data: unknown): data is ValidInput {\\n  return typeof data === "object" && data !== null;\\n}\\n\`\`\`\\n\\nShall I proceed with the implementation?'
      })]
    })
  }
}`,..._.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'tool_use',
        name: 'Bash',
        id: 'tool-bash',
        input: {
          command: 'npm test'
        }
      })]
    })
  }
}`,...y.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'tool_use',
        name: 'Edit',
        id: 'tool-edit',
        input: {
          file_path: 'web/src/themes/copilot/copilot.css',
          old_string: 'padding: 12px 16px;',
          new_string: 'padding: 4px 12px;'
        }
      })]
    })
  }
}`,...j.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'tool_use',
        name: 'Grep',
        id: 'tool-grep',
        input: {
          pattern: 'CopilotMessageBlock',
          path: 'web/src/',
          glob: '*.tsx'
        }
      })]
    })
  }
}`,...k.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'text',
        text: 'Let me read those files and make the changes.'
      }), createContentBlock({
        type: 'tool_use',
        name: 'Read',
        id: 'tool-r1',
        input: {
          file_path: 'web/src/session/types.ts'
        }
      }), createContentBlock({
        type: 'tool_use',
        name: 'Edit',
        id: 'tool-e1',
        input: {
          file_path: 'web/src/themes/copilot/copilot.css',
          old_string: 'old',
          new_string: 'new'
        }
      }), createContentBlock({
        type: 'tool_use',
        name: 'Bash',
        id: 'tool-b1',
        input: {
          command: 'cd web && npm test'
        }
      })]
    })
  }
}`,...b.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [createToolResult({
        toolUseId: 'tool-edit-1',
        content: '',
        result: createToolUseResultData({
          type: 'update',
          filePath: 'web/src/themes/copilot/copilot.css',
          structuredPatch: [{
            oldFileName: 'web/src/themes/copilot/copilot.css',
            newFileName: 'web/src/themes/copilot/copilot.css',
            hunks: [{
              oldStart: 69,
              oldLines: 5,
              newStart: 69,
              newLines: 4,
              changes: [{
                type: 'normal',
                content: '.copilot-message {'
              }, {
                type: 'del',
                content: '  padding: 12px 16px;',
                oldLine: 71
              }, {
                type: 'add',
                content: '  padding: 4px 12px;',
                newLine: 71
              }, {
                type: 'del',
                content: '  gap: var(--space-3);',
                oldLine: 72
              }, {
                type: 'add',
                content: '  gap: var(--space-2);',
                newLine: 72
              }, {
                type: 'normal',
                content: '  transition: background var(--transition-base);'
              }]
            }]
          }]
        })
      })]
    })
  }
}`,...v.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [createToolResult({
        toolUseId: 'tool-create-1',
        content: '',
        result: createToolUseResultData({
          type: 'create',
          filePath: 'web/src/shared/diffUtils.ts'
        })
      })]
    })
  }
}`,...w.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => <BulkCollapseProvider value={{
    hideThinking: true
  }}>
      <CopilotMessageBlock message={createMessage({
      blocks: [createContentBlock({
        type: 'thinking',
        thinking: 'This reasoning should be hidden when hideThinking is true.'
      }), createContentBlock({
        type: 'text',
        text: 'The text remains visible even when thinking is hidden.'
      })]
    })} />
    </BulkCollapseProvider>
}`,...N.parameters?.docs?.source}}};const he=["UserMessage","UserMessageWithCode","AssistantText","WithThinking","WithToolUse","WithToolResults","LongConversation","ToolUseBash","ToolUseEdit","ToolUseSearch","MultipleToolCalls","WithFileChangeAndDiff","WithNewFile","WithThinkingHidden"];export{h as AssistantText,_ as LongConversation,b as MultipleToolCalls,y as ToolUseBash,j as ToolUseEdit,k as ToolUseSearch,u as UserMessage,m as UserMessageWithCode,v as WithFileChangeAndDiff,w as WithNewFile,g as WithThinking,N as WithThinkingHidden,f as WithToolResults,x as WithToolUse,he as __namedExportsOrder,me as default};
