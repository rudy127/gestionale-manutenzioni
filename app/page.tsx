"use client";

import { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnduh9NKI2AqTn4rFC0kKTsIGCm6Ip7SY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "1:679882450882:web:85857ff10ae54794a5585b",
};

const app = initializeApp(firebaseConfig);
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
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    job: "",
    intervalValue: 6,
    intervalType: "months" as "days" | "months",
  });

  const fetchClients = async () => {
    const snapshot = await getDocs(collection(db, "clients"));
    const list: Client[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Client) });
    });
    setClients(list);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const generateCode = () =>
    "A" + (clients.length + 1).toString().padStart(3, "0");

  const addClient = async () => {
    if (!form.name) return;

    const nextDate = calculateNextDate(form.intervalValue, form.intervalType);

    await addDoc(collection(db, "clients"), {
      code: generateCode(),
      ...form,
      maintenanceDate: nextDate.toISOString(),
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

    fetchClients();
  };

  const confirmMaintenance = async (client: Client) => {
    const newDate = calculateNextDate(
      client.intervalValue,
      client.intervalType
    );

    await updateDoc(doc(db, "clients", client.id!), {
      maintenanceDate: newDate.toISOString(),
    });

    fetchClients();
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

  if (!selectedClient) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4 bg-white min-h-screen">
        <h1 className="text-2xl font-bold text-center text-black">
          Gestionale Manutenzioni
        </h1>

        <div className="grid grid-cols-3 gap-2 text-white text-sm font-bold">
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
          className="w-full border-2 border-black p-2 rounded text-sm text-black placeholder:text-gray-500"
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-2">
          {clients
            .filter((c) =>
              c.name.toLowerCase().includes(search.toLowerCase())
            )
            .sort(
              (a, b) =>
                new Date(a.maintenanceDate).getTime() -
                new Date(b.maintenanceDate).getTime()
            )
            .map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-3 rounded-lg text-black text-sm font-semibold shadow border-2 border-black ${getCardColor(
                  client.maintenanceDate
                )}`}
              >
                <div>
                  {client.code} - {client.name}
                </div>
                <div className="text-xs">
                  Prox manut.: {new Date(
                    client.maintenanceDate
                  ).toLocaleDateString()} ({getDaysDiff(
                    client.maintenanceDate
                  )} gg)
                </div>
              </div>
            ))}
        </div>

        <div className="bg-white p-4 rounded-lg shadow space-y-2 border-2 border-black text-black">
          <h2 className="font-bold text-sm">Nuovo Cliente</h2>

          <input
            className="w-full border-2 border-black p-2 rounded text-sm text-black placeholder:text-gray-500"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <textarea
            className="w-full border-2 border-black p-2 rounded text-sm text-black placeholder:text-gray-500"
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

      <div className="bg-white p-4 rounded-lg shadow space-y-2 border-2 border-black text-black">
        <h2 className="text-lg font-bold">
          {selectedClient.code} - {selectedClient.name}
        </h2>

        <p className="text-sm">
          Prox manut.: {new Date(
            selectedClient.maintenanceDate
          ).toLocaleDateString()} ({getDaysDiff(
            selectedClient.maintenanceDate
          )} gg)
        </p>

        <button
          onClick={() => confirmMaintenance(selectedClient)}
          className="w-full bg-green-600 text-white p-2 rounded text-sm font-bold"
        >
          Conferma manutenzione
        </button>
      </div>
    </div>
  );
}
