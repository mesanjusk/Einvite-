"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { encryptProjectKey } from "@/lib/project-gemini";
import type { ActionResult } from "./auth";
export async function getProjectGeminiStatusAction(): Promise<ActionResult<{configured:boolean}>> {
 if(!await getAdmin()) return {success:false,error:"Admin access required."};
 const settings=await db.projectSettings.findUnique({where:{key:"default"}});
 return {success:true,data:{configured:Boolean(settings?.geminiKeyCipher || process.env.GEMINI_API_KEY)}};
}
export async function saveProjectGeminiKeyAction(input: unknown): Promise<ActionResult<{configured:boolean}>> {
 if(!await getAdmin()) return {success:false,error:"Admin access required."};
 const parsed=z.string().trim().min(10).max(200).regex(/^[A-Za-z0-9_-]+$/).nullable().safeParse(input);
 if(!parsed.success) return {success:false,error:"Enter a valid Gemini API key."};
 try { await db.projectSettings.upsert({where:{key:"default"},create:{key:"default",geminiKeyCipher:parsed.data ? encryptProjectKey(parsed.data):null},update:{geminiKeyCipher:parsed.data ? encryptProjectKey(parsed.data):null}}); }
 catch { return {success:false,error:"Could not save the project key. Check server configuration and try again."}; }
 revalidatePath("/admin/settings");
 return {success:true,data:{configured:Boolean(parsed.data || process.env.GEMINI_API_KEY)}};
}
