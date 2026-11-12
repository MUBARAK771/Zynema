import { Bookmark } from "lucide-react";
import MyListClient from "@/app/components/MyListClient";

export default function MyListPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 xl:mx-4">
      <div className="mb-4 flex items-center gap-2 text-base uppercase text-[#FF3D00]">
        <Bookmark size={18} />
        <p>Personal Collection</p>
      </div>
      <h1 className="text-[26px] font-bold uppercase">My List</h1>
      <p className="mt-1 text-sm text-gray-400 xl:max-w-[54%]">
        Save movies and TV shows to revisit later. Your list is stored in this browser.
      </p>
      <MyListClient />
    </main>
  );
}
