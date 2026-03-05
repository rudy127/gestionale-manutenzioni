"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  goBack: () => void;
  goDetail: (id: string) => void;
}

interface Client {
  id: string;
  name: string;
  maintenanceDate: string;
}

export default function Agenda({ user, goBack, goDetail }: Props) {

  const [clients, setClients] = useState<Client[]>([]);

  const load = async () => {

    const snap = await getDocs(collection(db, "clients"));

    const list: Client[] = [];

    snap.forEach((d) => {

      const data = d.data() as Client;

      list.push({
        ...data,
        id: d.id
      });

    });

    setClients(list);
  };

  useEffect(() => {
    load();
  }, []);

  const getDays = (date: string) => {

    return Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
    );

  };

  const today = clients.filter(c => getDays(c.maintenanceDate) === 0);

  const tomorrow = clients.filter(c => getDays(c.maintenanceDate) === 1);

  const week = clients.filter(c => {

    const d = getDays(c.maintenanceDate);

    return d > 1 && d <= 7;

  });

  return (

    <div className="p-4 space-y-4">

      <button
        onClick={goBack}
        className="border p-2 rounded"
      >
        ← Dashboard
      </button>

      <h1 className="text-xl font-bold">
        Agenda Manutenzioni
      </h1>

      <div className="space-y-2">

        <h2 className="font-bold">OGGI</h2>

        {today.map(c => (

          <div
            key={c.id}
            className="border p-2 rounded cursor-pointer"
            onClick={() => goDetail(c.id)}
          >
            {c.name}
          </div>

        ))}

      </div>

      <div className="space-y-2">

        <h2 className="font-bold">DOMANI</h2>

        {tomorrow.map(c => (

          <div
            key={c.id}
            className="border p-2 rounded cursor-pointer"
            onClick={() => goDetail(c.id)}
          >
            {c.name}
          </div>

        ))}

      </div>

      <div className="space-y-2">

        <h2 className="font-bold">PROSSIMI 7 GIORNI</h2>

        {week.map(c => (

          <div
            key={c.id}
            className="border p-2 rounded cursor-pointer"
            onClick={() => goDetail(c.id)}
          >
            {c.name}
          </div>

        ))}

      </div>

    </div>

  );

}