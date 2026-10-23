export default function LoadingModel() {
 return <main className="mx-auto max-w-5xl space-y-7 px-5 py-10" aria-busy="true" aria-label="Chargement du modèle">
   <div className="ui-skeleton h-5 w-44 rounded"/><div className="ui-skeleton h-10 max-w-lg rounded"/>
   <div className="ui-skeleton h-[420px] rounded-2xl"/><div className="ui-skeleton h-32 rounded-2xl"/>
 </main>;
}
