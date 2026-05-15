import { companyData } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <p className="font-display text-lg text-white">{companyData.name}</p>
          <p>{companyData.tagline}</p>
        </div>

        <div className="flex flex-col gap-1 text-left lg:text-right">
          <a
            href={companyData.contact.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-amber-200"
          >
            {companyData.contact.address}
          </a>
          <p>{companyData.contact.phone}</p>
          <p>{companyData.contact.email}</p>
        </div>
      </div>
    </footer>
  );
}
