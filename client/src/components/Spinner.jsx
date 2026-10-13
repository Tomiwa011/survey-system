const SPOKES = Array.from({ length: 12 }, (_, i) => i);

export default function Spinner({ size = 24, label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className="spinner-ios"
      style={{ width: size, height: size }}
    >
      {SPOKES.map((i) => (
        <i
          key={i}
          style={{
            transform: `rotate(${i * 30}deg)`,
            animationDelay: `${-1 + i / 12}s`,
          }}
        />
      ))}
    </span>
  );
}

export function PageLoading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
      <Spinner size={24} label={text} />
      <span>{text}</span>
    </div>
  );
}