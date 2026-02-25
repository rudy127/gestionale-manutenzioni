"use client";

import { useState, useEffect, useMemo } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnduh9NKI2AqTn4rFC0kKTsIGCm6Ip7SY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "1:679882450882:web:85857ff10ae54794a5585b",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

interface Client {
  id?: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  intervalValue: number;
  intervalType: "days" | "months";
  maintenanceDate: string;
  ownerId: string;
}

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function calculateNextDate(value: number, type: "days" | "months") {
  if (type === "days") return addBusinessDays(new Date(), value);
  return addBusinessDays(new Date(), value * 22);
}

export default function Home() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    job: "",
    intervalValue: 6,
    intervalType: "months" as "days" | "months",
  });

  const [auth, setAuth] = useState<any>(null);

  // ✅ Initialize Auth in useEffect (client-side only)
  useEffect(() => {
    const firebaseAuth = getAuth(app);
    setAuth(firebaseAuth);

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) {
        fetchClients(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchClients = async (uid: string) => {
    const q = query(collection(db, "clients"), where("ownerId", "==", uid));
    const snapshot = await getDocs(q);
    const list: Client[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Client) });
    });
    setClients(list);
  };

  const generateCode = () =>
    "A" + (clients.length + 1).toString().padStart(3, "0");

  const addClient = async () => {
    if (!form.name || !authUser) return;

    const nextDate = calculateNextDate(
      form.intervalValue,
      form.intervalType
    );

    await addDoc(collection(db, "clients"), {
      code: generateCode(),
      ...form,
      maintenanceDate: nextDate.toISOString(),
      ownerId: authUser.uid,
    });

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      job: "",
      intervalValue: 6,
      intervalType: "months",
    });

    fetchClients(authUser.uid);
  };

  const confirmMaintenance = async (client: Client) => {
    const newDate = calculateNextDate(
      client.intervalValue,
      client.intervalType
    );
    await updateDoc(doc(db, "clients", client.id!), {
      maintenanceDate: newDate.toISOString(),
    });
    fetchClients(authUser!.uid);
  };

  const deleteClient = async (client: Client) => {
    if (!confirm("Eliminare questo cliente?")) return;
    await deleteDoc(doc(db, "clients", client.id!));
    fetchClients(authUser!.uid);
    setSelectedClient(null);
  };

  const getDaysDiff = (date: string) =>
    Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const stats = useMemo(() => {
    let expired = 0;
    let soon = 0;
    let upcoming = 0;

    clients.forEach((c) => {
      const diff = getDaysDiff(c.maintenanceDate);
      if (diff <= 0) expired++;
      else if (diff <= 7) soon++;
      else if (diff <= 14) upcoming++;
    });

    return { expired, soon, upcoming };
  }, [clients]);

  if (!authReady) return <div>Caricamento...</div>;

  // 🔐 Login Page
  if (!authUser) {
    return (
      <div className="p-6 max-w-sm mx-auto space-y-4 bg-white min-h-screen">
        <h1 className="text-lg font-bold text-center">Accesso Gestionale</h1>

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-2 rounded"
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
          className="w-full bg-blue-600 text-white p-2 rounded font-bold"
        >
          Accedi
        </button>
      </div>
    );
  }

  // 🏠 Main App
  if (!selectedClient) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4 bg-white min-h-screen">
        <div className="flex justify-between">
          <h1 className="text-lg font-bold">Gestionale Manutenzioni</h1>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-red-600 underline"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-bold text-white">
          <div className="bg-red-600 p-2 rounded text-center">
            🔴 {stats.expired}
          </div>
          <div className="bg-orange-500 p-2 rounded text-center">
            🟠 {stats.soon}
          </div>
          <div className="bg-yellow-400 text-black p-2 rounded text-center">
            🟡 {stats.upcoming}
          </div>
        </div>

        <input
          className="w-full border p-2 rounded text-sm"
          placeholder="Cerca cliente..."
        />
      </div>
    );
  }

  return <div>Pagina cliente selezionato (da completare)</div>;
}