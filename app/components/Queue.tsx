"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Client {
  id: string;
  name: string;
  maintenanceDate: string;
}

interface Props {
  user: User;
  goBack: () => void;
  goDetail: (id: string) => void;
}

const daysDiff = (date: string) =>
  Math.ceil(
    (new Date(date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

export default function Queue({ user, goBack, goDetail }: Props) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, "clients"),
        where("ownerId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list: Client[] = [];
      snap.forEach((d) =>
        list.push({ id: d.id, ...(d.data() as Client) })
      );

      list.sort(
        (a, b) =>
          new Date(a.maintenanceDate).getTime() -
          new Date(b.maintenanceDate).getTime()
      );

      setClients(list);
    };

    load();
  }, [user]);

  const getColor = (date: string) => {
    const diff = daysDiff(date);
    if (diff <= 0) return "bg-red-600 text-white";
    if (diff <= 7) return "bg-orange-500 text-white";
    if (diff <= 14) return "bg-yellow-400 text-black";
    return "bg-green-600 text-white";
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <button
        onClick={goBack}
        className="mb-6 bg-gray-800 text-white px-4 py-2 rounded font-bold"
      >
        ← Torna alla Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Coda Manutenzioni
      </h1>

      <div className="space-y-3">
        {clients.map((c) => (
          <div
            key={c.id}
            onClick={() => goDetail(c.id)}
            className={`p-4 rounded-xl cursor-pointer font-bold ${getColor(
              c.maintenanceDate
            )}`}
          >
            {c.name} – {new Date(c.maintenanceDate).toLocaleDateString()} (
            {daysDiff(c.maintenanceDate)} gg)
          </div>
        ))}
      </div>
    </div>
  );
}