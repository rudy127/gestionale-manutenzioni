"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  phonePrefill: string;
  goQueue: (type: string) => void;
  goDetail: (id: string) => void;
  logout: () => void;
}

interface Client {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  maintenanceDate: string;
}

export default function DashboardMain({
  user,
  phonePrefill,
  goQueue,
  goDetail,
  logout,
}: Props) {

  const [clients,setClients] = useState<Client[]>([])
  const [search,setSearch] = useState("")

  const [name,setName] = useState("")
  const [phone,setPhone] = useState(phonePrefill || "")
  const [email,setEmail] = useState("")
  const [address,setAddress] = useState("")
  const [job,setJob] = useState("")

  const load = async () => {

    const snap = await getDocs(collection(db,"clients"))

    const list:Client[] = []

    snap.forEach(d=>{
      const data = d.data() as Client
      list.push({...data,id:d.id})
    })

    setClients(list)

  }

  useEffect(()=>{load()},[])

  const addClient = async () => {

    if(!name) return

    await addDoc(collection(db,"clients"),{
      name,
      phone,
      email,
      address,
      job,
      maintenanceDate:new Date().toISOString(),
      history:[]
    })

    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setJob("")

    load()

  }

  const getDays=(date:string)=>{

    return Math.ceil(
      (new Date(date).getTime()-new Date().getTime()) /
      (1000*60*60*24)
    )

  }

  const red = clients.filter(c=>getDays(c.maintenanceDate)<=0).length
  const orange = clients.filter(c=>getDays(c.maintenanceDate)>0 && getDays(c.maintenanceDate)<=7).length
  const yellow = clients.filter(c=>getDays(c.maintenanceDate)>7 && getDays(c.maintenanceDate)<=14).length

  const filtered = clients.filter(c =>
    c.phone?.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return(

  <div className="p-4 space-y-4">

    <div className="flex justify-between">
      <h1 className="text-xl font-bold">Clienti</h1>
      <button onClick={logout}>Logout</button>
    </div>

    <div className="grid grid-cols-3 gap-2">

      <button onClick={()=>goQueue("red")} className="bg-red-600 text-white p-3 rounded">
        🔴 {red}
      </button>

      <button onClick={()=>goQueue("orange")} className="bg-orange-500 text-white p-3 rounded">
        🟠 {orange}
      </button>

      <button onClick={()=>goQueue("yellow")} className="bg-yellow-400 p-3 rounded">
        🟡 {yellow}
      </button>

    </div>

    <input
      placeholder="🔎 Cerca cliente o telefono"
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      className="border p-2 w-full"
    />

    <div className="border p-4 rounded space-y-2">

      <h2 className="font-bold">Nuovo Cliente</h2>

      <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} className="border p-2 w-full"/>
      <input placeholder="Telefono" value={phone} onChange={e=>setPhone(e.target.value)} className="border p-2 w-full"/>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 w-full"/>
      <input placeholder="Indirizzo" value={address} onChange={e=>setAddress(e.target.value)} className="border p-2 w-full"/>
      <textarea placeholder="Tipo lavoro" value={job} onChange={e=>setJob(e.target.value)} className="border p-2 w-full"/>

      <button onClick={addClient} className="bg-green-700 text-white p-2 rounded w-full">
        Salva cliente
      </button>

    </div>

    <div className="space-y-2">

      {filtered.map(c=>{

        const days=getDays(c.maintenanceDate)

        return(

        <div
          key={c.id}
          className="border p-3 rounded cursor-pointer"
          onClick={()=>goDetail(c.id!)}
        >

          <div>{c.name}</div>
          <div className="text-sm text-gray-500">{c.phone}</div>

          {days<=7 && (
            <div className="text-red-600 text-sm">
              ⚠ manutenzione tra {days} giorni
            </div>
          )}

        </div>

        )

      })}

    </div>

  </div>

  )

}