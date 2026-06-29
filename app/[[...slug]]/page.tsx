"use client"

import dynamic from "next/dynamic"

const ClientApp = dynamic(() => import("@/ClientApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
      Loading…
    </div>
  ),
})

export default function Page() {
  return <ClientApp />
}
