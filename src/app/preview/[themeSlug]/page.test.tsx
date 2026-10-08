import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db",()=>({db:{theme:{findUnique:vi.fn()}}}));
vi.mock("next/navigation",()=>({notFound:()=>{throw new Error("NOT_FOUND");}}));
vi.mock("@/components/invite/invite-experience",()=>({InviteExperience:()=>null}));
vi.mock("@/components/guest/start-live-invitation-button",()=>({StartLiveInvitationButton:()=>null}));
import { db } from "@/lib/db";
import Page from "./page";
beforeEach(()=>vi.resetAllMocks());
describe("read-only theme preview",()=>{
 it("renders a published legacy theme with nullable assets and no multi-category list",async()=>{
 vi.mocked(db.theme.findUnique).mockResolvedValue({id:"theme",name:"Wedding",slug:"wedding",type:"WEBSITE",isPublished:true,eventCategory:"wedding",eventCategories:[],category:"classic",templates:[],content:null,decorAssets:null,previewImage:null,revealVideoUrl:null,colorPalette:{primary:"#76508c",secondary:"#eee6f4",accent:"#a987bd",background:"#fff",foreground:"#4b3659"},fontPairing:{display:"serif",body:"sans-serif",script:"serif"}} as never);
 expect(await Page({params:Promise.resolve({themeSlug:"wedding"})})).toBeTruthy();
 expect(db.theme.findUnique).toHaveBeenCalledWith({where:{slug:"wedding"},include:{templates:true}});
 });
 it("does not expose an unpublished theme",async()=>{vi.mocked(db.theme.findUnique).mockResolvedValue({isPublished:false} as never);await expect(Page({params:Promise.resolve({themeSlug:"draft"})})).rejects.toThrow("NOT_FOUND");});
});
