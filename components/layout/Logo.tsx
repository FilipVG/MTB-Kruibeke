import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative h-9 w-9 rounded-full bg-brand-gradient flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          aria-hidden
        >
          <path
            d="M5 17.5C6.65685 17.5 8 16.1569 8 14.5C8 12.8431 6.65685 11.5 5 11.5C3.34315 11.5 2 12.8431 2 14.5C2 16.1569 3.34315 17.5 5 17.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M19 17.5C20.6569 17.5 22 16.1569 22 14.5C22 12.8431 20.6569 11.5 19 11.5C17.3431 11.5 16 12.8431 16 14.5C16 16.1569 17.3431 17.5 19 17.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5 14.5L9 8H14L11 14.5H17M14 8L13 6H11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold text-white tracking-wide">MTB</span>
        <span className="text-sm font-semibold text-brand-400 tracking-wide -mt-0.5">Kruibeke</span>
      </div>
    </div>
  );
}
