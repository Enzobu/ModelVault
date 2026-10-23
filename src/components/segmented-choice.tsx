"use client";
import {useState} from "react";

export default function SegmentedChoice({name,options,defaultValue,label}:{name:string;options:readonly (readonly [string,string])[];defaultValue:string;label:string}) {
 const [selected,setSelected]=useState(defaultValue);
 return <fieldset className="space-y-2">
  <legend className="text-xs font-semibold">{label}</legend>
  <div className="segmented-choice" role="radiogroup" aria-label={label}>
   {options.map(([value,text])=><label key={value} className={"segmented-choice-item "+(selected===value?"selected":"")}>
    <input type="radio" className="sr-only" name={name} value={value} checked={selected===value} onChange={()=>setSelected(value)}/>
    <span>{text}</span>
   </label>)}
  </div>
 </fieldset>;
}
