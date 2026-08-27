"use client";

import Link from "next/link";
import { useState } from "react";
import { useIdentity } from "@/components/IdentityProvider";
import { initials } from "@/lib/identity";

export default function Nav() {
  const { user, requireIdentity } = useIdentity();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ borderColor: "var(--border)", background: "rgba(11,11,18,0.75)" }}
      >
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              A
            </span>
            <span className="font-display font-bold text-lg tracking-tight">The Arena</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/new" className="btn btn-primary hidden sm:inline-flex text-sm">
              + Stake a claim
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs shrink-0"
              style={{
                background: user ? user.avatar_color : "rgba(255,255,255,0.08)",
                color: user ? "#0b0b12" : "var(--text-dim)",
                border: user ? "none" : "1px solid var(--border)",
              }}
              onDoubleClick={() => requireIdentity("Switch who's playing.")}
              title={user ? user.nickname : "Guest — tap to join"}
            >
              {user ? initials(user.nickname) : "?"}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-16 right-4 card p-3 min-w-[190px] fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {user ? (
              <div className="px-2 py-1.5 mb-1">
                <p className="text-sm font-semibold">{user.nickname}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {user.rep ?? 0} Rep
                </p>
              </div>
            ) : (
              <div className="px-2 py-1.5 mb-1">
                <p className="text-sm font-semibold">Browsing as a guest</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Join to stake claims &amp; vote
                </p>
              </div>
            )}
            <Link href="/settings" onClick={() => setMenuOpen(false)} className="btn btn-ghost w-full text-sm mb-1">
              Settings
            </Link>
            <button
              className="btn btn-ghost w-full text-sm"
              onClick={() => {
                setMenuOpen(false);
                requireIdentity(user ? "Switch identity." : "Pick a nickname to join in.");
              }}
            >
              {user ? "Switch nickname" : "Join the arena"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom tab bar on phone, floating action button on larger screens */}
      <MobileTabBar />
    </>
  );
}

function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t sm:hidden"
      style={{ borderColor: "var(--border)", background: "rgba(11,11,18,0.9)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <Link href="/" className="btn btn-ghost flex-1 text-sm">
          Feed
        </Link>
        <Link href="/new" className="btn btn-primary flex-1 text-sm">
          Stake a claim
        </Link>
      </div>
    </nav>
  );
}
