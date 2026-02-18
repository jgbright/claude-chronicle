import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as h}from"./iframe-CJQCZEUI.js";import{f as y,a as I,c,r as w}from"./factories-CpYswzxf.js";import"./preload-helper-PPVm8Dsz.js";function D({sessionId:t,isDeleted:r,onDelete:a,onRestore:l,onRename:d,onExport:m,onClose:i}){const o=h.useRef(null);return h.useEffect(()=>{const n=_=>{o.current&&!o.current.contains(_.target)&&i()};return document.addEventListener("mousedown",n),()=>document.removeEventListener("mousedown",n)},[i]),e.jsx("div",{className:"session-menu",ref:o,role:"menu",children:r?l&&e.jsx("button",{className:"session-menu__item",role:"menuitem",onClick:n=>{n.stopPropagation(),l(t),i()},children:"Restore"}):e.jsxs(e.Fragment,{children:[d&&e.jsx("button",{className:"session-menu__item",role:"menuitem",onClick:n=>{n.stopPropagation(),d(t),i()},children:"Rename"}),m&&e.jsx("button",{className:"session-menu__item",role:"menuitem",onClick:n=>{n.stopPropagation(),m(t),i()},children:"Export"}),a&&e.jsx("button",{className:"session-menu__item session-menu__item--danger",role:"menuitem",onClick:n=>{n.stopPropagation(),a(t),i()},children:"Hide"})]})})}function N({sessions:t,selectedId:r,onSelect:a,onDelete:l,onRestore:d,onRename:m,onExport:i}){const[o,n]=h.useState(null),_=t.filter(s=>!s.deleted),f=t.filter(s=>s.deleted),v=s=>e.jsxs("div",{className:`session-list__item-wrapper ${s.deleted?"session-list__item--deleted":""}`,children:[e.jsxs("button",{className:`session-list__item ${s.id===r?"session-list__item--selected":""}`,onClick:()=>a(s.id),children:[s.title?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"session-list__session-title",children:s.title}),e.jsx("div",{className:"session-list__project-secondary",children:s.projectName})]}):e.jsx("div",{className:"session-list__project",children:s.projectName}),e.jsxs("div",{className:"session-list__meta",children:[e.jsx("span",{children:y(s.modTime)}),e.jsx("span",{children:I(s.sizeBytes)})]}),e.jsxs("div",{className:"session-list__id",children:[s.id.slice(0,8),"..."]})]}),e.jsxs("div",{className:"session-list__menu-anchor",children:[e.jsx("button",{className:"session-list__menu-btn",onClick:S=>{S.stopPropagation(),n(o===s.id?null:s.id)},title:"Session actions","aria-label":"Session actions","aria-expanded":o===s.id,children:e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"currentColor",children:[e.jsx("circle",{cx:"8",cy:"3",r:"1.5"}),e.jsx("circle",{cx:"8",cy:"8",r:"1.5"}),e.jsx("circle",{cx:"8",cy:"13",r:"1.5"})]})}),o===s.id&&e.jsx(D,{sessionId:s.id,isDeleted:s.deleted,onDelete:l,onRestore:d,onRename:m,onExport:i,onClose:()=>n(null)})]})]},s.id);return e.jsxs("div",{className:"session-list",children:[e.jsx("h2",{className:"session-list__title",children:"Sessions"}),t.length===0?e.jsx("div",{className:"session-list__empty",children:"No sessions found"}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"session-list__items",children:_.map(v)}),f.length>0&&e.jsx(b,{children:f.map(v)})]})]})}function b({children:t}){const[r,a]=h.useState(!1);return e.jsxs("div",{className:"session-list__archived",children:[e.jsxs("button",{className:"session-list__archived-toggle",onClick:()=>a(!r),children:[e.jsx("span",{className:"session-list__archived-icon",children:r?"▾":"▸"}),"Hidden"]}),r&&e.jsx("div",{className:"session-list__items",children:t})]})}N.__docgenInfo={description:"",methods:[],displayName:"SessionList",props:{sessions:{required:!0,tsType:{name:"Array",elements:[{name:"SessionInfo"}],raw:"SessionInfo[]"},description:""},selectedId:{required:!0,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},onSelect:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onDelete:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onRestore:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onRename:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onExport:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""}}};const A={component:N,decorators:[t=>(w(),e.jsx(t,{}))]},x=[c({title:"Implement auth flow",projectName:"web-app"}),c({title:"Fix sidebar layout bug",projectName:"web-app"}),c({title:"Add export feature",projectName:"chronicle"})],u={args:{sessions:x,selectedId:null,onSelect:()=>{},onDelete:()=>{}}},p={args:{sessions:x,selectedId:x[1].id,onSelect:()=>{},onDelete:()=>{}}},g={args:{sessions:[c({title:"Active session",projectName:"my-project"}),c({title:"Hidden session",projectName:"my-project",deleted:!0}),c({title:"Another active session",projectName:"my-project"})],selectedId:null,onSelect:()=>{},onDelete:()=>{},onRestore:()=>{}}},j={args:{sessions:[],selectedId:null,onSelect:()=>{},onDelete:()=>{}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    sessions,
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {}
  }
}`,...u.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    sessions,
    selectedId: sessions[1].id,
    onSelect: () => {},
    onDelete: () => {}
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    sessions: [],
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {}
  }
}`,...j.parameters?.docs?.source}}};const R=["Default","WithSelected","WithDeletedSessions","Empty"];export{u as Default,j as Empty,g as WithDeletedSessions,p as WithSelected,R as __namedExportsOrder,A as default};
