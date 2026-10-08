import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: { projectSettings: { findUnique: vi.fn() } } }));
import { db } from "@/lib/db";
import { encryptProjectKey, decryptProjectKey, getProjectGeminiKey } from "./project-gemini";
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("AUTH_SECRET","server-secret-for-encryption"); vi.stubEnv("GEMINI_API_KEY","environment-project-key"); });
describe("project Gemini configuration", () => {
 it("encrypts keys with a random nonce and rejects a modified ciphertext", () => { const encrypted=encryptProjectKey("private-key"); expect(encrypted).not.toContain("private-key"); expect(encryptProjectKey("private-key")).not.toBe(encrypted); expect(decryptProjectKey(encrypted)).toBe("private-key"); const parts=encrypted.split("."); parts[1]=Buffer.alloc(16).toString("base64"); expect(()=>decryptProjectKey(parts.join("."))).toThrow(); });
 it("uses the saved project key for every caller, falling back to the environment", async () => { vi.mocked(db.projectSettings.findUnique).mockResolvedValue({geminiKeyCipher:encryptProjectKey("saved-project-key")} as never); expect(await getProjectGeminiKey()).toBe("saved-project-key"); vi.mocked(db.projectSettings.findUnique).mockResolvedValue(null); expect(await getProjectGeminiKey()).toBe("environment-project-key"); });
});
