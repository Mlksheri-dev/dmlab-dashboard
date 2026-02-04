import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground relative overflow-hidden cyber-grid">
      {/* Global Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      <DashboardSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />

      <main className={`flex-1 overflow-auto transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${!isMobile && sidebarOpen ? 'ml-60' : 'ml-0'}`}>
        <div className="pl-14 md:pl-0 relative z-10 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}


