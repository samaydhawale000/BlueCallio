export default function DemoCard({
  title,
  description,
  icon,
  buttonText,
  onClick,
  disabled = false,
}) {
  return (
    <div
      className="rounded-2xl border border-[#233252] bg-[#0C1322] p-7 flex flex-col"
    >

      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
        {icon}
      </div>

      <h2 className="text-white text-xl font-semibold">
        {title}
      </h2>

      <p className="text-slate-400 mt-3 flex-1">
        {description}
      </p>

      <button
        disabled={disabled}
        onClick={onClick}
        className="mt-8 rounded-xl py-3 text-white font-medium transition hover:opacity-90 disabled:opacity-50"
        style={{
          background:
            "linear-gradient(135deg,#5B5DDB,#895DF6)",
        }}
      >
        {buttonText}
      </button>

    </div>
  );
}