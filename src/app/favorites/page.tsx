import Home from "../page";
type Params={page?:string;q?:string;category?:string;tag?:string;organization?:string};
export default function Favorites({searchParams}:{searchParams:Promise<Params>}) {
 return Home({searchParams,section:"favorites"});
}
