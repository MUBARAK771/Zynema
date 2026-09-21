import { Bookmark } from "lucide-react";
import Link from "next/link";

const saved = [
  "Starship Frontier",
  "The Great Beyond",
  "Neon Chronicles",
  "Silent Witness",
];

export default function MyListPage() {
  return (
    <main className=" max-w-5xl p-6 xl:mx-4">
         <div className="text-[#FF3D00] flex items-center gap-2 uppercase text-base mb-4">
          <Bookmark size={18} />
          <p>PERSONAL COLLECTION</p>
         </div>
         <div>
          <div className=" flex flex-col">
            <h5 className="uppercase font-bold text-[26px] ">My Watchlist</h5>
            <p className=" text-gray-400 text-[14px] xl:max-w-[54%]" >Manage your viewing progress across your favorite TV shows and movies. Sync across all devices.</p>
          </div>
         </div>
        </main>
  );
}
