'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Icons.dashboard className="h-5 w-5" />,
    },
    {
      title: "Incidents",
      href: "/incidents",
      icon: <Icons.incident className="h-5 w-5" />,
    },
    {
      title: "Alerts",
      href: "/alerts",
      icon: <Icons.alert className="h-5 w-5" />,
    },
    {
      title: "Integrations",
      href: "/integrations",
      icon: <Icons.integration className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <Icons.report className="h-5 w-5" />,
    },
  ];

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Icons.logo className="h-6 w-6" />
            <span className="">SOAR Platform</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === item.href && "bg-muted text-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          {/* <UserDropdown /> */}
        </div>
      </div>
    </div>
  );
}