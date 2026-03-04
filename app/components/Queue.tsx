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
maintenanceDate:string
}

export default function Queue({user,filter,goBack,goDetail}:Props){

const [clients,setClients]=useState<Client[]>([])

const load=async()=>{

const snap=await getDocs(collection(db,"clients"))

const list:Client[]=[]

snap.forEach(d=>{
const data=d.data() as Client
list.push({...data,id:d.id})
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

return(

<div className="p-4 space-y-3">

<button onClick={goBack} className="border p-2 rounded">
← Dashboard
</button>

<h1 className="font-bold text-lg">Coda Manutenzioni</h1>

{filtered.map(c=>(
<div
key={c.id}
className="border p-3 rounded cursor-pointer"
onClick={()=>goDetail(c.id)}
>
{c.name}
</div>
))}

</div>

)

}