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

import Dashboard from "./components/Dashboard";
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
export const auth = getAuth(app);

/* ================= TYPES ================= */

type ViewType = "dashboard" | "queue" | "detail";

/* ================= COMPONENT ================= */

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ================= AUTH LISTENER ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  /* ================= LOGIN SCREEN ================= */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="w-full max-w-sm space-y-4 p-6 border rounded-xl shadow">
          <h1 className="text-xl font-bold text-center">
            Accesso Gestionale
          </h1>

          <input
            type="email"
            placeholder="Email"
            className="w-full border p-3 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded"
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
            className="w-full bg-blue-700 text-white p-3 rounded font-bold"
          >
            Accedi
          </button>
        </div>
      </div>
    );
  }

  /* ================= APP VIEWS ================= */

  if (view === "dashboard") {
    return (
      <Dashboard
        user={user}
        goQueue={() => setView("queue")}
        goDetail={(id) => {
          setSelectedId(id);
          setView("detail");
        }}
        logout={() => signOut(auth)}
      />
    );
  }

  if (view === "queue") {
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
  }

  return (
    <ClientDetail
      user={user}
      clientId={selectedId!}
      goBack={() => setView("dashboard")}
    />
  );
}