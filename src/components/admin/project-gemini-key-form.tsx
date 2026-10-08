"use client";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getProjectGeminiStatusAction, saveProjectGeminiKeyAction } from "@/lib/actions/project-settings";
export function ProjectGeminiKeyForm() {
 const [key,setKey]=useState(""); const [configured,setConfigured]=useState(false); const [pending,start]=useTransition();
 useEffect(()=>{void getProjectGeminiStatusAction().then((result)=>{if(result.success)setConfigured(result.data.configured);});},[]);
 function save(value:string|null){start(async()=>{const result=await saveProjectGeminiKeyAction(value);if(!result.success){toast.error(result.error);return;}setKey("");setConfigured(result.data.configured);toast.success("Project-wide Gemini setting saved.");});}
 return <section className="grid gap-3 rounded-xl border bg-white p-4 text-sm"><h3 className="font-semibold">Project-wide Gemini API key</h3><p className="text-xs text-muted-foreground">One admin-managed key for every theme, invitation and Gemini video generation. Customers never see the key.</p><p role="status" className="text-xs">{configured?"Project key configured":"No project key configured"}</p><label className="grid gap-1 text-xs">Gemini API key<input type="password" autoComplete="off" className="rounded-lg border p-2" value={key} onChange={(event)=>setKey(event.target.value)} placeholder="Paste key to replace the project setting" /></label><div className="flex gap-2"><button type="button" disabled={pending||!key.trim()} onClick={()=>save(key)} className="rounded-lg bg-violet-700 px-3 py-2 text-white disabled:opacity-40">Save for entire project</button><button type="button" disabled={pending} onClick={()=>save(null)} className="rounded-lg border px-3 py-2">Clear saved key</button></div></section>;
}
