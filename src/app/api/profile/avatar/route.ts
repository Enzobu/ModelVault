import {currentUser,roleAllows} from "@/lib/access";
import {readFile} from "node:fs/promises";
import path from "node:path";
export const runtime="nodejs";
export async function GET(){
 const user=await currentUser();
 if(!user||!roleAllows(user.role,"USER")||!user.avatarCustom||!user.avatarFile)return new Response("Not found",{status:404});
 const file=path.basename(user.avatarFile);
 const ext=file.split(".").pop();
 const mime=ext==="png"?"image/png":ext==="jpg"?"image/jpeg":ext==="webp"?"image/webp":null;
 if(!mime)return new Response("Invalid image",{status:404});
 try{
  const buffer=await readFile(path.join(process.env.CACHE_PATH??"/app/data/cache","profile-avatars",file));
  return new Response(buffer,{headers:{"Content-Type":mime,"Cache-Control":"private, max-age=60","X-Content-Type-Options":"nosniff"}});
 }catch{return new Response("Not found",{status:404});}
}
