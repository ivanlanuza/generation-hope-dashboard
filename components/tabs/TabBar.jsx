"use client";
export default function TabBar({ active, onChange, tabs }) {
  return (
    <div className="border-b flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange?.(t.id)}
          aria-pressed={active === t.id}
          className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
            active === t.id
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
