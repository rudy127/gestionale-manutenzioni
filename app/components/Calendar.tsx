"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  goBack: () => void;
  goDetail: (id: string) => void;
}

interface Client {
  id?: string;
  name: string;
  phone?: string;
  maintenanceDate: string;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default function Calendar({ user, goBack, goDetail }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [cursor, setCursor] = useState(new Date());

  const load = async () => {
    const snap = await getDocs(collection(db, "clients"));
    const list: Client[] = [];
    snap.forEach((d) => {
      const data = d.data() as Client;
      list.push({ ...data, id: d.id });
    });
    setClients(list);
  };

  useEffect(() => {
    load();
  }, []);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  const agenda = useMemo(() => {
    const map: Record<string, Client[]> = {};
    clients.forEach((c) => {
      const d = new Date(c.maintenanceDate);
      if (d >= monthStart && d <= monthEnd) {
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    });
    const keys = Object.keys(map).sort();
    return keys.map((k) => ({
      date: new Date(k),
      items: map[k].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [clients, monthStart, monthEnd]);

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button className="px-3 py-2 border rounded" onClick={goBack}>
          ← Dashboard
        </button>

        <div className="font-bold text-lg">📅 {monthLabel(cursor)}</div>

        <div className="flex gap-2">
          <button
            className="px-3 py-2 border rounded"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            ←
          </button>
          <button
            className="px-3 py-2 border rounded"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            →
          </button>
        </div>
      </div>

      {agenda.length === 0 && (
        <div className="text-gray-500">Nessuna manutenzione in questo mese.</div>
      )}

      <div className="space-y-3">
        {agenda.map((day) => (
          <div key={day.date.toISOString()} className="border rounded p-3">
            <div className="font-bold mb-2">{dayLabel(day.date)}</div>

            <div className="space-y-2">
              {day.items.map((c) => (
                <div
                  key={c.id}
                  onClick={() => goDetail(c.id!)}
                  className="cursor-pointer border rounded p-2 hover:bg-gray-50"
                >
                  <div className="font-medium">{c.name}</div>
                  {c.phone && (
                    <div className="text-sm text-gray-500">{c.phone}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}