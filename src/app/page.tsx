import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  ExternalLink,
  Factory,
  MapPin,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { companyData } from "@/lib/company";

export default function HomePage() {
  return (
    <div className="relative">
      <SiteHeader />

      <main>
        <section className="relative isolate px-6 pb-24 pt-16 lg:px-10 lg:pb-32 lg:pt-24">
          <div className="grid-glow absolute inset-0 opacity-30" />
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <Reveal className="relative z-10">
              <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/8 px-4 py-2 text-xs uppercase tracking-[0.28em] text-amber-100">
                {companyData.badge}
              </span>

              <h1 className="mt-8 max-w-4xl font-display text-5xl leading-tight text-white md:text-7xl">
                {companyData.headline}
              </h1>

              <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-slate-300 md:text-xl">
                {companyData.summary}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                >
                  {companyData.ctas.primary}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#process"
                  className="inline-flex items-center justify-center rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white transition hover:border-amber-300/35 hover:text-amber-200"
                >
                  {companyData.ctas.secondary}
                </a>
              </div>

              <div className="mt-14 grid gap-4 md:grid-cols-2">
                {companyData.stats.map((stat, index) => (
                  <Reveal
                    key={stat.label}
                    delay={0.08 * index}
                    className="glass-panel rounded-3xl p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-xl font-semibold text-white">{stat.value}</p>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal className="relative lg:justify-self-end" delay={0.12}>
              <div className="mesh-card glass-panel rounded-4xl p-4">
                <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10">
                  <Image
                    src="/media/granulated-slag-sand.jpeg"
                    alt="Granulated slag sand at the plant"
                    width={720}
                    height={1080}
                    priority
                    className="h-128 w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-transparent p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-amber-200">
                      Signature Product
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      Granulated Slag Sand
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                      Processed for consistency, recoverability, and industrial reuse.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel absolute -bottom-6 -left-4 max-w-xs rounded-3xl p-5 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-400/12 p-3 text-emerald-300">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Circular Processing</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Turning industrial waste into commercially valuable output.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="about" className="px-6 py-24 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal>
              <SectionHeading
                eyebrow="Who We Are"
                title="An industrial business built around material recovery and disciplined processing."
                description={companyData.description}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="glass-panel rounded-4xl p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    {
                      icon: Factory,
                      title: "Processing Expertise",
                      copy: "We handle slag intake, crushing, grading, and finished output preparation inside a practical plant workflow.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Resource Recovery",
                      copy: "Metal is separated using magnets and moved into purification streams for reuse in the industrial cycle.",
                    },
                    {
                      icon: MapPin,
                      title: "Regional Operations",
                      copy: "Our business supports supply and material recovery needs connected to the Hisar industrial belt.",
                    },
                    {
                      icon: CircleAlert,
                      title: "Waste-to-Value Model",
                      copy: "We reduce disposal burden by converting steel waste into usable materials and recoverable metal.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-white/8 bg-white/3 p-5"
                    >
                      <item.icon className="h-6 w-6 text-amber-200" />
                      <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.copy}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/10">
                  <div className="relative h-80">
                    <Image
                      src="/media/site-signboard.jpeg"
                      alt="Satluj Stones Crushing Mills office and signboard"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/75 to-transparent p-6">
                      <p className="text-xs uppercase tracking-[0.28em] text-amber-200">
                        Site Identity
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        Satluj Stones Crushing Mills at ground level
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                        A real view of the company entrance helps visitors connect the
                        business name with the actual operating site.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="process" className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionHeading
                eyebrow="Process Flow"
                title="A four-stage workflow designed for extraction, refinement, and usable output."
                description="The visitor experience explains exactly how raw slag moves through the plant and becomes two valuable industrial outcomes."
              />
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-4">
              {companyData.process.map((item, index) => (
                <Reveal key={item.step} delay={0.08 * index}>
                  <article className="glass-panel mesh-card h-full rounded-4xl p-6">
                    <p className="text-sm font-semibold text-amber-200">{item.step}</p>
                    <h3 className="mt-6 text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{item.copy}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionHeading
                eyebrow="Outputs"
                title="Two key outcomes from one recovery-driven manufacturing process."
                description="The website highlights both the sand-like finished material and the recovered metal stream, so visitors understand the complete business model."
              />
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {companyData.products.map((product, index) => (
                <Reveal key={product.title} delay={0.08 * index}>
                  <article className="glass-panel overflow-hidden rounded-4xl">
                    <div className="relative h-72 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover transition duration-700 hover:scale-105"
                      />
                    </div>
                    <div className="p-7">
                      <h3 className="text-2xl font-semibold text-white">{product.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {product.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="gallery" className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionHeading
                eyebrow="Visual Proof"
                title="Real plant visuals for visitors, buyers, and partners."
                description="Your media is already integrated into the first version so the business feels authentic from day one."
              />
            </Reveal>

            <div className="mt-12 space-y-6">
              <Reveal>
                <div className="glass-panel overflow-hidden rounded-4xl p-4">
                  <div className="relative overflow-hidden rounded-3xl border border-white/10">
                    <Image
                      src="/media/plant-yard-wide.jpeg"
                      alt="Wide view of the Satluj Stones plant yard and processing area"
                      width={1600}
                      height={900}
                      className="h-[22rem] w-full object-cover md:h-[32rem]"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-transparent p-6">
                      <p className="text-xs uppercase tracking-[0.28em] text-amber-200">
                        Plant Overview
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        A wider look at the operating yard and processing setup
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                        This panoramic view gives visitors a much clearer sense of scale,
                        machinery placement, and the working environment behind the business.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
                <Reveal>
                  <div className="glass-panel overflow-hidden rounded-4xl p-4">
                    <div className="relative overflow-hidden rounded-3xl border border-white/10">
                      <Image
                        src="/media/recovered-metal.jpeg"
                        alt="Recovered metal separated from slag"
                        width={720}
                        height={1080}
                        className="h-136 w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-transparent p-6">
                        <p className="text-xs uppercase tracking-[0.28em] text-amber-200">
                          Metal Recovery
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          Extracted and prepared for purification
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={0.08}>
                  <div className="glass-panel rounded-4xl p-4">
                    <div className="overflow-hidden rounded-3xl border border-white/10">
                      <video
                        className="h-136 w-full object-cover"
                        controls
                        preload="metadata"
                        poster="/media/granulated-slag-sand.jpeg"
                      >
                        <source src="/media/plant-overview.mp4" type="video/mp4" />
                      </video>
                    </div>
                    <div className="px-2 pb-2 pt-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        Plant Footage
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        Showcasing the operational side of the business
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        This section can keep growing as you send more production, dispatch,
                        machinery, and finished-product visuals.
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="px-6 pb-24 pt-24 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <div className="glass-panel rounded-4xl p-8">
                <SectionHeading
                  eyebrow="Founder and Contact"
                  title={companyData.founder.name}
                  description={companyData.founder.bio}
                />

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/8 bg-white/3 p-5">
                    <PhoneCall className="h-5 w-5 text-amber-200" />
                    <p className="mt-4 text-sm uppercase tracking-[0.24em] text-slate-400">
                      Call
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {companyData.contact.phone}
                    </p>
                  </div>
                  <a
                    href={companyData.contact.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-3xl border border-white/8 bg-white/3 p-5 transition hover:border-amber-300/35 hover:bg-white/5"
                  >
                    <MapPin className="h-5 w-5 text-amber-200" />
                    <p className="mt-4 text-sm uppercase tracking-[0.24em] text-slate-400">
                      Location
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {companyData.contact.address}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                      Open in Google Maps
                      <ExternalLink className="h-4 w-4" />
                    </p>
                  </a>
                  <div className="rounded-3xl border border-white/8 bg-white/3 p-5">
                    <Factory className="h-5 w-5 text-amber-200" />
                    <p className="mt-4 text-sm uppercase tracking-[0.24em] text-slate-400">
                      Business
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Industrial material processing
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="glass-panel flex h-full flex-col justify-between rounded-4xl p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
                    Founder Portrait
                  </p>
                  <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/4">
                    <div className="relative h-96">
                      <Image
                        src={companyData.founder.image}
                        alt={companyData.founder.name}
                        fill
                        className="object-cover object-top"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/78 to-transparent p-6">
                        <p className="text-xs uppercase tracking-[0.24em] text-amber-200">
                          {companyData.founder.role}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {companyData.founder.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[1.75rem] border border-amber-300/15 bg-amber-300/8 p-5">
                  <p className="text-sm font-semibold text-white">Need a quick business site update?</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    The admin dashboard route is ready as the next step for real content
                    management and inquiry handling.
                  </p>
                  <Link
                    href="/admin"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition hover:text-amber-100"
                  >
                    Open admin dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
