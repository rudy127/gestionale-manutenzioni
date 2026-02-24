"use client";

import { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

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
  monthsInterval: number;
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

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "expired" | "7" | "14">("all");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    job: "",
    monthsInterval: 6,
  });

  const fetchClients = async () => {
    const querySnapshot = await getDocs(collection(db, "clients"));
    const list: Client[] = [];
    querySnapshot.forEach((docSnap) => {
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

    const maintenanceDate = addBusinessDays(new Date(), form.monthsInterval * 22);

    const newClient: Client = {
      code: generateCode(),
      ...form,
      maintenanceDate: maintenanceDate.toISOString(),
    };

    await addDoc(collection(db, "clients"), newClient);

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      job: "",
      monthsInterval: 6,
    });

    fetchClients();
  };

  const confirmMaintenance = async (client: Client) => {
    const newDate = addBusinessDays(new Date(), client.monthsInterval * 22);

    await updateDoc(doc(db, "clients", client.id!), {
      maintenanceDate: newDate.toISOString(),
    });

    fetchClients();
  };

  const deleteClient = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, "clients", id));
    setSelectedClient(null);
    fetchClients();
  };

  const getDaysDiff = (date: string) => {
    return (
      (new Date(date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
    );
  };

  const stats = useMemo(() => {
    let expired = 0;
    let seven = 0;
    let fourteen = 0;

    clients.forEach((c) => {
      const diff = getDaysDiff(c.maintenanceDate);
      if (diff <= 0) expired++;
      else if (diff <= 7) seven++;
      else if (diff <= 14) fourteen++;
    });

    return { expired, seven, fourteen };
  }, [clients]);

  const getStatusColor = (date: string) => {
    const diff = getDaysDiff(date);
    if (diff <= 0) return "bg-red-500";
    if (diff <= 7) return "bg-orange-500";
    if (diff <= 14) return "bg-yellow-400";
    return "bg-green-500";
  };

  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => {
        const diff = getDaysDiff(c.maintenanceDate);
        if (filter === "expired") return diff <= 0;
        if (filter === "7") return diff > 0 && diff <= 7;
        if (filter === "14") return diff > 7 && diff <= 14;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.maintenanceDate).getTime() -
          new Date(b.maintenanceDate).getTime()
      );
  }, [clients, search, filter]);

  if (!selectedClient) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">
          Gestionale Manutenzioni Online
        </h1>

        <div className="grid grid-cols-3 gap-3 text-white font-bold">
          <div className="bg-red-600 p-3 rounded text-center">🔴 {stats.expired} Scaduti</div>
          <div className="bg-orange-500 p-3 rounded text-center">🟠 {stats.seven} Entro 7gg</div>
          <div className="bg-yellow-500 p-3 rounded text-center">🟡 {stats.fourteen} Entro 14gg</div>
        </div>

        <input
          className="w-full border p-2 rounded"
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("all")} className="bg-gray-600 text-white px-3 py-1 rounded">Tutti</button>
          <button onClick={() => setFilter("expired")} className="bg-red-600 text-white px-3 py-1 rounded">Scaduti</button>
          <button onClick={() => setFilter("7")} className="bg-orange-500 text-white px-3 py-1 rounded">7 giorni</button>
          <button onClick={() => setFilter("14")} className="bg-yellow-500 text-white px-3 py-1 rounded">14 giorni</button>
        </div>

        <div className="space-y-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`p-4 text-white rounded-xl shadow cursor-pointer ${getStatusColor(client.maintenanceDate)}`}
            >
              <div className="font-bold">
                {client.code} - {client.name}
              </div>
              <div className="text-sm">
                Prox manut.: {new Date(client.maintenanceDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow space-y-3">
          <h2 className="font-bold">Nuovo Cliente</h2>

          <input className="w-full border p-2 rounded" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Indirizzo" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <textarea className="w-full border p-2 rounded" placeholder="Lavoro" value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} />

          <label className="font-semibold">Prox manut. (mesi)</label>
          <input type="number" className="w-full border p-2 rounded" value={form.monthsInterval} onChange={(e) => setForm({ ...form, monthsInterval: Number(e.target.value) })} />

          <button onClick={addClient} className="w-full bg-green-600 text-white p-2 rounded">
            Salva Cliente Online
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => setSelectedClient(null)} className="bg-gray-700 text-white p-2 rounded">
        ← Torna
      </button>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-2xl font-bold">
          {selectedClient.code} - {selectedClient.name}
        </h2>

        <p><strong>Telefono:</strong> <a href={`tel:${selectedClient.phone}`} className="text-blue-600 underline">{selectedClient.phone}</a></p>
        <p><strong>WhatsApp:</strong> <a href={`https://wa.me/${selectedClient.phone}`} target="_blank" className="text-green-600 underline">Apri chat</a></p>
        <p><strong>Email:</strong> <a href={`mailto:${selectedClient.email}`} className="text-blue-600 underline">{selectedClient.email}</a></p>
        <p><strong>Indirizzo:</strong> {selectedClient.address}</p>
        <p><strong>Lavoro:</strong> {selectedClient.job}</p>
        <p><strong>Prox manut.:</strong> {new Date(selectedClient.maintenanceDate).toLocaleDateString()}</p>

        <button onClick={() => confirmMaintenance(selectedClient)} className="w-full bg-green-600 text-white p-2 rounded">
          Conferma Manutenzione
        </button>

        <button onClick={() => deleteClient(selectedClient.id)} className="w-full bg-red-600 text-white p-2 rounded">
          Elimina Cliente
        </button>
      </div>
    </div>
  );
}