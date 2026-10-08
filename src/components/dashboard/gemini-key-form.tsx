export function GeminiKeyForm({ hasKey }: { invitationId: string; hasKey: boolean }) {
 return <p className="rounded-lg border p-3 text-sm text-muted-foreground">{hasKey ? "The project Gemini key is configured." : "Ask an admin to configure Gemini in Project settings."} You do not need a separate key for this invitation.</p>;
}
