import type { User } from "@prisma/client";
export function initials(value:string):string {
 const words=value.trim().split(/\s+/).filter(Boolean);
 return (words.length>1? words[0][0]+words[words.length-1][0] : (words[0]??"MV").slice(0,2)).toLocaleUpperCase("fr-FR");
}
export default function ProfileAvatar({user,size=48}:{user:Pick<User,"displayName"|"email"|"googleAvatarUrl"|"avatarCustom">;size?:number}) {
 const url=user.avatarCustom?"/api/profile/avatar":user.googleAvatarUrl;
 return <span className="profile-avatar" style={{width:size,height:size,fontSize:Math.max(11,size*.34)}} aria-hidden="true">
  {url?<img src={url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />:initials(user.displayName??user.email.split("@")[0])}
 </span>;
}
