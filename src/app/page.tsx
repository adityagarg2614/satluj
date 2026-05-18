import Image from "next/image";
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
        <section className="relative isolate px-6 pb-18 pt-12 sm:pb-20 sm:pt-14 lg:px-10 lg:pb-28 lg:pt-20">
          <div className="grid-glow absolute inset-0 opacity-30" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-14">
            <Reveal className="relative z-10">
              <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/8 px-4 py-2 text-xs uppercase tracking-[0.28em] text-amber-100">
                {companyData.badge}
              </span>

              <h1 className="mt-7 max-w-4xl font-display text-4xl leading-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
                {companyData.headline}
              </h1>

              <p className="mt-5 max-w-2xl text-balance text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 md:text-xl">
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

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {companyData.stats.map((stat, index) => (
                  <Reveal
                    key={stat.label}
                    delay={0.08 * index}
                    className="glass-panel rounded-3xl p-5 sm:p-6"
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
                    className="h-88 w-full object-cover sm:h-112 lg:h-136 xl:h-160"
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

              <div className="glass-panel mt-4 max-w-xs rounded-3xl p-5 backdrop-blur-xl lg:absolute lg:-bottom-6 lg:-left-4 lg:mt-0">
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

        <section id="about" className="px-6 py-18 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <Reveal>
              <SectionHeading
                eyebrow="Who We Are"
                title="An industrial business built around material recovery and disciplined processing."
                description={companyData.description}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="glass-panel rounded-4xl p-6 lg:p-8">
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
                  <div className="relative h-64 sm:h-80">
                    <Image
                      src="/media/site-signboard.jpeg"
                      alt="Satluj Stones Crushing Mills office and signboard"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

        <section id="process" className="px-6 py-18 sm:py-20 lg:px-10 lg:py-24">
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
                  <article className="glass-panel mesh-card h-full rounded-4xl p-5 lg:p-6">
                    <p className="text-sm font-semibold text-amber-200">{item.step}</p>
                    <h3 className="mt-5 text-xl font-semibold text-white lg:text-2xl">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{item.copy}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="px-6 py-18 sm:py-20 lg:px-10 lg:py-24">
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
                    <div className="relative h-60 overflow-hidden sm:h-72">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition duration-700 hover:scale-105"
                      />
                    </div>
                    <div className="p-6 lg:p-7">
                      <h3 className="text-xl font-semibold text-white lg:text-2xl">{product.title}</h3>
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

        <section id="gallery" className="px-6 py-18 sm:py-20 lg:px-10 lg:py-24">
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
                      className="h-72 w-full object-cover sm:h-88 md:h-112 lg:h-128"
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
                        className="h-88 w-full object-cover sm:h-112 lg:h-136"
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
                        className="h-88 w-full object-cover sm:h-112 lg:h-136"
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

        <section id="contact" className="px-6 pb-18 pt-18 sm:pb-20 sm:pt-20 lg:px-10 lg:pb-24 lg:pt-24">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Reveal>
              <div className="glass-panel rounded-4xl p-6 lg:p-8">
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

                  <a
                    href={companyData.contact.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/3 transition hover:border-amber-300/35 hover:bg-white/5 md:col-span-3"
                  >
                    <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className="p-5 md:p-6">
                        <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-300/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100">
                          <MapPin className="h-3.5 w-3.5" />
                          Live Location
                        </p>
                        <h3 className="mt-4 text-2xl font-semibold text-white">
                          See Satluj Stones on the map
                        </h3>
                        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                          Open the exact plant location in Google Maps for directions and
                          on-ground reference.
                        </p>
                        <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition group-hover:text-amber-100">
                          Open in Google Maps
                          <ExternalLink className="h-4 w-4" />
                        </p>
                      </div>

                      <div className="relative min-h-64 overflow-hidden border-t border-white/8 lg:min-h-full lg:border-l lg:border-t-0">
                        <iframe
                          src={companyData.contact.mapEmbedUrl}
                          title="Satluj Stones Crushing Mills location map"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="absolute inset-0 h-full w-full"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-l from-transparent via-transparent to-slate-950/12" />
                        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/12 bg-slate-950/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md">
                          Satluj Stones
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="glass-panel flex h-full flex-col justify-between rounded-4xl p-6 lg:p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-amber-200">
                    Founder Portrait
                  </p>
                  <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/4">
                    <div className="relative h-88 sm:h-112">
                      <Image
                        src={companyData.founder.image}
                        alt={companyData.founder.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
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


              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
