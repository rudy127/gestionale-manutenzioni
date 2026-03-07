"use client";

import { useEffect, useState } from "react";
import {
doc,
getDoc,
updateDoc,
deleteDoc
} from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";
import jsPDF from "jspdf";

interface Props{
user:User
clientId:string
goBack:()=>void
}

interface HistoryEntry{
date:string
note:string
}

interface Client{
id:string
name:string
phone:string
email:string
address:string
job:string
maintenanceDate:string
history?:HistoryEntry[]
}

export default function ClientDetail({user,clientId,goBack}:Props){

const [client,setClient]=useState<Client|null>(null)

const [name,setName]=useState("")
const [phone,setPhone]=useState("")
const [email,setEmail]=useState("")
const [address,setAddress]=useState("")
const [job,setJob]=useState("")

const [note,setNote]=useState("")
const [nextDate,setNextDate]=useState("")

const load=async()=>{

const snap=await getDoc(doc(db,"clients",clientId))

if(snap.exists()){

const data=snap.data() as Client

setClient({...data,id:snap.id,history:data.history || []})

setName(data.name || "")
setPhone(data.phone || "")
setEmail(data.email || "")
setAddress(data.address || "")
setJob(data.job || "")

setNextDate(data.maintenanceDate?.split("T")[0] || "")

}

}

useEffect(()=>{load()},[])

const saveClient=async()=>{

if(!client) return

await updateDoc(doc(db,"clients",client.id),{

name,
phone,
email,
address,
job,
maintenanceDate:nextDate

})

alert("Cliente aggiornato")

load()

}

const addNote=async()=>{

if(!client || !note) return

const newEntry={
date:new Date().toISOString(),
note
}

const updated=[...(client.history || []),newEntry]

await updateDoc(doc(db,"clients",client.id),{
history:updated,
maintenanceDate:nextDate
})

setNote("")

load()

}

const deleteNote=async(index:number)=>{

if(!client) return

const updated=[...(client.history || [])]

updated.splice(index,1)

await updateDoc(doc(db,"clients",client.id),{
history:updated
})

load()

}

const exportPDF=()=>{

if(!client) return

const pdf=new jsPDF()

pdf.text("Rapporto Intervento",20,20)
pdf.text(`Cliente: ${name}`,20,40)
pdf.text(`Telefono: ${phone}`,20,50)
pdf.text(`Email: ${email}`,20,60)
pdf.text(`Indirizzo: ${address}`,20,70)

pdf.text("Storico interventi:",20,90)

let y=100

client.history?.forEach(h=>{
pdf.text(`${new Date(h.date).toLocaleDateString()} - ${h.note}`,20,y)
y+=10
})

pdf.save(`intervento-${name}.pdf`)

}

const deleteClient=async()=>{

if(!client) return

if(!confirm("Eliminare cliente?")) return

await deleteDoc(doc(db,"clients",client.id))

goBack()

}

if(!client) return <div>Caricamento...</div>

const phoneClean=phone.replace(/\s/g,"")

const callLink=`tel:${phoneClean}`
const waLink=`https://wa.me/${phoneClean}`
const mapsLink=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

return(

<div className="p-4 space-y-4">

<button onClick={goBack} className="border p-2 rounded">
← Torna
</button>

<h1 className="text-xl font-bold">Cliente</h1>

<div className="space-y-2">

<input
value={name}
onChange={(e)=>setName(e.target.value)}
className="border p-2 w-full"
/>

<input
value={phone}
onChange={(e)=>setPhone(e.target.value)}
className="border p-2 w-full"
/>

<input
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="border p-2 w-full"
/>

<input
value={address}
onChange={(e)=>setAddress(e.target.value)}
className="border p-2 w-full"
/>

<textarea
value={job}
onChange={(e)=>setJob(e.target.value)}
className="border p-2 w-full"
/>

<input
type="date"
value={nextDate}
onChange={(e)=>setNextDate(e.target.value)}
className="border p-2"
/>

<button
onClick={saveClient}
className="bg-green-700 text-white p-2 rounded w-full"
>
Salva modifiche cliente
</button>

</div>

<div className="flex gap-2">

<a href={callLink} className="bg-blue-600 text-white px-3 py-2 rounded">
📞 Chiama
</a>

<a href={waLink} target="_blank" className="bg-green-600 text-white px-3 py-2 rounded">
💬 WhatsApp
</a>

<a href={mapsLink} target="_blank" className="bg-gray-700 text-white px-3 py-2 rounded">
🧭 Naviga
</a>

<button
onClick={exportPDF}
className="bg-purple-700 text-white px-3 py-2 rounded"
>
🧾 PDF
</button>

</div>

<div className="border p-3 rounded space-y-2">

<h2 className="font-bold">Storico interventi</h2>

{(client.history || []).map((h,i)=>(

<div key={i} className="border p-2 rounded flex justify-between">

<div>

<div className="text-sm text-gray-500">
{new Date(h.date).toLocaleString()}
</div>

<div>{h.note}</div>

</div>

<button
onClick={()=>deleteNote(i)}
className="bg-red-600 text-white px-2 rounded"
>
X
</button>

</div>

))}

</div>

<textarea
placeholder="Nuova nota intervento"
value={note}
onChange={(e)=>setNote(e.target.value)}
className="border p-2 w-full"
/>

<button
onClick={addNote}
className="bg-blue-700 text-white p-2 rounded w-full"
>
Salva nota
</button>

<button
onClick={deleteClient}
className="bg-red-700 text-white p-2 rounded w-full"
>
Elimina cliente
</button>

</div>

)

}