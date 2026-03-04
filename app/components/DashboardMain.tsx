"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  phonePrefill: string;
  goQueue: () => void;
  goDetail: (id: string) => void;
  logout: () => void;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  maintenanceDate: string;
  intervalValue: number;
  intervalType: "months" | "days";
}

export default function DashboardMain({
  user,
  phonePrefill,
  goQueue,
  goDetail,
  logout,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: phonePrefill || "",
    email: "",
    address: "",
    job: "",
    intervalValue: 6,
    intervalType: "months" as "months" | "days",
  });

  /* ================= PREFILL TELEFONO ================= */

  useEffect(() => {
    if (phonePrefill) {
      setForm((f) => ({ ...f, phone: phonePrefill }));
    }
  }, [phonePrefill]);

  /* ================= LOAD CLIENTI ================= */

  const loadClients = async () => {
    const q = query(
      collection(db, "clients"),
      where("ownerId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const list: Client[] = [];

    snap.forEach((d) => {
      const data = d.data() as Client;
      list.push({ ...data, id: d.id });
    });

    setClients(list);
  };

  useEffect(() => {
    loadClients();
  }, []);

  /* ================= CONTATORI ================= */

  const getDaysDiff = (date: string) =>
    Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const red = clients.filter((c) => getDaysDiff(c.maintenanceDate) <= 0).length;

  const orange = clients.filter(
    (c) =>
      getDaysDiff(c.maintenanceDate) > 0 &&
      getDaysDiff(c.maintenanceDate) <= 7
  ).length;

  const yellow = clients.filter(
    (c) =>
      getDaysDiff(c.maintenanceDate) > 7 &&
      getDaysDiff(c.maintenanceDate) <= 14
  ).length;

  /* ================= AGGIUNGI CLIENTE ================= */

  const addClient = async () => {
    if (!form.name) return;

    const nextDate = new Date();

    if (form.intervalType === "months") {
      nextDate.setMonth(nextDate.getMonth() + form.intervalValue);
    } else {
      nextDate.setDate(nextDate.getDate() + form.intervalValue);
    }

    await addDoc(collection(db, "clients"), {
      ...form,
      maintenanceDate: nextDate.toISOString(),
      ownerId: user.uid,
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

    loadClients();
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* CONTATORI */}

      <div className="flex gap-4 font-bold text-white">
        <div className="bg-red-700 px-4 py-2 rounded">🔴 {red}</div>
        <div className="bg-orange-600 px-4 py-2 rounded">🟠 {orange}</div>
        <div className="bg-yellow-400 text-black px-4 py-2 rounded">
          🟡 {yellow}
        </div>
      </div>

      {/* CODA MANUTENZIONI */}

      <button
        onClick={goQueue}
        className="bg-blue-700 text-white px-4 py-2 rounded"
      >
        Vai alla Coda Manutenzioni
      </button>

      {/* LISTA CLIENTI */}

      <div className="space-y-2">
        {clients.map((c) => (
          <div
            key={c.id}
            onClick={() => goDetail(c.id)}
            className="p-3 bg-green-700 text-white rounded cursor-pointer"
          >
            {c.name}
          </div>
        ))}
      </div>

      {/* NUOVO CLIENTE */}

      <div className="border-2 border-black p-4 rounded space-y-2">
        <h2 className="text-lg font-bold">Nuovo Cliente</h2>

        <input
          className="w-full border p-2 rounded"
          placeholder="Nome"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Telefono"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Indirizzo"
          value={form.address}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder="Lavoro eseguito"
          value={form.job}
          onChange={(e) =>
            setForm({ ...form, job: e.target.value })
          }
        />

        <button
          onClick={addClient}
          className="w-full bg-green-700 text-white py-2 rounded font-bold"
        >
          Salva Cliente
        </button>
      </div>
    </div>
  );
}