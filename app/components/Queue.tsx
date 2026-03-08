"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../page";
import type { User } from "firebase/auth";

interface Props{
user:User
filter:string|null
goBack:()=>void
goDetail:(id:string)=>void
}

interface Client{
id:string
name:string
address:string
maintenanceDate:string
}

export default function Queue({user,filter,goBack,goDetail}:Props){

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

const getDays=(date:string)=>{

return Math.ceil(
(new Date(date).getTime()-new Date().getTime())/(1000*60*60*24)
)

}

const filtered=clients.filter(c=>{

const days=getDays(c.maintenanceDate)

if(filter==="red") return days<=0
if(filter==="orange") return days>0 && days<=7
if(filter==="yellow") return days>7 && days<=14

return true

})

const openRoute=()=>{

if(filtered.length===0) return

const maxStops=10

const stops=filtered
.slice(0,maxStops)
.map(c=>encodeURIComponent(c.address))

const url="https://www.google.com/maps/dir/"+stops.join("/")

window.open(url,"_blank")

}

return(

<div className="p-4 space-y-4">

<button onClick={goBack} className="border p-2 rounded">
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

{filtered.map(c=>(

<div
key={c.id}
className="border p-3 rounded cursor-pointer"
onClick={()=>goDetail(c.id)}
>

<div className="font-bold">
{c.name}
</div>

<div className="text-sm text-gray-500">
{c.address}
</div>

</div>

))}

</div>

</div>

)

}