"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  goQueue: (type: string) => void;
  goDetail: (id: string) => void;
  goCalendar: () => void;
  goAgenda: () => void;
  logout: () => void;
}

interface Client {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  maintenanceDate: string;
}

export default function DashboardMain({
  goQueue,
  goDetail,
  goCalendar,
  goAgenda,
  logout,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [phoneLookup, setPhoneLookup] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [job, setJob] = useState("");

  const load = async () => {
    const snap = await getDocs(collection(db, "clients"));
    const list: Client[] = [];

    snap.forEach((d) => {
      const data = d.data() as Client;
      list.push({ ...data, id: d.id });
    });

    list.sort(
      (a, b) =>
        new Date(a.maintenanceDate).getTime() -
        new Date(b.maintenanceDate).getTime()
    );

    setClients(list);
  };

  useEffect(() => {
    load();
  }, []);

  const addClient = async () => {
    if (!name) return;

    await addDoc(collection(db, "clients"), {
      name,
      phone,
      email,
      address,
      job,
      maintenanceDate: new Date().toISOString(),
      history: [],
    });

    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setJob("");

    load();
  };

  const searchPhone = () => {
    const clean = phoneLookup.replace(/\s/g, "");

    const found = clients.find(
      (c) => c.phone?.replace(/\s/g, "") === clean
    );

    if (found) {
      goDetail(found.id!);
      return;
    }

    setPhone(phoneLookup);
    alert("Numero non presente. Puoi creare il cliente.");
  };

  const getDays = (date: string) =>
    Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const red = clients.filter((c) => getDays(c.maintenanceDate) <= 0).length;

  const orange = clients.filter(
    (c) => getDays(c.maintenanceDate) > 0 && getDays(c.maintenanceDate) <= 7
  ).length;

  const yellow = clients.filter(
    (c) => getDays(c.maintenanceDate) > 7 && getDays(c.maintenanceDate) <= 14
  ).length;

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Gestionale Clienti</h1>
        <button onClick={logout} className="border px-3 py-1 rounded">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => goQueue("red")}
          className="bg-red-600 text-white p-3 rounded font-bold"
        >
          🔴 {red}
        </button>

        <button
          onClick={() => goQueue("orange")}
          className="bg-orange-500 text-white p-3 rounded font-bold"
        >
          🟠 {orange}
        </button>

        <button
          onClick={() => goQueue("yellow")}
          className="bg-yellow-400 p-3 rounded font-bold"
        >
          🟡 {yellow}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <button
            onClick={goCalendar}
            className="border p-2 rounded w-full"
          >
            Calendario manutenzioni
          </button>

          <button
            onClick={goAgenda}
            className="border p-2 rounded w-full"
          >
            Giro manutenzioni oggi
          </button>

          <div className="border p-3 rounded space-y-2">
            <h2 className="font-bold">Ricerca telefono</h2>

            <input
              placeholder="Numero telefono"
              value={phoneLookup}
              onChange={(e) => setPhoneLookup(e.target.value)}
              className="border p-2 w-full"
            />

            <button
              onClick={searchPhone}
              className="bg-blue-700 text-white p-2 rounded w-full"
            >
              Cerca cliente
            </button>
          </div>

          <input
            placeholder="Cerca cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 w-full"
          />

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="border p-3 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => goDetail(c.id!)}
              >
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-500">{c.phone}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border p-4 rounded space-y-2">
          <h2 className="font-bold">Nuovo Cliente</h2>

          <input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full"
          />

          <input
            placeholder="Telefono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 w-full"
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full"
          />

          <input
            placeholder="Indirizzo"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border p-2 w-full"
          />

          <textarea
            placeholder="Tipo lavoro"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            className="border p-2 w-full"
          />

          <button
            onClick={addClient}
            className="bg-green-700 text-white p-2 rounded w-full"
          >
            Salva cliente
          </button>
        </div>
      </div>
    </div>
  );
}