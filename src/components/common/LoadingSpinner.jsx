export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin"></div>
        <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-t-secondary animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.8s' }}></div>
      </div>
      <p className="text-xs text-text-secondary font-medium tracking-wide">{text}</p>
    </div>
  );
}
