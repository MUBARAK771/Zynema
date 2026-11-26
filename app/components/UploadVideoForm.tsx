"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDashboardUser } from "@/app/components/AuthGate";

const maxVideoSize = 100 * 1024 * 1024;
const acceptedMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export default function UploadVideoForm() {
  const user = useDashboardUser();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!file || !acceptedMimeTypes.has(file.type)) {
      setError("Choose an MP4, WebM, or QuickTime video.");
      return;
    }
    if (file.size <= 0 || file.size > maxVideoSize) {
      setError("Video files must be smaller than 100 MB.");
      return;
    }
    if (!user?.id) {
      setError("Your account could not be verified. Please sign in again.");
      return;
    }

    setBusy(true);
    try {
      setStatus("Preparing your creator profile…");
      const profileResponse = await fetch("/api/auth/profile", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const profileResult = (await profileResponse.json()) as { error?: string };
      if (!profileResponse.ok) {
        throw new Error(profileResult.error || "Your creator profile could not be prepared.");
      }

      setStatus("Preparing secure upload…");
      const uploadUrlResponse = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ mimeType: file.type, sizeBytes: file.size }),
      });
      const uploadUrlResult = (await uploadUrlResponse.json()) as {
        signedUrl?: string;
        objectPath?: string;
        error?: string;
      };
      if (!uploadUrlResponse.ok || !uploadUrlResult.signedUrl || !uploadUrlResult.objectPath) {
        throw new Error(uploadUrlResult.error || "A secure upload could not be started.");
      }

      setStatus("Uploading video…");
      const storageResponse = await fetch(uploadUrlResult.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: file,
      });
      if (!storageResponse.ok) {
        throw new Error("The video file could not be uploaded. Please try again.");
      }

      setStatus("Publishing video…");
      const publishResponse = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title,
          description,
          objectPath: uploadUrlResult.objectPath,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const publishResult = (await publishResponse.json()) as { error?: string };
      if (!publishResponse.ok) {
        throw new Error(publishResult.error || "Your video could not be published.");
      }

      router.push(`/creators/${user.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The video could not be uploaded.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-[#242529] bg-base-panel p-4 sm:p-6"
    >
      <label className="block text-sm text-zinc-300">
        Video title
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={120}
          className="mt-2 w-full rounded-lg border border-[#34363a] bg-[#101215] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff765c]"
        />
      </label>

      <label className="block text-sm text-zinc-300">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={4}
          className="mt-2 w-full resize-y rounded-lg border border-[#34363a] bg-[#101215] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff765c]"
        />
      </label>

      <label className="block text-sm text-zinc-300">
        Video file
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          required
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-lg border border-[#34363a] bg-[#101215] px-3 py-2.5 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#ff3d00] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        <span className="mt-2 block text-xs text-zinc-500">
          MP4, WebM, or QuickTime; maximum size 100 MB.
        </span>
      </label>

      <label className="flex items-start gap-3 text-xs leading-5 text-zinc-400">
        <input type="checkbox" required className="mt-1 accent-[#ff3d00]" />
        <span>
          I own or have permission to publish this video, and understand it will be publicly
          accessible.
        </span>
      </label>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {status ? <p role="status" className="text-sm text-zinc-300">{status}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-[#f04427] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff6040] disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Publish video"}
      </button>
    </form>
  );
}
