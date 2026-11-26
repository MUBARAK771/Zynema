import { Clapperboard } from "lucide-react";
import UploadVideoForm from "@/app/components/UploadVideoForm";

export default function UploadPage() {
  return (
    <main className="mx-auto min-h-full max-w-3xl p-4 pb-10 text-zinc-100 sm:p-6">
      <header className="mb-6">
        <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-accent">
          <Clapperboard size={17} />
          Creator studio
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Upload a video</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Share an original video you have the rights to publish. Uploaded videos are public.
        </p>
      </header>
      <UploadVideoForm />
    </main>
  );
}
