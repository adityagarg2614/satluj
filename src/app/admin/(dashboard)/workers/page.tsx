import { Plus, Trash2, Users } from "lucide-react";

import {
  deleteWorkerAction,
  updateWorkerSalaryAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AdminStatusToast } from "@/components/admin-toast";
import { WorkerForm } from "@/components/worker-form";
import { SubmitButton } from "@/components/submit-button";
import { connectToDatabase } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import {
  getWorkerRoleLabel,
  resolveWorkerType,
  sortWorkersForAdmin,
} from "@/lib/worker-utils";
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
  "worker-deleted": "Worker deleted successfully.",
  "worker-salary-updated": "Worker salary updated successfully.",
};

const errorMessages: Record<string, string> = {
  "worker-fields": "Please complete every required worker field before saving.",
  "worker-delete-missing": "Unable to delete worker because the worker id was missing.",
  "worker-salary-fields": "Please enter a valid salary before updating.",
};

export default async function WorkersPage({ searchParams }: WorkerPageProps) {
  await connectToDatabase();

  const [params, workers] = await Promise.all([
    searchParams,
    WorkerModel.find().lean(),
  ]);

  const successMessage = params.success ? successMessages[params.success] : null;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const sortedWorkers = sortWorkersForAdmin(workers);
  const permanentWorkers = sortedWorkers.filter(
    (worker) => resolveWorkerType(worker) === "permanent",
  );
  const dihadiWorkers = sortedWorkers.filter(
    (worker) => resolveWorkerType(worker) === "dihadi",
  );

  return (
    <main className="mx-auto max-w-7xl">
      <AdminStatusToast successMessage={successMessage} errorMessage={errorMessage} />

      <section className="grid gap-6">
        <div className="glass-panel rounded-4xl p-7">
          <div className="flex items-center gap-3">
            <Plus className="size-5 text-amber-200" />
            <h1 className="text-xl font-semibold text-white">Add Worker</h1>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Save each worker once so the attendance system can use the same roster daily.
          </p>

          <WorkerForm />
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
            <div className="mt-6 space-y-8">
              {[
                {
                  title: "Permanent Workers",
                  workers: permanentWorkers,
                  salaryLabel: "Monthly Salary",
                },
                {
                  title: "Dihadi Workers",
                  workers: dihadiWorkers,
                  salaryLabel: "Daily Rate",
                },
              ].map((section) =>
                section.workers.length > 0 ? (
                  <div key={section.title}>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                        {section.workers.length} workers
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {section.workers.map((worker) => {
                        const workerType = resolveWorkerType(worker);
                        const isDihadi = workerType === "dihadi";

                        return (
                          <article
                            key={worker._id.toString()}
                            className="rounded-3xl border border-white/8 bg-white/3 p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-lg font-semibold text-white">{worker.name}</p>
                                <p className="mt-1 text-sm text-amber-200">
                                  {getWorkerRoleLabel(worker)}
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                                {isDihadi ? "Dihadi" : "Permanent"}
                              </span>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-300">
                              {!isDihadi ? <p>Joined: {formatDate(worker.joiningDate)}</p> : null}
                              <p>
                                {section.salaryLabel}: Rs. {formatNumber(worker.salary ?? 0)}
                                {isDihadi ? " / day" : " / month"}
                              </p>
                              {!isDihadi && worker.phoneNumber ? (
                                <p>Phone: {worker.phoneNumber}</p>
                              ) : null}
                              <p>Photo: {worker.photoUrl ? "Added" : "Not added"}</p>
                            </div>

                            <form
                              action={updateWorkerSalaryAction}
                              className="mt-5 flex flex-col gap-3 sm:flex-row"
                            >
                              <input
                                type="hidden"
                                name="workerId"
                                value={worker._id.toString()}
                              />
                              <input type="hidden" name="returnTo" value="/admin/workers" />
                              <input
                                type="number"
                                name="salary"
                                min="0"
                                step="0.01"
                                defaultValue={worker.salary ?? 0}
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/40"
                              />
                              <SubmitButton
                                label={isDihadi ? "Update Daily Rate" : "Update Salary"}
                                pendingLabel="Updating..."
                                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/4 px-4 py-3 text-sm font-semibold text-white transition hover:border-amber-300/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </form>

                            <form action={deleteWorkerAction} className="mt-5">
                              <input
                                type="hidden"
                                name="workerId"
                                value={worker._id.toString()}
                              />
                              <input type="hidden" name="returnTo" value="/admin/workers" />
                              <ConfirmSubmitButton
                                label={
                                  <span className="inline-flex items-center gap-2">
                                    <Trash2 className="size-4" />
                                    Delete Worker
                                  </span>
                                }
                                pendingLabel="Deleting worker..."
                                confirmMessage="Delete this worker? Their attendance records will also be removed."
                                className="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </form>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
