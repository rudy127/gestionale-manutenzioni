"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  filter: string | null;
  goBack: () => void;
  goDetail: (id: string) => void;
}

interface Client {
  id: string;
  name: string;
  address: string;
  maintenanceDate: string;
  lat?: number;
  lng?: number;
  distance?: number;
}

export default function Queue({ user, filter, goBack, goDetail }: Props) {

  const [clients, setClients] = useState<Client[]>([]);
  const [position, setPosition] = useState<{lat:number,lng:number}|null>(null);

  const load = async () => {

    const snap = await getDocs(collection(db, "clients"));

    const list: Client[] = [];

    snap.forEach((d) => {

      const data = d.data() as Client;

      list.push({
        id: d.id,
        name: data.name,
        address: data.address,
        maintenanceDate: data.maintenanceDate
      });

    });

    setClients(list);
  };

  useEffect(() => {

    load();

    if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition((pos) => {

        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });

      });

    }

  }, []);

  const getDays = (date: string) => {

    return Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
    );

  };

  const filtered = clients.filter((c) => {

    const days = getDays(c.maintenanceDate);

    if (filter === "red") return days <= 0;
    if (filter === "orange") return days > 0 && days <= 7;
    if (filter === "yellow") return days > 7 && days <= 14;

    return true;

  });

  const openRoute = () => {

    if (filtered.length === 0) return;

    const stops = filtered
      .slice(0,10)
      .map(c => encodeURIComponent(c.address));

    const url = "https://www.google.com/maps/dir/" + stops.join("/");

    window.open(url,"_blank");

  };

  const openSingleRoute = (address:string) => {

    const url =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(address);

    window.open(url,"_blank");

  };

  return (

    <div className="p-4 space-y-4">

      <button
        onClick={goBack}
        className="border p-2 rounded"
      >
        ← Dashboard
      </button>

      <h1 className="text-lg font-bold">
        Coda Manutenzioni
      </h1>

      <button
        onClick={openRoute}
        className="bg-blue-700 text-white p-2 rounded w-full"
      >
        🧭 Pianifica giro interventi
      </button>

      <div className="space-y-2">

        {filtered.map((c) => (

          <div
            key={c.id}
            className="border p-3 rounded space-y-1"
          >

            <div
              className="font-bold cursor-pointer"
              onClick={() => goDetail(c.id)}
            >
              {c.name}
            </div>

            <div className="text-sm text-gray-500">
              {c.address}
            </div>

            <button
              onClick={() => openSingleRoute(c.address)}
              className="bg-green-600 text-white px-2 py-1 rounded text-sm"
            >
              🧭 Naviga
            </button>

          </div>

        ))}

      </div>

    </div>

  );

}