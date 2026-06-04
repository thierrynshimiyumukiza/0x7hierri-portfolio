import Link from "next/link";

export default function SectionHeader({
  title,
  href,
  linkText = "see all →",
}: {
  title: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.6rem",
      }}
    >
      <span
        style={{
          fontSize: "10.5px",
          textTransform: "uppercase",
          letterSpacing: "1.4px",
          color: "var(--text-dim)",
          fontFamily: "var(--font-mono), monospace",
          display: "flex",
          alignItems: "center",
          gap: "7px",
        }}
      >
        <span
          style={{
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "var(--accent-blue)",
            display: "inline-block",
          }}
        />
        {title}
      </span>
      {href ? (
        <Link
          href={href}
          style={{
            fontSize: "11.5px",
            color: "var(--accent-blue)",
            textDecoration: "none",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {linkText}
        </Link>
      ) : null}
    </div>
  );
}
