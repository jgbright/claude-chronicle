import{j as n}from"./jsx-runtime-u17CrQMm.js";import{C as a}from"./ClaudeMessageBlock-C2zzra7m.js";import{B as T}from"./diffUtils-Wgt0L3fW.js";import{g as t,h as e,e as r,i as o,j as f}from"./factories-CpYswzxf.js";import"./iframe-CD0i-AUq.js";import"./preload-helper-PPVm8Dsz.js";import"./CodeBlock-Dwn0PIi1.js";import"./MarkdownContent-DohGiVjL.js";import"./toolUtils-DbTaP7Ir.js";const D={component:a,parameters:{theme:"claude"}},c={args:{message:r({textContent:"Can you help me refactor this function?"})}},l={args:{message:t({blocks:[e({type:"text",text:"Sure! I can help you refactor that function. Let me take a look at the code and suggest some improvements."})]})}},i={args:{message:t({blocks:[e({type:"thinking",thinking:"The user wants to refactor a function. I should consider readability, performance, and maintainability. Let me analyze the current structure and suggest improvements that follow best practices."}),e({type:"text",text:"I have analyzed the function. Here are my suggested improvements."})]})}},d={args:{message:t({blocks:[e({type:"tool_use",name:"Read",id:"tool-1",input:{file_path:"/src/utils/helpers.ts"}})]})}},p={args:{message:t({blocks:[e({type:"tool_use",name:"Bash",id:"tool-bash",input:{command:"npm test"}})]})}},u={args:{message:t({blocks:[e({type:"tool_use",name:"Edit",id:"tool-edit",input:{file_path:"web/src/themes/claude/claude.css",old_string:"padding: 12px 16px;",new_string:"padding: 4px 12px;"}})]})}},m={args:{message:t({blocks:[e({type:"tool_use",name:"Grep",id:"tool-grep",input:{pattern:"ClaudeMessageBlock",path:"web/src/",glob:"*.tsx"}})]})}},g={args:{message:t({blocks:[e({type:"text",text:"Let me read those files and make the changes."}),e({type:"tool_use",name:"Read",id:"tool-r1",input:{file_path:"web/src/session/types.ts"}}),e({type:"tool_use",name:"Edit",id:"tool-e1",input:{file_path:"web/src/themes/claude/claude.css",old_string:"old",new_string:"new"}}),e({type:"tool_use",name:"Bash",id:"tool-b1",input:{command:"cd web && npm test"}})]})}},h={args:{message:r({textContent:void 0,toolResults:[o({toolUseId:"tool-1",content:`export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}`})]})}},x={args:{message:r({textContent:void 0,toolResults:[o({toolUseId:"tool-edit-1",content:"",result:f({type:"update",filePath:"web/src/themes/claude/claude.css",structuredPatch:[{oldFileName:"web/src/themes/claude/claude.css",newFileName:"web/src/themes/claude/claude.css",hunks:[{oldStart:65,oldLines:5,newStart:65,newLines:4,changes:[{type:"normal",content:".claude-message {"},{type:"del",content:"  padding: 12px 16px;",oldLine:67},{type:"add",content:"  padding: 4px 12px;",newLine:67},{type:"del",content:"  gap: var(--space-3);",oldLine:68},{type:"add",content:"  gap: var(--space-2);",newLine:68},{type:"normal",content:"  line-height: 1.4;"}]}]}]})})]})}},y={args:{message:r({textContent:void 0,toolResults:[o({toolUseId:"tool-create-1",content:"",result:f({type:"create",filePath:"web/src/themes/claude/ClaudeDiffBlock.tsx"})})]})}},s={render:()=>{const w=t({blocks:[e({type:"text",text:"Let me read the file and make the changes."}),e({type:"tool_use",name:"Read",id:"tool-r1",input:{file_path:"web/src/themes/claude/claude.css"}}),e({type:"tool_use",name:"Edit",id:"tool-e1",input:{file_path:"web/src/themes/claude/claude.css",old_string:"padding: 4px;",new_string:"padding: 2px;"}})]}),b=r({textContent:void 0,toolResults:[o({toolUseId:"tool-r1",content:`.claude-message {
  font-family: var(--font-mono);
  padding: 4px 12px;
}`}),o({toolUseId:"tool-e1",content:"",result:f({type:"update",filePath:"web/src/themes/claude/claude.css",structuredPatch:[{oldFileName:"claude.css",newFileName:"claude.css",hunks:[{oldStart:80,oldLines:3,newStart:80,newLines:3,changes:[{type:"normal",content:".claude-message {"},{type:"del",content:"  padding: 4px;",oldLine:81},{type:"add",content:"  padding: 2px;",newLine:81},{type:"normal",content:"}"}]}]}]})})]}),C=t({blocks:[e({type:"text",text:"I've updated the padding. The change reduces vertical spacing to match the real CLI density."})]});return n.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"4px"},children:[n.jsx(a,{message:w}),n.jsx(a,{message:b}),n.jsx(a,{message:C})]})}},k={render:()=>n.jsx(T,{value:{hideThinking:!0},children:n.jsx(a,{message:t({blocks:[e({type:"thinking",thinking:"This reasoning should be hidden when hideThinking is true."}),e({type:"text",text:"The text remains visible even when thinking is hidden."})]})})})};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: 'Can you help me refactor this function?'
    })
  }
}`,...c.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'text',
        text: 'Sure! I can help you refactor that function. Let me take a look at the code and suggest some improvements.'
      })]
    })
  }
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'thinking',
        thinking: 'The user wants to refactor a function. I should consider readability, performance, and maintainability. Let me analyze the current structure and suggest improvements that follow best practices.'
      }), createContentBlock({
        type: 'text',
        text: 'I have analyzed the function. Here are my suggested improvements.'
      })]
    })
  }
}`,...i.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'tool_use',
        name: 'Read',
        id: 'tool-1',
        input: {
          file_path: '/src/utils/helpers.ts'
        }
      })]
    })
  }
}`,...d.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'tool_use',
        name: 'Edit',
        id: 'tool-edit',
        input: {
          file_path: 'web/src/themes/claude/claude.css',
          old_string: 'padding: 12px 16px;',
          new_string: 'padding: 4px 12px;'
        }
      })]
    })
  }
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    message: createMessage({
      blocks: [createContentBlock({
        type: 'tool_use',
        name: 'Grep',
        id: 'tool-grep',
        input: {
          pattern: 'ClaudeMessageBlock',
          path: 'web/src/',
          glob: '*.tsx'
        }
      })]
    })
  }
}`,...m.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
          file_path: 'web/src/themes/claude/claude.css',
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
}`,...g.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [createToolResult({
        toolUseId: 'tool-1',
        content: 'export function formatDate(date: Date): string {\\n  return date.toISOString().split("T")[0];\\n}'
      })]
    })
  }
}`,...h.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [createToolResult({
        toolUseId: 'tool-edit-1',
        content: '',
        result: createToolUseResultData({
          type: 'update',
          filePath: 'web/src/themes/claude/claude.css',
          structuredPatch: [{
            oldFileName: 'web/src/themes/claude/claude.css',
            newFileName: 'web/src/themes/claude/claude.css',
            hunks: [{
              oldStart: 65,
              oldLines: 5,
              newStart: 65,
              newLines: 4,
              changes: [{
                type: 'normal',
                content: '.claude-message {'
              }, {
                type: 'del',
                content: '  padding: 12px 16px;',
                oldLine: 67
              }, {
                type: 'add',
                content: '  padding: 4px 12px;',
                newLine: 67
              }, {
                type: 'del',
                content: '  gap: var(--space-3);',
                oldLine: 68
              }, {
                type: 'add',
                content: '  gap: var(--space-2);',
                newLine: 68
              }, {
                type: 'normal',
                content: '  line-height: 1.4;'
              }]
            }]
          }]
        })
      })]
    })
  }
}`,...x.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [createToolResult({
        toolUseId: 'tool-create-1',
        content: '',
        result: createToolUseResultData({
          type: 'create',
          filePath: 'web/src/themes/claude/ClaudeDiffBlock.tsx'
        })
      })]
    })
  }
}`,...y.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const assistantWithTools = createMessage({
      blocks: [createContentBlock({
        type: 'text',
        text: 'Let me read the file and make the changes.'
      }), createContentBlock({
        type: 'tool_use',
        name: 'Read',
        id: 'tool-r1',
        input: {
          file_path: 'web/src/themes/claude/claude.css'
        }
      }), createContentBlock({
        type: 'tool_use',
        name: 'Edit',
        id: 'tool-e1',
        input: {
          file_path: 'web/src/themes/claude/claude.css',
          old_string: 'padding: 4px;',
          new_string: 'padding: 2px;'
        }
      })]
    });
    const toolResults = createUserMessage({
      textContent: undefined,
      toolResults: [createToolResult({
        toolUseId: 'tool-r1',
        content: '.claude-message {\\n  font-family: var(--font-mono);\\n  padding: 4px 12px;\\n}'
      }), createToolResult({
        toolUseId: 'tool-e1',
        content: '',
        result: createToolUseResultData({
          type: 'update',
          filePath: 'web/src/themes/claude/claude.css',
          structuredPatch: [{
            oldFileName: 'claude.css',
            newFileName: 'claude.css',
            hunks: [{
              oldStart: 80,
              oldLines: 3,
              newStart: 80,
              newLines: 3,
              changes: [{
                type: 'normal',
                content: '.claude-message {'
              }, {
                type: 'del',
                content: '  padding: 4px;',
                oldLine: 81
              }, {
                type: 'add',
                content: '  padding: 2px;',
                newLine: 81
              }, {
                type: 'normal',
                content: '}'
              }]
            }]
          }]
        })
      })]
    });
    const assistantContinues = createMessage({
      blocks: [createContentBlock({
        type: 'text',
        text: 'I\\'ve updated the padding. The change reduces vertical spacing to match the real CLI density.'
      })]
    });
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
        <ClaudeMessageBlock message={assistantWithTools} />
        <ClaudeMessageBlock message={toolResults} />
        <ClaudeMessageBlock message={assistantContinues} />
      </div>;
  }
}`,...s.parameters?.docs?.source},description:{story:"Demonstrates the main visual improvement: tool results flow inline without user turn breaks",...s.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  render: () => <BulkCollapseProvider value={{
    hideThinking: true
  }}>
      <ClaudeMessageBlock message={createMessage({
      blocks: [createContentBlock({
        type: 'thinking',
        thinking: 'This reasoning should be hidden when hideThinking is true.'
      }), createContentBlock({
        type: 'text',
        text: 'The text remains visible even when thinking is hidden.'
      })]
    })} />
    </BulkCollapseProvider>
}`,...k.parameters?.docs?.source}}};const W=["UserMessage","AssistantText","WithThinking","WithToolUse","ToolUseBash","ToolUseEdit","ToolUseSearch","MultipleToolCalls","WithToolResults","WithFileChangeAndDiff","WithNewFile","ConversationFlow","WithThinkingHidden"];export{l as AssistantText,s as ConversationFlow,g as MultipleToolCalls,p as ToolUseBash,u as ToolUseEdit,m as ToolUseSearch,c as UserMessage,x as WithFileChangeAndDiff,y as WithNewFile,i as WithThinking,k as WithThinkingHidden,h as WithToolResults,d as WithToolUse,W as __namedExportsOrder,D as default};
