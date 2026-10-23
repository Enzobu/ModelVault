"use client";
import { useState } from "react";

export default function OpenInCura({ modelId }: { modelId: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/bridge/tickets", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });
      if (!response.ok) throw new Error("Impossible de préparer le transfert Cura");
      const { url } = await response.json() as { url: string };
      if (!url.startsWith("modelvault://open?")) throw new Error("Lien Cura invalide");
      window.location.href = url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur de transfert");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-2">
    <button type="button" onClick={() => void open()} disabled={busy}
      className="rounded-lg border border-[var(--accent)] px-4 py-2 font-medium text-[var(--accent)] disabled:opacity-50">
      {busy ? "Préparation…" : "Ouvrir dans Cura"}
    </button>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <p className="text-xs opacity-65">Nécessite ModelVault Bridge sur Windows.</p>
  </div>;
}
