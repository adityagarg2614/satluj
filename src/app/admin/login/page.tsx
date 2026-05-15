import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/auth/session";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "missing-fields": "Please enter both email and password.",
  "invalid-credentials": "The email or password is incorrect.",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel rounded-4xl p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
            Secure Admin Access
          </p>
          <h1 className="mt-5 font-display text-5xl text-white">
            Login to manage workers and attendance.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            This area is protected for the business administrator only. Once you sign
            in, you can add workers, mark attendance, and manage future internal tools.
          </p>

          <div className="mt-10 grid gap-4">
            {[
              "Single-admin access with email and password",
              "Protected routes for all admin pages",
              "MongoDB-backed worker and attendance records",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/8 bg-white/3 px-5 py-4 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition hover:text-amber-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
        </section>

        <section className="glass-panel rounded-4xl p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-200">
              <LockKeyhole className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-3xl font-semibold text-white">Admin Login</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use the admin email and password configured in your environment variables.
            </p>

            {error ? (
              <div className="mt-6 rounded-3xl border border-rose-300/20 bg-rose-300/10 px-5 py-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <form action={loginAction} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Admin Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="admin@satlujstones.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Password</span>
                <input
                  type="password"
                  name="password"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-amber-300/40"
                  placeholder="Enter your password"
                />
              </label>

              <SubmitButton
                label="Login to dashboard"
                pendingLabel="Checking access..."
                className="inline-flex w-full items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>

            <div className="mt-8 rounded-3xl border border-white/8 bg-white/3 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                <p className="text-sm leading-6 text-slate-300">
                  On the first successful setup, the single admin account is seeded into
                  MongoDB using your environment variables.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
