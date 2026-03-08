"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props{
user:User
goBack:()=>void
goDetail:(id:string)=>void
}

interface Client{
id:string
name:string
address:string
maintenanceDate:string
}

export default function Agenda({user,goBack,goDetail}:Props){

const [clients,setClients]=useState<Client[]>([])

const load=async()=>{

const snap=await getDocs(collection(db,"clients"))

const list:Client[]=[]

snap.forEach(d=>{

const data=d.data() as Client

list.push({
id:d.id,
name:data.name,
address:data.address,
maintenanceDate:data.maintenanceDate
})

})

setClients(list)

}

useEffect(()=>{load()},[])

const formatDate=(date:string)=>{

const d=new Date(date)

return d.toLocaleDateString()

}

const grouped:Record<string,Client[]>= {}

clients.forEach(c=>{

const date=formatDate(c.maintenanceDate)

if(!grouped[date]) grouped[date]=[]

grouped[date].push(c)

})

const openNavigation=(address:string)=>{

const url=
"https://www.google.com/maps/search/?api=1&query="+
encodeURIComponent(address)

window.open(url,"_blank")

}

return(

<div className="p-4 space-y-4">

<button
onClick={goBack}
className="border p-2 rounded"
>
← Dashboard
</button>

<h1 className="text-xl font-bold">
Agenda interventi
</h1>

{Object.keys(grouped).sort().map(date=>(

<div key={date} className="border rounded p-3 space-y-2">

<h2 className="font-bold">
{date}
</h2>

{grouped[date].map(c=>(

<div
key={c.id}
className="border p-2 rounded flex justify-between items-center"
>

<div
className="cursor-pointer"
onClick={()=>goDetail(c.id)}
>
{c.name}
</div>

<button
onClick={()=>openNavigation(c.address)}
className="bg-green-600 text-white px-2 py-1 rounded text-sm"
>
🧭 Naviga
</button>

</div>

))}

</div>

))}

</div>

)

}