export default function TestCard({
  icon,
  title,
  description,
  buttonText,
  loading,
  onClick,
  disabled,
}) {
  return (
    <div className="border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition">

      <div className="text-4xl">
        {icon}
      </div>

      <h2 className="text-xl font-semibold mt-5">
        {title}
      </h2>

      <p className="text-gray-500 mt-2 min-h-[60px]">
        {description}
      </p>

      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3"
      >
        {loading ? "Creating..." : buttonText}
      </button>

    </div>
  );
}