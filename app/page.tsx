"use client";

import { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnduh9NKI2AqTn4rFC0kKTsIGCm6Ip7SY",
  authDomain: "gestionale-rudy.firebaseapp.com",
  projectId: "gestionale-rudy",
  storageBucket: "gestionale-rudy.firebasestorage.app",
  messagingSenderId: "679882450882",
  appId: "1:679882450882:web:85857ff10ae54794a5585b",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Maintenance {
  date: string;
}

interface Client {
  id?: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  monthsInterval: number;
  maintenanceDate: string;
  history?: Maintenance[];
  documents?: string[]; // link PDF
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

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [docLink, setDocLink] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    job: "",
    monthsInterval: 6,
  });

  const fetchClients = async () => {
    const querySnapshot = await getDocs(collection(db, "clients"));
    const list: Client[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Client) });
    });
    setClients(list);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const generateCode = () => "A" + (clients.length + 1).toString().padStart(3, "0");

  const addClient = async () => {
    if (!form.name) return;

    const maintenanceDate = addBusinessDays(new Date(), form.monthsInterval * 22);

    await addDoc(collection(db, "clients"), {
      code: generateCode(),
      ...form,
      maintenanceDate: maintenanceDate.toISOString(),
      history: [],
      documents: [],
    });

    setForm({ name: "", phone: "", email: "", address: "", job: "", monthsInterval: 6 });
    fetchClients();
  };

  const confirmMaintenance = async (client: Client) => {
    const newDate = addBusinessDays(new Date(), client.monthsInterval * 22);

    await updateDoc(doc(db, "clients", client.id!), {
      maintenanceDate: newDate.toISOString(),
      history: [...(client.history || []), { date: new Date().toISOString() }],
    });

    fetchClients();
  };

  const addDocument = async () => {
    if (!selectedClient || !docLink) return;

    await updateDoc(doc(db, "clients", selectedClient.id!), {
      documents: [...(selectedClient.documents || []), docLink],
    });

    setDocLink("");
    fetchClients();
  };

  const getDaysDiff = (date: string) =>
    (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);

  const expiredCount = useMemo(() =>
    clients.filter(c => getDaysDiff(c.maintenanceDate) <= 0).length,
    [clients]
  );

  if (!selectedClient) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Gestionale Manutenzioni</h1>

        {expiredCount > 0 && (
          <div className="bg-red-600 text-white p-3 rounded text-center font-bold">
            ⚠️ ATTENZIONE: {expiredCount} manutenzioni scadute
          </div>
        )}

        <input
          className="w-full border p-2 rounded"
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-3">
          {clients
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => new Date(a.maintenanceDate).getTime() - new Date(b.maintenanceDate).getTime())
            .map(client => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className=\"p-4 bg-gray-800 text-white rounded-xl shadow cursor-pointer\"
              >
                <div className="font-bold">{client.code} - {client.name}</div>
                <div className=\"text-sm font-semibold text-yellow-300\">Prox manut.: {new Date(client.maintenanceDate).toLocaleDateString()}</div>
              </div>
            ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow space-y-3">
          <h2 className="font-bold">Nuovo Cliente</h2>
          <input className="w-full border p-2 rounded" placeholder="Nome" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
          <input className="w-full border p-2 rounded" placeholder="Telefono" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/>
          <input className="w-full border p-2 rounded" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/>
          <input className="w-full border p-2 rounded" placeholder="Indirizzo" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}/>
          <textarea className="w-full border p-2 rounded" placeholder="Lavoro" value={form.job} onChange={(e)=>setForm({...form,job:e.target.value})}/>
          <label className="font-semibold">Prox manut. (mesi)</label>
          <input type="number" className="w-full border p-2 rounded" value={form.monthsInterval} onChange={(e)=>setForm({...form,monthsInterval:Number(e.target.value)})}/>
          <button onClick={addClient} className="w-full bg-green-600 text-white p-2 rounded">Salva Cliente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={()=>setSelectedClient(null)} className="bg-gray-700 text-white p-2 rounded">← Torna</button>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-2xl font-bold">{selectedClient.code} - {selectedClient.name}</h2>
        <p><strong>Telefono:</strong> <a href={`tel:${selectedClient.phone}`} className="text-blue-600 underline">{selectedClient.phone}</a></p>
        <p><strong>Email:</strong> <a href={`mailto:${selectedClient.email}`} className="text-blue-600 underline">{selectedClient.email}</a></p>
        <p><strong>Prox manut.:</strong> {new Date(selectedClient.maintenanceDate).toLocaleDateString()}</p>

        <button onClick={()=>confirmMaintenance(selectedClient)} className="w-full bg-green-600 text-white p-2 rounded">Conferma Manutenzione</button>

        <hr/>
        <h3 className="font-bold">Storico Manutenzioni</h3>
        {(selectedClient.history || []).map((m,i)=>(
          <div key={i} className="text-sm">{new Date(m.date).toLocaleDateString()}</div>
        ))}

        <hr/>
        <h3 className="font-bold">Allega Documento (link PDF)</h3>
        <input className="w-full border p-2 rounded" placeholder="Incolla link PDF" value={docLink} onChange={(e)=>setDocLink(e.target.value)}/>
        <button onClick={addDocument} className="w-full bg-blue-600 text-white p-2 rounded">Aggiungi Documento</button>

        {(selectedClient.documents || []).map((d,i)=>(
          <div key={i}><a href={d} target="_blank" className="text-blue-600 underline">Documento {i+1}</a></div>
        ))}
      </div>
    </div>
  );
}
