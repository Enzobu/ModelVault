"use client";
import {useEffect,useRef,useState} from "react";
type Option={value:string;label:string};
export default function CustomSelect({value,onChange,options,label}:{value:string;onChange:(value:string)=>void;options:Option[];label:string}) {
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const selected=options.find(o=>o.value===value)?.label??options[0]?.label??label;
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};
  const keys=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",keys);
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",keys)};
 },[open]);
 return <div className="custom-select" ref={root}>
   <button type="button" className="custom-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
    <span className="truncate">{selected}</span><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
   </button>
   {open&&<div role="listbox" aria-label={label} className="custom-select-menu">
     {options.map((option)=><button type="button" role="option" aria-selected={option.value===value} key={option.value}
       className={"custom-select-option "+(option.value===value?"selected":"")} onClick={()=>{onChange(option.value);setOpen(false)}}>{option.label}{option.value===value&&<span aria-hidden="true">✓</span>}</button>)}
   </div>}
 </div>;
}
