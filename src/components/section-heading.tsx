import { clsx } from "clsx";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={clsx("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
        {eyebrow}
      </p>
      <h2 className="font-display text-4xl leading-tight text-white md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
        {description}
      </p>
    </div>
  );
}
