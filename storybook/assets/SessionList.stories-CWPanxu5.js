import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as c}from"./iframe-CD0i-AUq.js";import{f as E,a as T,c as d,r as k}from"./factories-CpYswzxf.js";import"./preload-helper-PPVm8Dsz.js";function q({sessionId:t,isDeleted:x,onDelete:m,onRestore:u,onRename:p,onExport:l,onClose:i}){const o=c.useRef(null);return c.useEffect(()=>{const n=a=>{o.current&&!o.current.contains(a.target)&&i()};return document.addEventListener("mousedown",n),()=>document.removeEventListener("mousedown",n)},[i]),e.jsx("div",{className:"session-menu",ref:o,role:"menu",children:x?u&&e.jsx("button",{className:"session-menu__item",role:"menuitem",onClick:n=>{n.stopPropagation(),u(t),i()},children:"Restore"}):e.jsxs(e.Fragment,{children:[p&&e.jsx("button",{className:"session-menu__item",role:"menuitem",onClick:n=>{n.stopPropagation(),p(),i()},children:"Rename"}),l&&e.jsx("button",{className:"session-menu__item",role:"menuitem",onClick:n=>{n.stopPropagation(),l(t),i()},children:"Export"}),m&&e.jsx("button",{className:"session-menu__item session-menu__item--danger",role:"menuitem",onClick:n=>{n.stopPropagation(),m(t),i()},children:"Hide"})]})})}function w({sessions:t,selectedId:x,onSelect:m,onDelete:u,onRestore:p,onRename:l,onExport:i}){const[o,n]=c.useState(null),[a,y]=c.useState(null),[v,N]=c.useState(""),g=c.useRef(null);c.useEffect(()=>{a&&g.current&&(g.current.focus(),g.current.select())},[a]);const D=s=>{y(s.id),N(s.title||s.projectName||"")},I=()=>{a&&l&&l(a,v.trim()),y(null)},R=()=>{y(null)},b=s=>e.jsxs("div",{className:`session-list__item-wrapper ${s.deleted?"session-list__item--deleted":""}`,children:[e.jsxs("button",{className:`session-list__item ${s.id===x?"session-list__item--selected":""}`,onClick:()=>m(s.id),children:[a===s.id?e.jsx("input",{ref:g,className:"session-list__rename-input",value:v,onChange:r=>N(r.target.value),onKeyDown:r=>{r.key==="Enter"?I():r.key==="Escape"&&R()},onBlur:I,onClick:r=>r.stopPropagation()}):s.title?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"session-list__session-title",children:s.title}),e.jsx("div",{className:"session-list__project-secondary",children:s.projectName})]}):e.jsx("div",{className:"session-list__project",children:s.projectName}),e.jsxs("div",{className:"session-list__meta",children:[e.jsx("span",{children:E(s.modTime)}),e.jsx("span",{children:T(s.sizeBytes)})]}),e.jsxs("div",{className:"session-list__id",children:[s.id.slice(0,8),"..."]})]}),e.jsxs("div",{className:"session-list__menu-anchor",children:[e.jsx("button",{className:"session-list__menu-btn",onClick:r=>{r.stopPropagation(),n(o===s.id?null:s.id)},title:"Session actions","aria-label":"Session actions","aria-expanded":o===s.id,children:e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"currentColor",children:[e.jsx("circle",{cx:"8",cy:"3",r:"1.5"}),e.jsx("circle",{cx:"8",cy:"8",r:"1.5"}),e.jsx("circle",{cx:"8",cy:"13",r:"1.5"})]})}),o===s.id&&e.jsx(q,{sessionId:s.id,isDeleted:s.deleted,onDelete:u,onRestore:p,onRename:l?()=>D(s):void 0,onExport:i,onClose:()=>n(null)})]})]},s.id);return e.jsxs("div",{className:"session-list",children:[e.jsx("h2",{className:"session-list__title",children:"Sessions"}),t.length===0?e.jsx("div",{className:"session-list__empty",children:"No sessions found"}):e.jsx("div",{className:"session-list__items",children:t.map(b)})]})}w.__docgenInfo={description:"",methods:[],displayName:"SessionList",props:{sessions:{required:!0,tsType:{name:"Array",elements:[{name:"SessionInfo"}],raw:"SessionInfo[]"},description:""},selectedId:{required:!0,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},onSelect:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onDelete:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onRestore:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onRename:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string, newTitle: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"string"},name:"newTitle"}],return:{name:"void"}}},description:""},onExport:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""}}};const W={component:w,decorators:[t=>(k(),e.jsx(t,{}))]},S=[d({title:"Implement auth flow",projectName:"web-app"}),d({title:"Fix sidebar layout bug",projectName:"web-app"}),d({title:"Add export feature",projectName:"chronicle"})],j={args:{sessions:S,selectedId:null,onSelect:()=>{},onDelete:()=>{}}},f={args:{sessions:S,selectedId:S[1].id,onSelect:()=>{},onDelete:()=>{}}},_={args:{sessions:[d({title:"Active session",projectName:"my-project"}),d({title:"Hidden session",projectName:"my-project",deleted:!0}),d({title:"Another active session",projectName:"my-project"})],selectedId:null,onSelect:()=>{},onDelete:()=>{},onRestore:()=>{}}},h={args:{sessions:[],selectedId:null,onSelect:()=>{},onDelete:()=>{}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    sessions,
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {}
  }
}`,...j.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    sessions,
    selectedId: sessions[1].id,
    onSelect: () => {},
    onDelete: () => {}
  }
}`,...f.parameters?.docs?.source}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    sessions: [createSessionInfo({
      title: 'Active session',
      projectName: 'my-project'
    }), createSessionInfo({
      title: 'Hidden session',
      projectName: 'my-project',
      deleted: true
    }), createSessionInfo({
      title: 'Another active session',
      projectName: 'my-project'
    })],
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {},
    onRestore: () => {}
  }
}`,..._.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    sessions: [],
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {}
  }
}`,...h.parameters?.docs?.source}}};const B=["Default","WithSelected","WithDeletedSessions","Empty"];export{j as Default,h as Empty,_ as WithDeletedSessions,f as WithSelected,B as __namedExportsOrder,W as default};
