"use client";

import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import DashboardMain from "./components/DashboardMain";
import Queue from "./components/Queue";
import ClientDetail from "./components/ClientDetail";
import Calendar from "./components/Calendar";
import Agenda from "./components/Agenda";

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

export default function Home() {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [view, setView] = useState<
    "dashboard" | "queue" | "detail" | "calendar" | "agenda"
  >("dashboard");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<string | null>(null);
  const [phoneParam, setPhoneParam] = useState<string | null>(null);

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");

    if (phone) setPhoneParam(phone);

  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();

  }, []);

  const handleLogin = async () => {

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert("Errore login: " + error.message);
    }

  };

  if (loading) return <div className="p-10">Caricamento...</div>;

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
          className="bg-blue-600 text-white p-2 rounded"
          onClick={handleLogin}
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
        phonePrefill={phoneParam}
        goQueue={(type) => {
          setQueueFilter(type);
          setView("queue");
        }}
        goDetail={(id) => {
          setSelectedId(id);
          setView("detail");
        }}
        goCalendar={() => setView("calendar")}
        goAgenda={() => setView("agenda")}
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

  if (view === "agenda") {

    return (

      <Agenda
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