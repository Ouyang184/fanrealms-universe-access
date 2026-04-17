import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white text-[#111] flex flex-col">
      <header className="border-b border-[#eee]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link to="/"><Logo /></Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px] mb-3">
            Error 404
          </div>
          <h1 className="text-[32px] font-bold tracking-[-1px] leading-tight mb-3">
            Page not found
          </h1>
          <p className="text-[14px] text-[#777] leading-relaxed mb-6">
            The page <span className="font-mono text-[#555] bg-[#f5f5f5] px-1.5 py-0.5 rounded text-[12px]">{location.pathname}</span>{' '}
            doesn't exist or has been moved.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#be123c] transition-colors"
            >
              Back to home
            </Link>
            <Link
              to="/marketplace"
              className="px-5 py-2.5 text-[13px] font-semibold text-[#333] bg-[#f5f5f5] rounded-[10px] hover:bg-[#eee] transition-colors"
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
