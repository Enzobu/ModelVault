import Link from "next/link";
import { roleAllows } from "@/lib/access";
import ProfileAvatar from "@/components/profile-avatar";
import type { User } from "@prisma/client";

export default function SiteHeader({user,active="library"}:{user:User;active?:"library"|"favorites"|"organize"|"profile"}) {
 const links=[{href:"/",label:"Bibliothèque",key:"library"},{href:"/favorites",label:"Favoris",key:"favorites"}];
 if(roleAllows(user.role,"EDITOR")) links.push({href:"/admin/organize",label:"À organiser",key:"organize"});
 if(user.role==="ADMIN") links.push({href:"/admin",label:"Administration",key:"admin"});
 return <header className="site-header">
   <Link href="/" className="brand"><span className="brand-mark">M<span>V</span></span><span>ModelVault</span></Link>
   <nav aria-label="Navigation principale" className="site-nav">
    {links.map(link=><Link key={link.key} href={link.href} aria-current={active===link.key?"page":undefined} className={"site-nav-link "+(active===link.key?"is-active":"")}>{link.label}</Link>)}
   </nav>
   <Link href="/profile" className={"profile-trigger "+(active==="profile"?"is-active":"")} aria-label="Mon profil" title={user.displayName??user.email}>
    <ProfileAvatar user={user} size={31} />
    <span className="profile-trigger-name">{user.displayName?.split(" ")[0]??"Profil"}</span>
   </Link>
  </header>;
}
