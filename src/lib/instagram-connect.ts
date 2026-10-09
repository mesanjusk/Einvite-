import { db } from "@/lib/db";
import { hashToken, generateToken } from "@/lib/otp";
import { checkFollowStatusLive, readFollowStatus } from "@/lib/instagram-follow-status";
import { getAppUrl } from "@/lib/app-url";
import { instagramValidationEnabled } from "@/lib/instagram-validation";
export function connectionCodeFromMessage(text: string) { return /^LINK\s+([a-f0-9]{32})$/i.exec(text.trim())?.[1].toLowerCase() ?? null; }
export async function instagramPublishRequirement(invitationId: string, force = false): Promise<string|null> {
 if (!instagramValidationEnabled()) return null;
 const [invitation,settings,link]=await Promise.all([db.invitation.findUnique({where:{id:invitationId},select:{isDemo:true}}),db.instagramFlowSettings.findUnique({where:{key:"default"}}),db.instagramLink.findUnique({where:{invitationId}})]);
 if(invitation?.isDemo || settings?.gateInvitations===false) return null;
 if(!link) return "Connect your following Instagram account before publishing or sharing.";
 return await readFollowStatus(link.igUserId, { force })===true ? null : "Follow our Instagram account, then check again before publishing.";
}
/** Called only for an inbound message accepted by the signed Meta webhook. */
export async function connectInstagramFromMessage(code:string, igUserId:string, username?:string): Promise<{text:string;connected:boolean}> {
 const request=await db.instagramConnectRequest.findUnique({where:{codeHash:hashToken(code)}});
 if(!request || request.expiresAt.getTime()<=Date.now()) return {connected:false,text:"This website connection code has expired. Open your invitation editor and generate a new code."};
 if(request.completedAt) return {connected:false,text:"This connection code was already used. Return to your invitation editor to check the account connection."};
 if(instagramValidationEnabled() && await checkFollowStatusLive(igUserId,username)!==true) return {connected:false,text:"Follow our Instagram account first, then send the same LINK message again so we can verify and connect your website."};
 const byInvitation = await db.instagramLink.findUnique({where:{invitationId:request.invitationId}});
 if(byInvitation && byInvitation.igUserId!==igUserId) return {connected:false,text:"This invitation belongs to another Instagram account. Use its existing private edit link or contact SK Digital; no invitation has been replaced."};
 const claimed=await db.instagramConnectRequest.updateMany({where:{id:request.id,completedAt:null,expiresAt:{gt:new Date()}},data:{completedAt:new Date()}});
 if(claimed.count!==1) return {connected:false,text:"This connection code is no longer available. Generate another code from your editor."};
 const token=generateToken();
 try {
  if(byInvitation) await db.instagramLink.update({where:{id:byInvitation.id},data:{username:username??byInvitation.username,editTokenHash:hashToken(token)}});
  else await db.instagramLink.create({data:{igUserId,username,invitationId:request.invitationId,editTokenHash:hashToken(token)}});
 } catch { return {connected:false,text:"Could not connect this account. Generate a fresh code and try again; your invitation content is safe."}; }
 const invitation=await db.invitation.findUnique({where:{id:request.invitationId},select:{slug:true,status:true}});
 return {connected:true,text:`Your Instagram account is connected to your website. Keep this private editor link:\n${getAppUrl()}/e/${token}${invitation?.status==="PUBLISHED" ? `\nShare with guests:\n${getAppUrl()}/invite/${invitation.slug}` : "\nFinish editing and tap Publish to get your guest link and PDF."}`};
}
