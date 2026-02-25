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
  const [auth, setAuth] = useState<any>(null);

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

  useEffect(() => {
    const firebaseAuth = getAuth(app);
    setAuth(firebaseAuth);

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) fetchClients(user.uid);
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

    const nextDate = calculateNextDate(form.intervalValue, form.intervalType);

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

  const getCardColor = (date: string) => {
    const diff = getDaysDiff(date);
    if (diff <= 0) return "bg-red-600";
    if (diff <= 7) return "bg-orange-500";
    if (diff <= 14) return "bg-yellow-400 text-black";
    return "bg-green-600";
  };

  if (!authReady) return <div className="p-4">Caricamento...</div>;

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

  if (!selectedClient) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4 bg-white min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Gestionale Manutenzioni</h1>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-red-600 underline"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-bold text-white">
          <div className="bg-red-600 p-2 rounded text-center">🔴 {stats.expired}</div>
          <div className="bg-orange-500 p-2 rounded text-center">🟠 {stats.soon}</div>
          <div className="bg-yellow-400 text-black p-2 rounded text-center">🟡 {stats.upcoming}</div>
        </div>

        <input
          className="w-full border p-2 rounded text-sm"
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-2">
          {clients
            .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
            .sort(
              (a, b) =>
                new Date(a.maintenanceDate).getTime() -
                new Date(b.maintenanceDate).getTime()
            )
            .map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-3 rounded text-white text-sm font-semibold ${getCardColor(
                  client.maintenanceDate
                )}`}
              >
                {client.code} - {client.name}
                <div className="text-xs">
                  Prox manut.: {new Date(client.maintenanceDate).toLocaleDateString()} ({getDaysDiff(client.maintenanceDate)} gg)
                </div>
              </div>
            ))}
        </div>

        <div className="border p-3 rounded space-y-2">
          <h2 className="text-sm font-bold">Nuovo Cliente</h2>

          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Telefono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Indirizzo"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <textarea
            className="w-full border p-2 rounded text-sm"
            placeholder="Lavoro"
            value={form.job}
            onChange={(e) => setForm({ ...form, job: e.target.value })}
          />

          <div className="flex gap-2">
            <input
              type="number"
              className="w-1/2 border p-2 rounded text-sm"
              value={form.intervalValue}
              onChange={(e) =>
                setForm({ ...form, intervalValue: Number(e.target.value) })
              }
            />

            <select
              className="w-1/2 border p-2 rounded text-sm"
              value={form.intervalType}
              onChange={(e) =>
                setForm({
                  ...form,
                  intervalType: e.target.value as "days" | "months",
                })
              }
            >
              <option value="months">Mesi</option>
              <option value="days">Giorni</option>
            </select>
          </div>

          <button
            onClick={addClient}
            className="w-full bg-green-600 text-white p-2 rounded text-sm font-bold"
          >
            Salva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4 bg-white min-h-screen">
      <button
        onClick={() => setSelectedClient(null)}
        className="bg-gray-700 text-white p-2 rounded text-sm"
      >
        ← Torna
      </button>

      <div className="border p-3 rounded space-y-3">
        <h2 className="text-lg font-bold">
          {selectedClient.code} - {selectedClient.name}
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${selectedClient.phone}`}
            className="bg-blue-600 text-white p-2 rounded text-center text-sm font-bold"
          >
            📞 Chiama
          </a>

          <a
            href={`https://wa.me/${selectedClient.phone}`}
            target="_blank"
            className="bg-green-600 text-white p-2 rounded text-center text-sm font-bold"
          >
            💬 WhatsApp
          </a>

          <a
            href={`mailto:${selectedClient.email}`}
            className="bg-gray-700 text-white p-2 rounded text-center text-sm font-bold"
          >
            ✉️ Email
          </a>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedClient.address)}`}
            target="_blank"
            className="bg-yellow-400 text-black p-2 rounded text-center text-sm font-bold"
          >
            📍 Maps
          </a>
        </div>

        <p className="text-sm font-bold text-red-600">
          Prox manut.: {new Date(selectedClient.maintenanceDate).toLocaleDateString()} ({getDaysDiff(selectedClient.maintenanceDate)} gg)
        </p>

        <button
          onClick={() => confirmMaintenance(selectedClient)}
          className="w-full bg-green-600 text-white p-2 rounded text-sm font-bold"
        >
          Conferma manutenzione
        </button>

        <button
          onClick={() => deleteClient(selectedClient)}
          className="w-full bg-red-600 text-white p-2 rounded text-sm font-bold"
        >
          Elimina cliente
        </button>
      </div>
    </div>
  );
}
