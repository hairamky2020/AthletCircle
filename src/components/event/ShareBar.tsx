"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/backend";
import { Icon } from "./Icons";

/** WhatsApp, copy-link and native share. No third-party scripts: WhatsApp opens via its public wa.me link. */
export function ShareBar({ slug, title, when, url, compact = false }: { slug: string; title: string; when: string; url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);
  const text = `${title} · ${when}\nDetails on AthletCircle: ${url}\n\nDiscover. Participate. Achieve.`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  async function copy() {
    track(slug, "share");
    try { await navigator.clipboard.writeText(url); } catch {
      const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  async function native() {
    track(slug, "share");
    try { await navigator.share({ title, text: `${title} · ${when}`, url }); } catch {}
  }
  return (
    <div className={`share-bar${compact ? " is-compact" : ""}`}>
      <a className="share-wa" href={wa} target="_blank" rel="noopener" onClick={() => track(slug, "share")} aria-label={`Share ${title} on WhatsApp`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" /></svg>
        WhatsApp
      </a>
      <button type="button" className="share-btn" onClick={copy}><Icon name="link" className="h-5 w-5" />{copied ? "Link copied" : "Copy link"}</button>
      {canShare && <button type="button" className="share-btn" onClick={native}><Icon name="share" className="h-5 w-5" />More</button>}
      <span className="sr-only" role="status">{copied ? "Link copied" : ""}</span>
    </div>
  );
}
