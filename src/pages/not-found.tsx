import { FileText } from "lucide-react";

export function NotFound() {
  return (
    <section className="flex h-full w-full items-center justify-center bg-white p-6 text-center">
      <div>
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-xl font-semibold text-slate-800">Select a note</h2>
        <p className="mt-2 text-base text-slate-500">
          Choose a note from the list on the left, or create a new one to get started.
        </p>
      </div>
    </section>
  );
}
