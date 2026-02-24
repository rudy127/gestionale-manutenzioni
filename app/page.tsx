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

interface Maintenance {
  date: string;
}

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
  history?: Maintenance[];
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

function calculateNextDate(intervalValue: number, intervalType: "days" | "months") {
  if (intervalType === "days") {
    return addBusinessDays(new Date(), intervalValue);
  } else {
    return addBusinessDays(new Date(), intervalValue * 22);
  }
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

    const maintenanceDate = calculateNextDate(
      form.intervalValue,
      form.intervalType
    );

    await addDoc(collection(db, "clients"), {
      code: generateCode(),
      ...form,
      maintenanceDate: maintenanceDate.toISOString(),
      history: [],
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
      history: [
        ...(client.history || []),
        { date: new Date().toISOString() },
      ],
    });

    fetchClients();
  };

  const getDaysDiff = (date: string) =>
    (new Date(date).getTime() - new Date().getTime()) /
    (1000 * 60 * 60 * 24);

  const expiredCount = useMemo(
    () => clients.filter((c) => getDaysDiff(c.maintenanceDate) <= 0).length,
    [clients]
  );

  if (!selectedClient) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-extrabold text-center">
          Gestionale Manutenzioni
        </h1>

        {expiredCount > 0 && (
          <div className="bg-red-700 text-white p-4 rounded-xl text-center font-extrabold text-lg">
            ⚠️ {expiredCount} MANUTENZIONI SCADUTE
          </div>
        )}

        <input
          className="w-full border-2 border-black p-3 rounded-xl text-lg"
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-4">
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
                className="p-6 bg-black text-white rounded-2xl shadow-xl cursor-pointer border-4 border-yellow-400"
              >
                <div className="text-2xl font-extrabold">
                  {client.code} - {client.name}
                </div>
                <div className="text-xl font-bold text-yellow-400 mt-2">
                  PROX MANUT.: {new Date(
                    client.maintenanceDate
                  ).toLocaleDateString()}
                </div>
              </div>
            ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4 border-2 border-black">
          <h2 className="text-2xl font-extrabold">Nuovo Cliente</h2>

          <input
            className="w-full border-2 border-black p-3 rounded-xl text-lg"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="w-full border-2 border-black p-3 rounded-xl text-lg"
            placeholder="Telefono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            className="w-full border-2 border-black p-3 rounded-xl text-lg"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="w-full border-2 border-black p-3 rounded-xl text-lg"
            placeholder="Indirizzo"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <textarea
            className="w-full border-2 border-black p-3 rounded-xl text-lg"
            placeholder="Lavoro"
            value={form.job}
            onChange={(e) => setForm({ ...form, job: e.target.value })}
          />

          <div className="flex gap-3">
            <input
              type="number"
              className="w-1/2 border-2 border-black p-3 rounded-xl text-lg"
              value={form.intervalValue}
              onChange={(e) =>
                setForm({ ...form, intervalValue: Number(e.target.value) })
              }
            />

            <select
              className="w-1/2 border-2 border-black p-3 rounded-xl text-lg"
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
            className="w-full bg-green-700 text-white p-4 rounded-xl text-xl font-bold"
          >
            SALVA CLIENTE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-gray-100 min-h-screen">
      <button
        onClick={() => setSelectedClient(null)}
        className="bg-black text-white p-3 rounded-xl text-lg font-bold"
      >
        ← TORNA
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4 border-2 border-black">
        <h2 className="text-3xl font-extrabold">
          {selectedClient.code} - {selectedClient.name}
        </h2>

        <p className="text-xl font-bold text-yellow-600">
          PROX MANUT.: {new Date(
            selectedClient.maintenanceDate
          ).toLocaleDateString()}
        </p>

        <button
          onClick={() => confirmMaintenance(selectedClient)}
          className="w-full bg-green-700 text-white p-4 rounded-xl text-xl font-bold"
        >
          CONFERMA MANUTENZIONE
        </button>
      </div>
    </div>
  );
}
