"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
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

export default function ClientDetail({ user, clientId, goBack }: Props) {
  const [client, setClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "clients", clientId));
      if (snap.exists()) {
        const data = snap.data() as Client;
        setClient({ ...data, id: snap.id });
      }
    };

    load();
  }, [clientId]);

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        Caricamento...
      </div>
    );
  }

  /* ================= AGGIUNGI NOTA ================= */

  const addNote = async () => {
    if (!newNote.trim()) return;

    const updatedHistory = [
      ...(client.history || []),
      {
        date: new Date().toISOString(),
        note: newNote,
      },
    ];

    await updateDoc(doc(db, "clients", clientId), {
      history: updatedHistory,
    });

    setClient({ ...client, history: updatedHistory });
    setNewNote("");
  };

  /* ================= CANCELLA NOTA ================= */

  const deleteNote = async (index: number) => {
    const updatedHistory = [...(client.history || [])];
    updatedHistory.splice(index, 1);

    await updateDoc(doc(db, "clients", clientId), {
      history: updatedHistory,
    });

    setClient({ ...client, history: updatedHistory });
  };

  /* ================= CONFERMA MANUTENZIONE ================= */

  const confirmMaintenance = async () => {
    const newDate = new Date();
    if (client.intervalType === "months") {
      newDate.setMonth(newDate.getMonth() + client.intervalValue);
    } else {
      newDate.setDate(newDate.getDate() + client.intervalValue);
    }

    await updateDoc(doc(db, "clients", clientId), {
      maintenanceDate: newDate.toISOString(),
    });

    setClient({
      ...client,
      maintenanceDate: newDate.toISOString(),
    });
  };

  /* ================= ELIMINA CLIENTE ================= */

  const deleteClient = async () => {
    const ok = confirm("Sei sicuro di voler eliminare questo cliente?");
    if (!ok) return;

    await deleteDoc(doc(db, "clients", clientId));
    goBack();
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 space-y-6">
      <button
        onClick={goBack}
        className="bg-gray-800 text-white px-4 py-2 rounded"
      >
        ← Torna
      </button>

      <h1 className="text-2xl font-bold">{client.name}</h1>

      <div className="space-y-2">
        <p><strong>Telefono:</strong> {client.phone}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <p><strong>Indirizzo:</strong> {client.address}</p>
        <p><strong>Lavoro eseguito:</strong> {client.job}</p>
      </div>

      <div>
        <p className="font-bold">
          Prossima manutenzione:
        </p>
        <p>
          {new Date(client.maintenanceDate).toLocaleDateString()}
        </p>
      </div>

      <button
        onClick={confirmMaintenance}
        className="w-full bg-green-700 text-white py-3 rounded font-bold"
      >
        Conferma Manutenzione
      </button>

      {/* ================= STORICO ================= */}

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Storico Interventi</h2>

        {(client.history || []).map((h, i) => (
          <div
            key={i}
            className="border p-3 rounded mb-2 flex justify-between items-center"
          >
            <div>
              <div className="text-sm text-gray-600">
                {new Date(h.date).toLocaleString()}
              </div>
              <div>{h.note}</div>
            </div>

            <button
              onClick={() => deleteNote(i)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              X
            </button>
          </div>
        ))}

        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="w-full border-2 border-black p-2 rounded mt-2"
          placeholder="Aggiungi nota / lavoro / misurazioni"
        />

        <button
          onClick={addNote}
          className="w-full bg-blue-700 text-white py-2 rounded mt-2"
        >
          Aggiungi Nota
        </button>
      </div>

      {/* ================= ELIMINA CLIENTE ================= */}

      <button
        onClick={deleteClient}
        className="w-full bg-red-800 text-white py-3 rounded font-bold mt-6"
      >
        ELIMINA CLIENTE
      </button>
    </div>
  );
}