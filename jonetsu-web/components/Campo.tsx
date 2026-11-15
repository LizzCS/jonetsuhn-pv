type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

export default function Campo({ label, id, ...rest }: Props) {
  const campoId = id ?? rest.name;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={campoId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={campoId}
        {...rest}
        className="w-full rounded-lg border border-ink/25 bg-paper px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
      />
    </div>
  );
}
