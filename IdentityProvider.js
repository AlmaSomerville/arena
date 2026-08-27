"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { initials } from "@/lib/identity";

const IdentityContext = createContext(null);

export function IdentityProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = guest
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState("");
  const [gateResolver, setGateResolver] = useState(null);

  useEffect(() => {
    fetch("/api/identity")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);

  const claimNickname = useCallback(async (nickname) => {
    const res = await fetch("/api/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't set that nickname.");
    setUser(data.user);
    return data.user;
  }, []);

  // requireIdentity() returns a promise that resolves with the user once
  // they've picked a nickname (or resolves immediately if they already
  // have one). Used to lazily gate voting / staking / replying.
  const requireIdentity = useCallback(
    (reason) =>
      new Promise((resolve) => {
        setUser((current) => {
          if (current) {
            resolve(current);
          } else {
            setGateReason(reason || "Pick a nickname to join in.");
            setGateOpen(true);
            setGateResolver(() => resolve);
          }
          return current;
        });
      }),
    []
  );

  const handleGateSubmit = useCallback(
    async (nickname) => {
      const created = await claimNickname(nickname);
      setGateOpen(false);
      if (gateResolver) gateResolver(created);
      setGateResolver(null);
      return created;
    },
    [claimNickname, gateResolver]
  );

  return (
    <IdentityContext.Provider value={{ user, claimNickname, requireIdentity }}>
      {children}
      {gateOpen && (
        <NicknameGate
          reason={gateReason}
          onSubmit={handleGateSubmit}
          onClose={() => {
            setGateOpen(false);
            setGateResolver(null);
          }}
        />
      )}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used inside IdentityProvider");
  return ctx;
}

function NicknameGate({ reason, onSubmit, onClose }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form
        onSubmit={submit}
        className="card w-full max-w-sm p-6 fade-in"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold mb-4"
          style={{ background: "var(--accent-soft)", color: "#d6cbff" }}
        >
          {value ? initials(value) : "?"}
        </div>
        <h2 className="text-lg font-semibold font-display mb-1">Who&apos;s stepping into the arena?</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
          {reason} No password — just a nickname your friends will recognize. Using one that already
          exists signs you back in as that person.
        </p>
        <input
          autoFocus
          className="input"
          placeholder="Your nickname"
          maxLength={20}
          autoCapitalize="words"
          autoCorrect="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error && (
          <p className="text-sm mt-2" style={{ color: "var(--down)" }}>
            {error}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            Not now
          </button>
          <button type="submit" disabled={busy || value.trim().length < 2} className="btn btn-primary flex-1">
            {busy ? "Joining…" : "Join the arena"}
          </button>
        </div>
      </form>
    </div>
  );
}
