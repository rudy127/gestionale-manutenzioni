"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  clientId: string;
  goBack: () => void;
}

interface HistoryEntry {
  date: string;
  note: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  maintenanceDate: string;
  history?: HistoryEntry[];
}

export default function ClientDetail({ user, clientId, goBack }: Props) {
  const [client, setClient] = useState<Client | null>(null);
  const [note, setNote] = useState("");
  const [nextDate, setNextDate] = useState("");

  const load = async () => {
    const snap = await getDoc(doc(db, "clients", clientId));

    if (snap.exists()) {
      const data = snap.data() as Client;

      setClient({ ...data, id: snap.id });

      setNextDate(data.maintenanceDate?.split("T")[0] || "");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addNote = async () => {
    if (!client || !note) return;

    const entry = {
      date: new Date().toISOString(),
      note,
    };

    await updateDoc(doc(db, "clients", client.id), {
      history: arrayUnion(entry),
      maintenanceDate: nextDate,
    });

    setNote("");

    load();
  };

  const deleteClient = async () => {
    if (!client) return;

    if (!confirm("Eliminare cliente?")) return;

    await deleteDoc(doc(db, "clients", client.id));

    goBack();
  };

  if (!client) return <div>Caricamento...</div>;

  return (
    <div className="p-4 space-y-3">

      <button onClick={goBack} className="border p-2 rounded">
        ← Torna
      </button>

      <h1 className="text-xl font-bold">{client.name}</h1>

      <div>Telefono: {client.phone}</div>
      <div>Email: {client.email}</div>
      <div>Indirizzo: {client.address}</div>

      <div>
        <strong>Lavoro:</strong> {client.job}
      </div>

      <textarea
        placeholder="Nota intervento"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        type="date"
        value={nextDate}
        onChange={(e) => setNextDate(e.target.value)}
        className="border p-2"
      />

      <button
        onClick={addNote}
        className="bg-blue-700 text-white p-2 rounded w-full"
      >
        Salva nota
      </button>

      <button
        onClick={deleteClient}
        className="bg-red-700 text-white p-2 rounded w-full"
      >
        Elimina cliente
      </button>

    </div>
  );
}