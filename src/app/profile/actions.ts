"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {mkdir,writeFile,unlink} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {currentUser,roleAllows} from "@/lib/access";
import {prisma} from "@/lib/prisma";

const avatarDirectory=process.env.CACHE_PATH ?? "/app/data/cache";
async function requireUser(){
 const user=await currentUser();
 if(!user||!roleAllows(user.role,"USER"))throw new Error("Forbidden");
 return user;
}
export async function saveProfile(form:FormData) {
 const user=await requireUser();
 const name=String(form.get("displayName")??"").trim().replace(/\s+/g," ").slice(0,90);
 if(name.length<2)throw new Error("Le nom doit comporter au moins 2 caractères");
 await prisma.user.update({where:{id:user.id},data:{displayName:name}});
 revalidatePath("/");revalidatePath("/profile");
 redirect("/profile?saved=1");
}
export async function uploadAvatar(form:FormData) {
 const user=await requireUser();
 const file=form.get("avatar");
 if(!(file instanceof File)||file.size===0||file.size>2*1024*1024)throw new Error("Image de 2 Mo maximum");
 const bytes=Buffer.from(await file.arrayBuffer());
 const png=bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>12&&bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
 if(!png&&!jpg&&!webp)throw new Error("PNG, JPEG ou WebP uniquement");
 const filename=user.id+"-"+randomUUID()+"."+(png?"png":jpg?"jpg":"webp");
 const directory=path.join(avatarDirectory,"profile-avatars");
 await mkdir(directory,{recursive:true});
 await writeFile(path.join(directory,filename),bytes,{flag:"wx",mode:0o600});
 const previous=user.avatarFile;
 await prisma.user.update({where:{id:user.id},data:{avatarCustom:true,avatarFile:filename}});
 if(previous)await unlink(path.join(directory,path.basename(previous))).catch(()=>{});
 revalidatePath("/");revalidatePath("/profile");
 redirect("/profile?avatar=1");
}
export async function resetAvatar(){
 const user=await requireUser();
 await prisma.user.update({where:{id:user.id},data:{avatarCustom:false,avatarFile:null}});
 if(user.avatarFile)await unlink(path.join(avatarDirectory,"profile-avatars",path.basename(user.avatarFile))).catch(()=>{});
 revalidatePath("/");revalidatePath("/profile");
 redirect("/profile?avatar=reset");
}
