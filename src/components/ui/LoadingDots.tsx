export function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '1000ms',
          }}
        />
      ))}
    </div>
  )
}
