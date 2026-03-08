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

export default function Calendar({user,goBack,goDetail}:Props){

const [clients,setClients]=useState<Client[]>([])
const [currentDate,setCurrentDate]=useState(new Date())

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

const startOfMonth=new Date(currentDate.getFullYear(),currentDate.getMonth(),1)
const endOfMonth=new Date(currentDate.getFullYear(),currentDate.getMonth()+1,0)

const days=endOfMonth.getDate()

const openNavigation=(address:string)=>{

const url=
"https://www.google.com/maps/search/?api=1&query="+
encodeURIComponent(address)

window.open(url,"_blank")

}

const nextMonth=()=>{
setCurrentDate(
new Date(currentDate.getFullYear(),currentDate.getMonth()+1,1)
)
}

const prevMonth=()=>{
setCurrentDate(
new Date(currentDate.getFullYear(),currentDate.getMonth()-1,1)
)
}

const getClientsForDay=(day:number)=>{

return clients.filter(c=>{

const d=new Date(c.maintenanceDate)

return(
d.getFullYear()===currentDate.getFullYear() &&
d.getMonth()===currentDate.getMonth() &&
d.getDate()===day
)

})

}

return(

<div className="p-4 space-y-4">

<button
onClick={goBack}
className="border p-2 rounded"
>
← Dashboard
</button>

<div className="flex justify-between items-center">

<button
onClick={prevMonth}
className="border px-3 py-1 rounded"
>
◀
</button>

<h1 className="text-xl font-bold">

{currentDate.toLocaleString("it-IT",{month:"long",year:"numeric"})}

</h1>

<button
onClick={nextMonth}
className="border px-3 py-1 rounded"
>
▶
</button>

</div>

<div className="grid grid-cols-7 gap-2">

{Array.from({length:days},(_,i)=>{

const day=i+1

const dayClients=getClientsForDay(day)

return(

<div
key={day}
className="border p-2 rounded min-h-[90px] text-xs"
>

<div className="font-bold">
{day}
</div>

{dayClients.map(c=>(

<div key={c.id} className="mt-1 space-y-1">

<div
className="cursor-pointer text-blue-700"
onClick={()=>goDetail(c.id)}
>
{c.name}
</div>

<button
onClick={()=>openNavigation(c.address)}
className="bg-green-600 text-white px-1 py-0.5 rounded text-[10px]"
>
🧭
</button>

</div>

))}

</div>

)

})}

</div>

</div>

)

}