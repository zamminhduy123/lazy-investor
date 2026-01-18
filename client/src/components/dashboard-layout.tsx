import { ReactNode } from "react";
import { Link } from "wouter";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-slate-900 rounded-sm flex items-center justify-center text-white font-bold text-xs group-hover:bg-slate-800 transition-colors">
              L
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900">
              Lazy Investor
            </span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              VN Market • Live
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                alt="User"
                className="w-full h-full object-cover" 
              />
            </div>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="py-8 text-center text-xs text-slate-400">
        <p>© 2026 Lazy Investor Inc. Data provided for informational purposes only.</p>
      </footer>
    </div>
  );
}
