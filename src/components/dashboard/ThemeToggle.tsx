import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isL = savedTheme === 'light';
        setIsLight(isL);
        if (isL) {
            document.documentElement.classList.add('light');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isLight;
        setIsLight(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.remove('light');
            localStorage.setItem('theme', 'dark');
        }
    };

    return (
        <Button
            onClick={toggleTheme}
            variant="ghost"
            className={cn(
                "w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl transition-all duration-500 group border border-white/5 hover:border-white/20 bg-white/[0.03]",
                isLight ? "text-primary bg-primary/5" : "text-white/40 hover:text-white"
            )}
        >
            <div className="flex items-center gap-3">
                {isLight ? (
                    <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                ) : (
                    <Moon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    {isLight ? 'Light Mode' : 'Dark Mode'}
                </span>
            </div>
            <div className={cn(
                "w-8 h-4 rounded-full relative transition-all duration-500 border border-white/10",
                isLight ? "bg-primary" : "bg-white/10"
            )}>
                <div className={cn(
                    "absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-sm",
                    isLight ? "right-1 bg-white" : "left-1 bg-white/40"
                )} />
            </div>
        </Button>
    );
}
