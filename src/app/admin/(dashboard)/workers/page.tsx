import { Plus, Users } from "lucide-react";

import { addWorkerAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";
import { connectToDatabase } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { WorkerModel } from "@/models/worker";

export const dynamic = "force-dynamic";

type WorkerPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "worker-added": "Worker added successfully.",
};

const errorMessages: Record<string, string> = {
  "worker-fields": "Please complete every required worker field before saving.",
};

export default async function WorkersPage({ searchParams }: WorkerPageProps) {
  await connectToDatabase();

  const [params, workers] = await Promise.all([
    searchParams,
    WorkerModel.find().sort({ createdAt: -1 }).lean(),
  ]);

  const successMessage = params.success ? successMessages[params.success] : null;
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="mx-auto max-w-7xl">
      {successMessage ? (
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm text-emerald-100">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-3xl border border-rose-300/20 bg-rose-300/10 px-5 py-4 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <section className={`${successMessage || errorMessage ? "mt-6" : ""} grid gap-6 xl:grid-cols-[0.9fr_1.1fr]`}>
        <div className="glass-panel rounded-4xl p-7">
          <div className="flex items-center gap-3">
            <Plus className="size-5 text-amber-200" />
            <h1 className="text-xl font-semibold text-white">Add Worker</h1>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Save each worker once so the attendance system can use the same roster daily.
          </p>

          <form action={addWorkerAction} className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Worker Name</span>
              <input
                type="text"
                name="name"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                placeholder="Enter worker name"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Role</span>
                <input
                  type="text"
                  name="role"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="Crusher operator, helper, loader..."
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Joining Date</span>
                <input
                  type="date"
                  name="joiningDate"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Phone Number</span>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="+91-98XXXXXXXX"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Photo URL (optional)</span>
              <input
                type="url"
                name="photoUrl"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                placeholder="https://example.com/photo.jpg"
              />
            </label>

            <SubmitButton
              label="Save Worker"
              pendingLabel="Saving worker..."
              className="mt-2 inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </div>

        <div className="glass-panel rounded-4xl p-7">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-amber-200" />
            <h2 className="text-xl font-semibold text-white">Worker Roster</h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Every saved worker appears here and becomes available inside attendance marking.
          </p>

          {workers.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-6 text-slate-300">
              No workers in the database yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {workers.map((worker) => (
                <article
                  key={worker._id.toString()}
                  className="rounded-3xl border border-white/8 bg-white/3 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{worker.name}</p>
                      <p className="mt-1 text-sm text-amber-200">{worker.role}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                      Worker
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p>Joined: {formatDate(worker.joiningDate)}</p>
                    <p>Phone: {worker.phoneNumber}</p>
                    <p>Photo: {worker.photoUrl ? "Added" : "Not added"}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
