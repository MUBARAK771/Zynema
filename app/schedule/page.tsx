import { Calendar } from "lucide-react";
import ScheduleClient from "@/app/components/ScheduleClient";
import { getNigeriaDate } from "@/lib/tv-schedule";

export default function SchedulePage() {
  return (
    <main className="mx-auto max-w-5xl p-6 xl:mx-4">
      <div className="mb-4 flex items-center gap-2 text-base uppercase text-[#FF3D00]">
        <Calendar size={18} />
        <p>Nigeria Programming</p>
      </div>
      <h1 className="text-[26px] font-bold uppercase">TV Schedule</h1>
      <p className="mt-1 text-sm text-gray-400">
        Browse upcoming programmes across DStv Nigeria channels. Search by channel name or number
        to find what is on.
      </p>
      <ScheduleClient initialDate={getNigeriaDate()} />
    </main>
  );
}
