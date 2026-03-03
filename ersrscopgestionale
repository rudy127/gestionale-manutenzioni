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
  intervalValue: number;
  intervalType: "months" | "days";
  history?: HistoryEntry[];
}

interface Props {
  user: User;
  clientId: string;
  goBack: () => void;
}

function calculateNextDate(value: number, type: "months" | "days") {
  const base = new Date();

  if (type === "months") {
    const d = new Date(base);
    d.setMonth(base.getMonth() + value);
    return d;
  }

  return new Date(base.getTime() + value * 86400000);
}

export default function ClientDetail({
  clientId,
  goBack,
}: Props) {
  const [client, setClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState("");

  const loadClient = async () => {
    const snap = await getDoc(doc(db, "clients", clientId));

    if (snap.exists()) {
      const data = snap.data() as Omit<Client, "id">;
      setClient({ ...data, id: snap.id });
    }
  };

  useEffect(() => {
    loadClient();
  }, [clientId]);

  if (!client) return <div className="p-6">Caricamento...</div>;

  const addNote = async () => {
    if (!newNote.trim()) return;

    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      note: newNote,
    };

    await updateDoc(doc(db, "clients", client.id), {
      history: arrayUnion(entry),
    });

    setNewNote("");
    loadClient();
  };

  const confirmMaintenance = async () => {
    const nextDate = calculateNextDate(
      client.intervalValue,
      client.intervalType
    );

    await updateDoc(doc(db, "clients", client.id), {
      maintenanceDate: nextDate.toISOString(),
    });

    loadClient();
  };

  const deleteClient = async () => {
    const ok = confirm(
      "Sei sicuro di voler eliminare definitivamente questo cliente?"
    );

    if (!ok) return;

    await deleteDoc(doc(db, "clients", client.id));

    goBack();
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 space-y-6">
      <button
        onClick={goBack}
        className="bg-gray-800 text-white px-4 py-2 rounded font-bold"
      >
        ← Torna
      </button>

      <h1 className="text-2xl font-bold">{client.name}</h1>

      <div className="space-y-2">
        <div><strong>Telefono:</strong> {client.phone}</div>
        <div><strong>Email:</strong> {client.email}</div>
        <div><strong>Indirizzo:</strong> {client.address}</div>
        <div><strong>Lavoro svolto:</strong> {client.job}</div>
      </div>

      <div>
        <strong>Prossima manutenzione:</strong>{" "}
        {new Date(client.maintenanceDate).toLocaleDateString()}
      </div>

      <button
        onClick={confirmMaintenance}
        className="bg-green-700 text-white px-4 py-2 rounded font-bold w-full"
      >
        Conferma Manutenzione
      </button>

      <div className="border p-4 rounded space-y-3">
        <h2 className="font-bold">Storico interventi</h2>

        {client.history?.map((h, i) => (
          <div key={i} className="border p-2 rounded">
            <div className="text-xs text-gray-600">
              {new Date(h.date).toLocaleString()}
            </div>
            <div>{h.note}</div>
          </div>
        ))}

        <textarea
          className="border p-2 w-full"
          placeholder="Aggiungi nota"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />

        <button
          onClick={addNote}
          className="bg-blue-700 text-white px-4 py-2 rounded font-bold w-full"
        >
          Aggiungi Nota
        </button>
      </div>

      <button
        onClick={deleteClient}
        className="bg-red-700 text-white px-4 py-2 rounded font-bold w-full"
      >
        Elimina Cliente
      </button>
    </div>
  );
}