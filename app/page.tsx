"use client";

import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

import Dashboard from "./components/Dashboard";
import Queue from "./components/Queue";
import ClientDetail from "./components/ClientDetail";

const firebaseConfig = {
  apiKey: "AIzaSyDnduh9NKI2AqTn4rFC0kKTsIGCm6Ip7SY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "1:679882450882:web:85857ff10ae54794a5585b",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

type ViewType = "dashboard" | "queue" | "detail";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div>Devi effettuare il login.</div>
      </div>
    );

  if (view === "dashboard")
    return (
      <Dashboard
        user={user}
        goQueue={() => setView("queue")}
        goDetail={(id) => {
          setSelectedId(id);
          setView("detail");
        }}
      />
    );

  if (view === "queue")
    return (
      <Queue
        user={user}
        goBack={() => setView("dashboard")}
        goDetail={(id) => {
          setSelectedId(id);
          setView("detail");
        }}
      />
    );

  return (
    <ClientDetail
      user={user}
      clientId={selectedId!}
      goBack={() => setView("dashboard")}
    />
  );
}