"use client"

const buildTime = new Date().toISOString()

const runtimeData = (() => {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const anonRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  const urlPresent = Boolean(urlRaw && urlRaw.trim())
  const anonPresent = Boolean(anonRaw && anonRaw.trim())

  return {
    urlPresent,
    urlPrefix: urlPresent ? urlRaw.slice(0, 20) : "MISSING",
    anonPresent,
    anonLength: anonPresent ? anonRaw.length : 0,
  }
})()

export default function DebugEnvPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8 text-sm">
      <h1 className="text-2xl font-semibold">Environment Debug</h1>
      <p className="text-muted-foreground">Remove this page after debugging.</p>
      <section className="space-y-2 rounded-lg border border-dashed p-4">
        <div className="flex justify-between">
          <span>urlPresent</span>
          <span>{String(runtimeData.urlPresent)}</span>
        </div>
        <div className="flex justify-between">
          <span>urlPrefix</span>
          <span className="font-mono">{runtimeData.urlPrefix}</span>
        </div>
        <div className="flex justify-between">
          <span>anonPresent</span>
          <span>{String(runtimeData.anonPresent)}</span>
        </div>
        <div className="flex justify-between">
          <span>anonLength</span>
          <span>{runtimeData.anonLength}</span>
        </div>
        <div className="flex justify-between">
          <span>buildTime</span>
          <span className="font-mono">{buildTime}</span>
        </div>
      </section>
    </main>
  )
}
