export default function Loading() {
 return <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8" aria-label="Chargement de la bibliothèque" aria-busy="true">
   <div className="ui-skeleton h-12 max-w-sm rounded-xl"/>
   <div className="ui-skeleton h-24 rounded-2xl"/>
   <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({length:12},(_,i)=>
     <div key={i} className="ui-surface overflow-hidden rounded-2xl"><div className="ui-skeleton aspect-[4/3]"/>
       <div className="space-y-3 p-4"><div className="ui-skeleton h-5 rounded"/><div className="ui-skeleton h-3 w-2/3 rounded"/></div>
     </div>)}</div>
 </main>;
}
