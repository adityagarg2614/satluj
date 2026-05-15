import Link from "next/link";

const navItems = [
  { href: "#about", label: "About" },
  { href: "#process", label: "Process" },
  { href: "#products", label: "Products" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(8,12,18,0.75)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-sm font-semibold text-amber-200">
            SS
          </span>
          <div>
            <p className="font-display text-lg text-white">Satluj Stones</p>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Crushing Mills
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-200 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition hover:text-amber-200"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/40 hover:text-white"
          >
            Admin
          </Link>
          <a
            href="#contact"
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-200"
          >
            Contact
          </a>
        </div>
      </div>
    </header>
  );
}
