import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
function encryptionKey() {
 const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
 if (!secret) throw new Error("Server encryption configuration is missing.");
 return createHash("sha256").update(secret).digest();
}
export function encryptProjectKey(value: string) {
 const iv=randomBytes(12); const cipher=createCipheriv("aes-256-gcm",encryptionKey(),iv);
 const bytes=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
 return [iv.toString("base64"),cipher.getAuthTag().toString("base64"),bytes.toString("base64")].join(".");
}
export function decryptProjectKey(value: string) {
 const [iv,tag,bytes]=value.split("."); const cipher=createDecipheriv("aes-256-gcm",encryptionKey(),Buffer.from(iv,"base64")); cipher.setAuthTag(Buffer.from(tag,"base64"));
 return Buffer.concat([cipher.update(Buffer.from(bytes,"base64")),cipher.final()]).toString("utf8");
}
export async function getProjectGeminiKey() {
 const settings=await db.projectSettings.findUnique({where:{key:"default"}});
 return settings?.geminiKeyCipher ? decryptProjectKey(settings.geminiKeyCipher) : process.env.GEMINI_API_KEY || null;
}
