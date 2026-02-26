"use client";

import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

/* ================= FIREBASE ================= */

const firebaseConfig = {
  apiKey: "AIzaSyDnduh9NKI2AqTn4rFC0kKTsIGCm6Ip7SY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "1:679882450882:web:85857ff10ae54794a5585b",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

/* ================= TYPES ================= */

interface HistoryEntry {
  date: string;
  note: string;
}

interface Client {
  id?: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  maintenanceDate: string;
  intervalValue: number;
  intervalType: "months" | "days";
  ownerId: string;
  history: HistoryEntry[];
}

/* ================= UTILS ================= */

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

function calculateNextDate(value: number, type: "months" | "days") {
  const now = new Date();
  if (type === "months") {
    const next = new Date(now);
    next.setMonth(next.getMonth() + value);
    return next;
  }
  return addBusinessDays(now, value);
}

const daysDiff = (date: string) =>
  Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

/* ================= COMPONENT ================= */

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newClient, setNewClient] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    job: "",
  });

  const [intervalValue, setIntervalValue] = useState(6);
  const [intervalType, setIntervalType] = useState<"months" | "days">("months");

  const [note, setNote] = useState("");

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
      if (u) loadClients(u.uid);
    });
    return () => unsub();
  }, []);

  /* ================= DATA ================= */

  const loadClients = async (uid: string) => {
    const q = query(collection(db, "clients"), where("ownerId", "==", uid));
    const snap = await getDocs(q);
    const list: Client[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Client) }));
    list.sort((a, b) => new Date(a.maintenanceDate).getTime() - new Date(b.maintenanceDate).getTime());
    setClients(list);
  };

  const addClient = async () => {
    if (!user || !newClient.name.trim()) return;

    const nextDate = calculateNextDate(intervalValue, intervalType);

    await addDoc(collection(db, "clients"), {
      code: "A" + (clients.length + 1).toString().padStart(3, "0"),
      ...newClient,
      maintenanceDate: nextDate.toISOString(),
      intervalValue,
      intervalType,
      ownerId: user.uid,
      history: [],
    });

    setNewClient({ name: "", phone: "", email: "", address: "", job: "" });
    setIntervalValue(6);
    setIntervalType("months");

    loadClients(user.uid);
  };

  const confirmMaintenance = async (c: Client) => {
    const next = calculateNextDate(c.intervalValue, c.intervalType);
    await updateDoc(doc(db, "clients", c.id!), {
      maintenanceDate: next.toISOString(),
    });
    loadClients(user!.uid);
  };

  const addNote = async () => {
    if (!selected || !note.trim()) return;

    const updatedHistory = [...selected.history, { date: new Date().toISOString(), note }];

    await updateDoc(doc(db, "clients", selected.id!), { history: updatedHistory });

    setSelected({ ...selected, history: updatedHistory });
    setNote("");
  };

  const deleteNote = async (entry: HistoryEntry) => {
    if (!selected) return;

    const filtered = selected.history.filter(
      h => !(h.date === entry.date && h.note === entry.note)
    );

    await updateDoc(doc(db, "clients", selected.id!), { history: filtered });
    setSelected({ ...selected, history: filtered });
  };

  const deleteClient = async (c: Client) => {
    if (!confirm("Eliminare cliente?")) return;
    await deleteDoc(doc(db, "clients", c.id!));
    loadClients(user!.uid);
    setSelected(null);
  };

  /* ================= LOGIN ================= */

  if (!ready) return <div className="p-6 bg-white text-black">Caricamento...</div>;

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="bg-white p-6 rounded shadow w-80 space-y-3 border">
          <h1 className="font-bold text-lg text-center">Login</h1>
          <input className="border p-2 w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="border p-2 w-full" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="bg-blue-700 text-white w-full p-2 font-bold" onClick={async () => {
            try { await signInWithEmailAndPassword(auth, email, password); }
            catch { alert("Credenziali errate"); }
          }}>Accedi</button>
        </div>
      </div>
    );

  /* ================= LIST ================= */

  if (!selected)
    return (
      <div style={{ backgroundColor: "#ffffff", color: "#000000" }} className="min-h-screen p-6">
        <div className="flex justify-between mb-4">
          <h1 className="font-bold text-xl">Gestionale Manutenzioni</h1>
          <button onClick={() => signOut(auth)} className="text-red-700 font-bold">Logout</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-red-700 text-white p-3 rounded font-bold text-center">
            🔴 {clients.filter(c => daysDiff(c.maintenanceDate) <= 0).length}
          </div>
          <div className="bg-orange-500 text-white p-3 rounded font-bold text-center">
            🟠 {clients.filter(c => daysDiff(c.maintenanceDate) > 0 && daysDiff(c.maintenanceDate) <= 7).length}
          </div>
          <div className="bg-yellow-400 text-black p-3 rounded font-bold text-center">
            🟡 {clients.filter(c => daysDiff(c.maintenanceDate) > 7 && daysDiff(c.maintenanceDate) <= 14).length}
          </div>
        </div>

        {clients.map(c => (
          <div key={c.id} onClick={() => setSelected(c)} className="border p-3 mb-2 cursor-pointer rounded">
            <div className="font-bold">{c.code} - {c.name}</div>
            <div className="text-sm">
              {new Date(c.maintenanceDate).toLocaleDateString()} ({daysDiff(c.maintenanceDate)} gg)
            </div>
          </div>
        ))}

        <div className="border p-4 mt-6 space-y-2 rounded">
          <h2 className="font-bold">Nuovo Cliente</h2>
          <input className="border p-2 w-full" placeholder="Nome" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
          <input className="border p-2 w-full" placeholder="Telefono" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
          <input className="border p-2 w-full" placeholder="Email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
          <input className="border p-2 w-full" placeholder="Indirizzo" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
          <textarea className="border p-2 w-full" placeholder="Lavoro" value={newClient.job} onChange={e => setNewClient({ ...newClient, job: e.target.value })} />

          <div className="flex gap-2">
            <select value={intervalType} onChange={e => setIntervalType(e.target.value as any)} className="border p-2">
              <option value="months">Mesi</option>
              <option value="days">Giorni lavorativi</option>
            </select>

            <input type="number" value={intervalValue} min={1} onChange={e => setIntervalValue(Number(e.target.value))} className="border p-2 w-24" />
          </div>

          <button className="bg-green-700 text-white w-full p-2 font-bold" onClick={addClient}>Salva</button>
        </div>
      </div>
    );

  /* ================= DETAIL ================= */

  return (
    <div style={{ backgroundColor: "#ffffff", color: "#000000" }} className="min-h-screen p-6">
      <button onClick={() => setSelected(null)} className="mb-4 text-blue-700 font-bold">← Torna</button>

      <h2 className="font-bold text-xl mb-2">{selected.code} - {selected.name}</h2>

      <div className="grid md:grid-cols-2 gap-2 mb-4">
        <a href={`tel:${selected.phone}`} className="bg-blue-700 text-white p-2 text-center font-bold rounded">Chiama</a>
        <a href={`https://wa.me/${selected.phone}`} target="_blank" className="bg-green-700 text-white p-2 text-center font-bold rounded">WhatsApp</a>
        <a href={`mailto:${selected.email}`} className="bg-gray-700 text-white p-2 text-center font-bold rounded">Email</a>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address)}`} target="_blank" className="bg-yellow-400 text-black p-2 text-center font-bold rounded">Maps</a>
      </div>

      <button className="bg-green-700 text-white w-full p-2 mb-4 font-bold rounded" onClick={() => confirmMaintenance(selected)}>
        Conferma Manutenzione
      </button>

      <div>
        <h3 className="font-bold">Storico</h3>
        {selected.history.slice().sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((h,i)=> (
          <div key={i} className="border p-3 mt-3 rounded">
            <div className="flex justify-between">
              <div className="text-xs">{new Date(h.date).toLocaleString()}</div>
              <button onClick={()=>deleteNote(h)} className="text-red-700 font-bold">🗑</button>
            </div>
            <div>{h.note}</div>
          </div>
        ))}
      </div>

      <textarea className="border p-2 w-full mt-4" placeholder="Nuova nota" value={note} onChange={e=>setNote(e.target.value)} />
      <button className="bg-blue-700 text-white w-full p-2 mt-2 font-bold rounded" onClick={addNote}>Aggiungi Nota</button>

      <button className="bg-red-700 text-white w-full p-2 mt-4 font-bold rounded" onClick={()=>deleteClient(selected)}>Elimina Cliente</button>
    </div>
  );
}
