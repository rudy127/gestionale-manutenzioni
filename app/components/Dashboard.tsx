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
  ownerId: string;
}

interface Props {
  user: User;
  goQueue: () => void;
  goDetail: (id: string) => void;
  logout: () => void;
}

const daysDiff = (date: string) =>
  Math.ceil(
    (new Date(date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

function calculateNextDate(value: number, type: "months" | "days") {
  const base = new Date();

  if (type === "months") {
    const d = new Date(base);
    d.setMonth(base.getMonth() + value);
    return d;
  }

  return new Date(base.getTime() + value * 86400000);
}

export default function Dashboard({
  user,
  goQueue,
  goDetail,
  logout,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    job: "",
    intervalValue: 6,
    intervalType: "months" as "months" | "days",
  });

  const loadClients = async () => {
    const q = query(
      collection(db, "clients"),
      where("ownerId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const list: Client[] = [];

    snap.forEach((d) => {
      const data = d.data() as Omit<Client, "id">;
      list.push({ ...data, id: d.id });
    });

    setClients(list);
  };

  useEffect(() => {
    loadClients();
  }, [user]);

  const addClient = async () => {
    if (!form.name) {
      alert("Inserisci almeno il nome");
      return;
    }

    const nextDate = calculateNextDate(
      form.intervalValue,
      form.intervalType
    );

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

  const red = clients.filter((c) => daysDiff(c.maintenanceDate) <= 0).length;

  const orange = clients.filter(
    (c) =>
      daysDiff(c.maintenanceDate) > 0 &&
      daysDiff(c.maintenanceDate) <= 7
  ).length;

  const yellow = clients.filter(
    (c) =>
      daysDiff(c.maintenanceDate) > 7 &&
      daysDiff(c.maintenanceDate) <= 14
  ).length;

  return (
    <div className="min-h-screen bg-white text-black p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded font-bold"
        >
          Logout
        </button>
      </div>

      {/* CONTATORI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-700 text-white p-4 rounded-xl text-center font-bold">
          🔴 {red}
        </div>
        <div className="bg-orange-500 text-white p-4 rounded-xl text-center font-bold">
          🟠 {orange}
        </div>
        <div className="bg-yellow-400 text-black p-4 rounded-xl text-center font-bold">
          🟡 {yellow}
        </div>
      </div>

      <button
        onClick={goQueue}
        className="bg-blue-700 text-white px-4 py-2 rounded font-bold"
      >
        Vai alla Coda Manutenzioni
      </button>

      {/* NUOVO CLIENTE */}
      <div className="border p-4 rounded space-y-3">
        <h2 className="text-lg font-bold">Nuovo Cliente</h2>

        <input
          className="border p-2 w-full"
          placeholder="Nome"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Telefono"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Indirizzo"
          value={form.address}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Lavoro svolto"
          value={form.job}
          onChange={(e) =>
            setForm({ ...form, job: e.target.value })
          }
        />

        <div className="flex gap-2">
          <input
            type="number"
            className="border p-2 w-24"
            value={form.intervalValue}
            onChange={(e) =>
              setForm({
                ...form,
                intervalValue: Number(e.target.value),
              })
            }
          />

          <select
            className="border p-2"
            value={form.intervalType}
            onChange={(e) =>
              setForm({
                ...form,
                intervalType: e.target.value as "months" | "days",
              })
            }
          >
            <option value="months">Mesi</option>
            <option value="days">Giorni</option>
          </select>
        </div>

        <button
          onClick={addClient}
          className="bg-green-700 text-white px-4 py-2 rounded font-bold w-full"
        >
          Salva Cliente
        </button>
      </div>

      {/* LISTA CLIENTI */}
      <div className="space-y-2">
        {clients.map((c) => (
          <div
            key={c.id}
            onClick={() => goDetail(c.id)}
            className="p-3 bg-green-700 text-white rounded cursor-pointer font-bold"
          >
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}