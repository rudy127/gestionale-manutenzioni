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
  goQueue: () => void;
  goDetail: (id: string) => void;
}

const daysDiff = (date: string) =>
  Math.ceil(
    (new Date(date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

export default function Dashboard({ user, goQueue, goDetail }: Props) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, "clients"),
        where("ownerId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list: Client[] = [];
snap.forEach((d) => {
  const data = d.data() as Omit<Client, "id">;
  snap.forEach((d) => {
  const data = d.data() as Omit<Client, "id">;
  list.push({ ...data, id: d.id });
});;
});
      setClients(list);
    };
    load();
  }, [user]);

  const red = clients.filter((c) => daysDiff(c.maintenanceDate) <= 0).length;
  const orange = clients.filter(
    (c) => daysDiff(c.maintenanceDate) > 0 && daysDiff(c.maintenanceDate) <= 7
  ).length;
  const yellow = clients.filter(
    (c) => daysDiff(c.maintenanceDate) > 7 && daysDiff(c.maintenanceDate) <= 14
  ).length;

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-700 text-white p-4 rounded-xl text-center font-bold text-lg">
          🔴 {red}
        </div>
        <div className="bg-orange-500 text-white p-4 rounded-xl text-center font-bold text-lg">
          🟠 {orange}
        </div>
        <div className="bg-yellow-400 text-black p-4 rounded-xl text-center font-bold text-lg">
          🟡 {yellow}
        </div>
      </div>

      <button
        onClick={goQueue}
        className="bg-blue-700 text-white px-4 py-2 rounded font-bold"
      >
        Vai alla Coda Manutenzioni
      </button>
    </div>
  );
}