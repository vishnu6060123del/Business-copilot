"use client"

import { HashRouter } from "react-router-dom"
import App from "@/App"

export default function ClientApp() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  )
}
