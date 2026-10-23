export default function LoadingOrganization() {
 return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8" aria-busy="true" aria-label="Chargement des modèles">
   <div className="ui-skeleton h-10 max-w-md rounded"/>
   <div className="ui-skeleton h-14 rounded-xl"/>
   {Array.from({length:6},(_,i)=><div key={i} className="ui-skeleton h-20 rounded-2xl"/>)}
 </main>;
}
