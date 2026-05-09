import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <img 
              src="/logo.png" 
              alt="Jo Academy Logo" 
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              JoAcademy <span className="text-primary">JobFair</span>
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "text-sm font-medium transition-colors cursor-pointer hover:text-primary",
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
