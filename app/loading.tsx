const bars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#16181C]">
      <div
        className="flex items-end gap-[5px]"
        aria-label="Loading"
        role="status"
      >
        {bars.map((bar) => (
          <span
            key={bar}
            className="bars-loader-bar"
            style={{
              animationDelay: `${bar * 0.08}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
