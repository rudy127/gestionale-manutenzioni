"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
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
  history: HistoryEntry[];
}

interface Props {
  user: User;
  clientId: string;
  goBack: () => void;
}

function addBusinessDays(start: Date, days: number) {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

export default function ClientDetail({ clientId, goBack }: Props) {
  const [client, setClient] = useState<Client | null>(null);
  const [note, setNote] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [intervalValue, setIntervalValue] = useState(6);
  const [intervalType, setIntervalType] = useState<"months" | "days">("months");
  const [excludeWeekend, setExcludeWeekend] = useState(false);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "clients", clientId));
      if (snap.exists()) {
        const data = snap.data() as Client;
        setClient({ id: snap.id, ...data });
        setIntervalValue(data.intervalValue);
        setIntervalType(data.intervalType);
      }
    };
    load();
  }, [clientId]);

  if (!client) return <div className="p-6">Caricamento...</div>;

  const saveMaintenance = async () => {
    let nextDate: Date;

    if (manualDate) {
      nextDate = new Date(manualDate);
    } else {
      const base = new Date();
      if (intervalType === "months") {
        nextDate = new Date(base);
        nextDate.setMonth(base.getMonth() + intervalValue);
      } else {
        nextDate = excludeWeekend
          ? addBusinessDays(base, intervalValue)
          : new Date(base.getTime() + intervalValue * 86400000);
      }
    }

    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      note: `Manutenzione aggiornata`,
    };

    const updatedHistory = [...(client.history || []), entry];

    await updateDoc(doc(db, "clients", client.id), {
      maintenanceDate: nextDate.toISOString(),
      intervalValue,
      intervalType,
      history: updatedHistory,
    });

    setClient({
      ...client,
      maintenanceDate: nextDate.toISOString(),
      intervalValue,
      intervalType,
      history: updatedHistory,
    });

    setManualDate("");
  };

  const addNote = async () => {
    if (!note.trim()) return;

    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      note,
    };

    const updatedHistory = [...(client.history || []), entry];

    await updateDoc(doc(db, "clients", client.id), {
      history: updatedHistory,
    });

    setClient({ ...client, history: updatedHistory });
    setNote("");
  };

  const deleteNote = async (entry: HistoryEntry) => {
    const filtered = client.history.filter(
      (h) => !(h.date === entry.date && h.note === entry.note)
    );

    await updateDoc(doc(db, "clients", client.id), {
      history: filtered,
    });

    setClient({ ...client, history: filtered });
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

      <div className="border p-4 rounded space-y-2">
        <div><strong>Lavoro svolto:</strong> {client.job}</div>
        <div><strong>Prossima manutenzione:</strong> {new Date(client.maintenanceDate).toLocaleDateString()}</div>
      </div>

      <div className="border p-4 rounded space-y-3">
        <h2 className="font-bold">Aggiorna Manutenzione</h2>

        <div className="flex gap-2">
          <input
            type="number"
            value={intervalValue}
            onChange={(e) => setIntervalValue(Number(e.target.value))}
            className="border p-2 w-24"
          />
          <select
            value={intervalType}
            onChange={(e) => setIntervalType(e.target.value as any)}
            className="border p-2"
          >
            <option value="months">Mesi</option>
            <option value="days">Giorni</option>
          </select>
        </div>

        <div>
          <label>Oppure data manuale:</label>
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={excludeWeekend}
            onChange={(e) => setExcludeWeekend(e.target.checked)}
          />
          <span>Escludi weekend</span>
        </div>

        <button
          onClick={saveMaintenance}
          className="bg-green-700 text-white px-4 py-2 rounded font-bold"
        >
          Salva manutenzione
        </button>
      </div>

      <div className="border p-4 rounded space-y-3">
        <h2 className="font-bold">Storico</h2>

        {(client.history || [])
          .slice()
          .reverse()
          .map((h, i) => (
            <div key={i} className="border p-3 rounded">
              <div className="flex justify-between">
                <span>{new Date(h.date).toLocaleString()}</span>
                <button
                  onClick={() => deleteNote(h)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Cancella
                </button>
              </div>
              <div>{h.note}</div>
            </div>
          ))}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border p-2 w-full"
          placeholder="Aggiungi nota"
        />

        <button
          onClick={addNote}
          className="bg-blue-700 text-white px-4 py-2 rounded font-bold"
        >
          Aggiungi Nota
        </button>
      </div>
    </div>
  );
}