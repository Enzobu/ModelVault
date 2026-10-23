"use client";
import {useState} from "react";
export default function PalettePicker({palettes,defaultValue}:{palettes:Record<string,readonly string[]>;defaultValue:string}) {
 const [selected,setSelected]=useState(defaultValue);
 return <fieldset className="space-y-2"><legend className="text-xs font-semibold">Palette</legend>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries(palettes).map(([name,colors])=>
   <label key={name} className={"palette-tile "+(selected===name?"selected":"")}>
    <input type="radio" name="palette" className="sr-only" value={name} checked={selected===name} onChange={()=>setSelected(name)}/>
    <span className="flex items-center justify-between gap-2 capitalize"><span>{name}</span>{selected===name&&<span className="palette-selected" aria-hidden="true">✓</span>}</span>
    <span className="mt-2 flex overflow-hidden rounded-sm">{colors.map(color=><span key={color} className="h-3 flex-1" style={{background:color}}/>)}</span>
   </label>)}</div>
 </fieldset>;
}
