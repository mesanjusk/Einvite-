"use server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { hashToken } from "@/lib/otp";
import { instagramPublishRequirement } from "@/lib/instagram-connect";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";
export async function prepareInstagramConnectionAction(invitationId:string): Promise<ActionResult<{message:string;profileUrl:string;dmUrl:string}>> {
 if(!await authorizeInvitationAccess(invitationId)) return {success:false,error:"Invitation not found."};
 const settings=await db.instagramFlowSettings.findUnique({where:{key:"default"}});
 const profileUrl=settings?.profileUrl || "https://www.instagram.com/sanju.sk.digital/";
 const handle=new URL(profileUrl).pathname.split("/").filter(Boolean)[0];
 const code=randomBytes(16).toString("hex");
 await db.instagramConnectRequest.upsert({where:{invitationId},create:{invitationId,codeHash:hashToken(code),expiresAt:new Date(Date.now()+15*60*1000)},update:{codeHash:hashToken(code),expiresAt:new Date(Date.now()+15*60*1000),completedAt:null}});
 return {success:true,data:{message:`LINK ${code}`,profileUrl,dmUrl:`https://ig.me/m/${handle}`}};
}
export async function checkInstagramConnectionAction(invitationId:string): Promise<ActionResult<{ready:boolean;message:string;username:string|null}>> {
 const invitation=await authorizeInvitationAccess(invitationId);if(!invitation)return {success:false,error:"Invitation not found."};
 const link=await db.instagramLink.findUnique({where:{invitationId}});
 const message=await instagramPublishRequirement(invitationId, true);
 revalidatePath(`/invite/${invitation.slug}`);
 return {success:true,data:{ready:!message,message:message??"Instagram account verified. Your guest link and PDF can be shared.",username:link?.username??null}};
}
