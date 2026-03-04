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

import DashboardMain from "./components/DashboardMain";
import Queue from "./components/Queue";
import ClientDetail from "./components/ClientDetail";
import Calendar from "./components/Calendar";

const firebaseConfig = {
  apiKey: "APIKEY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "APPID",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
const auth = getAuth(app);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const [view, setView] = useState<
    "dashboard" | "queue" | "detail" | "calendar"
  >("dashboard");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) return <div className="p-10">Caricamento...</div>;

  if (!user) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center min-h-screen">
        <h1 className="text-xl font-bold">Login Gestionale</h1>

        <input
          className="border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() =>
            signInWithEmailAndPassword(auth, email, password)
          }
        >
          Accedi
        </button>
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <DashboardMain
        user={user}
        goQueue={(type) => {
          setQueueFilter(type);
          setView("queue");
        }}
        goDetail={(id) => {
          setSelectedId(id);
          setView("detail");
        }}
        goCalendar={() => setView("calendar")}
        logout={() => signOut(auth)}
      />
    );
  }

  if (view === "queue") {
    return (
      <Queue
        user={user}
        filter={queueFilter}
        goBack={() => setView("dashboard")}
        goDetail={(id) => {
          setSelectedId(id);
          setView("detail");
        }}
      />
    );
  }

  if (view === "calendar") {
    return (
      <Calendar
        user={user}
        goBack={() => setView("dashboard")}
        goDetail={(id) => {
          setSelectedId(id);
          setView("detail");
        }}
      />
    );
  }

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