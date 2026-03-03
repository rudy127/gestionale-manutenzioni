"use client";

import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import Dashboard from "./components/DashboardMain";
import Queue from "./components/Queue";
import ClientDetail from "./components/ClientDetail";

/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyDnduh9NKI2AqTn4rFC0kKTsIGCm6Ip7SY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "1:679882450882:web:85857ff10ae54794a5585b",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
const auth = getAuth(app);

/* ================= COMPONENT ================= */

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [view, setView] = useState<"dashboard" | "queue" | "detail">(
    "dashboard"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ===== AUTH LISTENER ===== */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  /* ===== LOADING ===== */

  if (!authReady)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        Caricamento...
      </div>
    );

  /* ===== LOGIN ===== */

  if (!user)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-white text-black space-y-4">
        <h1 className="text-2xl font-bold">Login Gestionale</h1>

        <input
          className="border-2 border-black p-2 rounded w-64"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border-2 border-black p-2 rounded w-64"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={async () => {
            try {
              await signInWithEmailAndPassword(auth, email, password);
            } catch {
              alert("Credenziali errate");
            }
          }}
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
          Accedi
        </button>
      </div>
    );

  /* ===== DASHBOARD ===== */

  if (view === "dashboard") {
    return (
      <Dashboard
        user={user}
        goQueue={() => setView("queue")}
        goDetail={(id: string) => {
          setSelectedId(id);
          setView("detail");
        }}
        logout={() => signOut(auth)}
      />
    );
  }

  /* ===== QUEUE ===== */

  if (view === "queue") {
    return (
      <Queue
        user={user}
        goBack={() => setView("dashboard")}
        goDetail={(id: string) => {
          setSelectedId(id);
          setView("detail");
        }}
      />
    );
  }

  /* ===== CLIENT DETAIL ===== */

  if (view === "detail" && selectedId) {
    return (
      <ClientDetail
        user={user}
        clientId={selectedId}
        goBack={() => setView("dashboard")}
      />
    );
  }

  return null;
}