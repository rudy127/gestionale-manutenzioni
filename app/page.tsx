"use client";

import { useState, useEffect, useMemo } from "react";
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
  arrayUnion,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

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
  intervalValue: number;
  intervalType: "days" | "months";
  maintenanceDate: string;
  ownerId: string;
  history?: HistoryEntry[];
}

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function calculateNextDate(value: number, type: "days" | "months") {
  if (type === "days") return addBusinessDays(new Date(), value);
  return addBusinessDays(new Date(), value * 22);
}

export default function Home() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [auth, setAuth] = useState<any>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newNote, setNewNote] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    job: "",
    intervalValue: 6,
    intervalType: "months" as "days" | "months",
  });

  useEffect(() => {
    const firebaseAuth = getAuth(app);
    setAuth(firebaseAuth);

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) fetchClients(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const fetchClients = async (uid: string) => {
    const q = query(collection(db, "clients"), where("ownerId", "==", uid));
    const snapshot = await getDocs(q);
    const list: Client[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Client) });
    });
    setClients(list);
  };

  const generateCode = () =>
    "A" + (clients.length + 1).toString().padStart(3, "0");

  const addClient = async () => {
    if (!form.name || !authUser) return;

    const nextDate = calculateNextDate(form.intervalValue, form.intervalType);

    await addDoc(collection(db, "clients"), {
      code: generateCode(),
      ...form,
      maintenanceDate: nextDate.toISOString(),
      ownerId: authUser.uid,
      history: [],
    });

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      job: "",
      intervalValue: 6,
      intervalType: "months",
    });

    fetchClients(authUser.uid);
  };

  const addHistoryNote = async () => {
    if (!selectedClient || !newNote.trim()) return;

    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      note: newNote,
    };

    await updateDoc(doc(db, "clients", selectedClient.id!), {
      history: arrayUnion(entry),
    });

    setNewNote("");
    fetchClients(authUser!.uid);
  };

  const confirmMaintenance = async (client: Client) => {
    const newDate = calculateNextDate(client.intervalValue, client.intervalType);

    await updateDoc(doc(db, "clients", client.id!), {
      maintenanceDate: newDate.toISOString(),
    });

    fetchClients(authUser!.uid);
  };

  const deleteClient = async (client: Client) => {
    if (!confirm("Eliminare questo cliente?")) return;
    await deleteDoc(doc(db, "clients", client.id!));
    fetchClients(authUser!.uid);
    setSelectedClient(null);
  };

  const getDaysDiff = (date: string) =>
    Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  if (!authReady) return <div style={{backgroundColor:'#fff',color:'#000'}} className="p-6 min-h-screen">Caricamento...</div>;

  if (!authUser) {
    return (
      <div style={{backgroundColor:'#fff',color:'#000'}} className="p-6 max-w-sm mx-auto space-y-4 min-h-screen">
        <h1 className="text-xl font-bold text-center">Accesso Gestionale</h1>

        <input className="w-full border-2 border-black p-3 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full border-2 border-black p-3 rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button onClick={async () => {
          try { await signInWithEmailAndPassword(auth, email, password); }
          catch { alert("Credenziali errate"); }
        }} className="w-full bg-blue-700 text-white p-3 rounded font-bold">Accedi</button>
      </div>
    );
  }

  if (!selectedClient) {
    return (
      <div style={{backgroundColor:'#fff',color:'#000'}} className="p-4 max-w-3xl mx-auto space-y-4 min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Gestionale Manutenzioni</h1>
          <button onClick={() => signOut(auth)} className="text-red-700 font-bold">Logout</button>
        </div>

        <input className="w-full border-2 border-black p-3 rounded" placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="space-y-3">
          {clients
            .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
            .map((client) => (
              <div key={client.id} onClick={() => setSelectedClient(client)} className="p-4 bg-green-700 text-white rounded font-bold">
                {client.code} - {client.name}
              </div>
            ))}
        </div>

        <div className="border-2 border-black p-4 rounded space-y-3">
          <h2 className="text-lg font-bold">Nuovo Cliente</h2>
          <input className="w-full border-2 border-black p-3 rounded" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="w-full border-2 border-black p-3 rounded" placeholder="Tipo lavoro" value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} />
          <button onClick={addClient} className="w-full bg-green-700 text-white p-3 rounded font-bold">Salva</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{backgroundColor:'#fff',color:'#000'}} className="p-4 max-w-3xl mx-auto space-y-4 min-h-screen">
      <button onClick={() => setSelectedClient(null)} className="bg-gray-800 text-white p-3 rounded font-bold">← Torna</button>

      <div className="border-2 border-black p-4 rounded space-y-4">
        <h2 className="text-xl font-bold">{selectedClient.code} - {selectedClient.name}</h2>

        <div>
          <strong>Tipo lavoro eseguito:</strong>
          <p className="mt-1">{selectedClient.job}</p>
        </div>

        <div>
          <strong>Storico interventi / Note:</strong>
          <div className="space-y-2 mt-2">
            {selectedClient.history && selectedClient.history.map((h, i) => (
              <div key={i} className="border p-2 rounded">
                <div className="text-xs text-gray-600">{new Date(h.date).toLocaleString()}</div>
                <div>{h.note}</div>
              </div>
            ))}
          </div>
        </div>

        <textarea
          className="w-full border-2 border-black p-3 rounded"
          placeholder="Aggiungi nuova nota / operazione / misurazione"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />

        <button onClick={addHistoryNote} className="w-full bg-blue-700 text-white p-3 rounded font-bold">Aggiungi nota</button>

        <button onClick={() => confirmMaintenance(selectedClient)} className="w-full bg-green-700 text-white p-3 rounded font-bold">Conferma manutenzione</button>
        <button onClick={() => deleteClient(selectedClient)} className="w-full bg-red-700 text-white p-3 rounded font-bold">Elimina cliente</button>
      </div>
    </div>
  );
}
