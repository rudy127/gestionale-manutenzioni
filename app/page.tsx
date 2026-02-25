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
  arrayUnion,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDnduh9NKI2AqTn4rFC0kKTsIGCm6Ip7SY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "1:679882450882:web:85857ff10ae54794a5585b",
};

// Initialize Firebase once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

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
  ownerId: string;
  history?: HistoryEntry[];
}

export default function Home() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newClientName, setNewClientName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

  const addClient = async () => {
    if (!authUser || !newClientName.trim()) return;

    await addDoc(collection(db, "clients"), {
      code: "A" + (clients.length + 1).toString().padStart(3, "0"),
      name: newClientName,
      phone: "",
      email: "",
      address: "",
      job: "",
      maintenanceDate: new Date().toISOString(),
      ownerId: authUser.uid,
      history: [],
    });

    setNewClientName("");
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

    setSelectedClient({
      ...selectedClient,
      history: [...(selectedClient.history || []), entry],
    });

    setNewNote("");
  };

  const deleteClient = async (client: Client) => {
    if (!confirm("Eliminare questo cliente?")) return;
    await deleteDoc(doc(db, "clients", client.id!));
    fetchClients(authUser!.uid);
    setSelectedClient(null);
  };

  if (!authReady) {
    return <div style={{ background: "#fff", color: "#000" }}>Caricamento...</div>;
  }

  if (!authUser) {
    return (
      <div style={{ background: "#fff", color: "#000" }} className="p-6">
        <h1 className="text-xl font-bold">Login</h1>
        <input
          className="border-2 border-black p-2 block mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border-2 border-black p-2 block mb-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-blue-700 text-white p-2"
          onClick={async () => {
            try {
              await signInWithEmailAndPassword(auth, email, password);
            } catch {
              alert("Credenziali errate");
            }
          }}
        >
          Accedi
        </button>
      </div>
    );
  }

  if (!selectedClient) {
    return (
      <div style={{ background: "#fff", color: "#000" }} className="p-6">
        <h1 className="text-xl font-bold mb-4">Clienti</h1>

        {/* CONTATORI SCADENZE */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-white font-bold">
          <div className="bg-red-700 p-2 text-center rounded">
            🔴 {clients.filter(c => new Date(c.maintenanceDate) <= new Date()).length}
          </div>
          <div className="bg-orange-600 p-2 text-center rounded">
            🟠 {clients.filter(c => {
              const diff = (new Date(c.maintenanceDate).getTime() - new Date().getTime()) / (1000*60*60*24);
              return diff > 0 && diff <= 7;
            }).length}
          </div>
          <div className="bg-yellow-400 text-black p-2 text-center rounded">
            🟡 {clients.filter(c => {
              const diff = (new Date(c.maintenanceDate).getTime() - new Date().getTime()) / (1000*60*60*24);
              return diff > 7 && diff <= 14;
            }).length}
          </div>
        </div>

        {clients.map((c) => (
          <div
            key={c.id}
            className="bg-green-700 text-white p-2 mb-2 cursor-pointer"
            onClick={() => setSelectedClient(c)}
          >
            {c.code} - {c.name}
          </div>
        ))}

        <div className="mt-4">
          <input
            className="border-2 border-black p-2 mr-2"
            placeholder="Nuovo cliente"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
          <button className="bg-green-700 text-white p-2" onClick={addClient}>
            Aggiungi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", color: "#000" }} className="p-6">
      <button className="mb-4 bg-gray-800 text-white p-2" onClick={() => setSelectedClient(null)}>
        ← Torna
      </button>

      <h2 className="text-xl font-bold mb-2">
        {selectedClient.code} - {selectedClient.name}
      </h2>

      <div className="mb-4">
        <strong>Storico note:</strong>
        {selectedClient.history?.map((h, i) => (
          <div key={i} className="border p-2 mt-2">
            <div className="text-xs text-gray-600">
              {new Date(h.date).toLocaleString()}
            </div>
            <div>{h.note}</div>
          </div>
        ))}
      </div>

      <textarea
        className="border-2 border-black p-2 w-full mb-2"
        placeholder="Nuova nota"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
      />

      <button className="bg-blue-700 text-white p-2 mr-2" onClick={addHistoryNote}>
        Aggiungi nota
      </button>

      <button className="bg-red-700 text-white p-2" onClick={() => deleteClient(selectedClient)}>
        Elimina cliente
      </button>
    </div>
  );
}
