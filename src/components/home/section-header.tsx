import Link from "next/link";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: { label: string; href: string };
  id?: string;
};

/** Section title on the left, optional "view all" link on the right. */
export function SectionHeader({ eyebrow, title, action, id }: SectionHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
      <div className="flex flex-col gap-2">
        {eyebrow && <p className="type-caption text-muted">{eyebrow}</p>}
        <h2 id={id} className="type-title-l">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="link-cta shrink-0">
          {action.label}
        </Link>
      )}
    </div>
  );
}
