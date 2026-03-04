"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc
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

    const ref = doc(db, "clients", clientId);
    const snap = await getDoc(ref);

    if (snap.exists()) {

      const data = snap.data() as Client;

      setClient({
        ...data,
        id: snap.id,
        history: data.history || []
      });

      setNextDate(data.maintenanceDate?.split("T")[0] || "");

    }
  };

  useEffect(() => {
    load();
  }, []);

  const addNote = async () => {

    if (!client || !note) return;

    const newEntry: HistoryEntry = {
      date: new Date().toISOString(),
      note: note
    };

    const updatedHistory = [...(client.history || []), newEntry];

    await updateDoc(doc(db, "clients", client.id), {
      history: updatedHistory,
      maintenanceDate: nextDate
    });

    setNote("");

    load();

  };

  const deleteNote = async (index: number) => {

    if (!client) return;

    const updatedHistory = [...(client.history || [])];

    updatedHistory.splice(index, 1);

    await updateDoc(doc(db, "clients", client.id), {
      history: updatedHistory
    });

    load();

  };

  const deleteClient = async () => {

    if (!client) return;

    if (!confirm("Eliminare cliente?")) return;

    await deleteDoc(doc(db, "clients", client.id));

    goBack();

  };

  if (!client) return <div className="p-6">Caricamento...</div>;

  return (

    <div className="p-4 space-y-4">

      <button
        onClick={goBack}
        className="border p-2 rounded"
      >
        ← Torna
      </button>

      <h1 className="text-xl font-bold">{client.name}</h1>

      <div>Telefono: {client.phone}</div>
      <div>Email: {client.email}</div>
      <div>Indirizzo: {client.address}</div>

      <div className="border p-3 rounded">
        <strong>Lavoro:</strong>
        <div>{client.job}</div>
      </div>

      <div className="border p-3 rounded space-y-2">

        <h2 className="font-bold">Storico interventi</h2>

        {(client.history || []).map((h, i) => (

          <div
            key={i}
            className="border p-2 rounded flex justify-between items-center"
          >

            <div>

              <div className="text-sm text-gray-500">
                {new Date(h.date).toLocaleString()}
              </div>

              <div>{h.note}</div>

            </div>

            <button
              onClick={() => deleteNote(i)}
              className="bg-red-600 text-white px-2 py-1 rounded"
            >
              X
            </button>

          </div>

        ))}

      </div>

      <textarea
        placeholder="Nuova nota intervento"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="border p-2 w-full"
      />

      <div className="flex flex-col gap-1">

        <label>Prossima manutenzione</label>

        <input
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          className="border p-2"
        />

      </div>

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