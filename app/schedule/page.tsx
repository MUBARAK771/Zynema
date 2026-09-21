import { Calendar } from "lucide-react";
import Link from "next/link";

// const days = [
//   { day: "Monday", shows: ["The Last Signal", "Night Harbor"] },
//   { day: "Tuesday", shows: ["Dust Riders", "The Hollow Crown"] },
//   { day: "Wednesday", shows: ["Glass Echo", "Orbit 9"] },
//   { day: "Thursday", shows: ["Velvet Run", "Blue Vault"] },
// ];

export default function SchedulePage() {
  return (
    <main className=" max-w-5xl p-6 xl:mx-4">
     <div className="text-[#FF3D00] flex items-center gap-2 uppercase text-base mb-4">
      <Calendar size={18} />
      <p>Global Programming</p>
     </div>
     <div>
      <div className=" flex flex-col">
        <h5 className="uppercase font-bold text-[26px] ">TV Schedule</h5>
        <p className=" text-gray-400 text-[14px]" >Plan your viewing week with our comprehensive guide across all platforms.</p>
      </div>
     </div>
    </main>
  );
}
