// File: ai-job-help/components/navigation-menu.jsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PenBox,
  LayoutDashboard,
  FileText,
  GraduationCap,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Component Link điều hướng đã được nâng cấp
const NavLink = ({ href, children }) => {
  const pathname = usePathname();
  // Một link được coi là active nếu URL hiện tại bắt đầu bằng href của link đó
  // Ví dụ: khi ở /resume/some-id, link /resume vẫn sẽ active
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "nav-link text-sm font-medium text-muted-foreground transition-colors",
        isActive && "active" // Thêm class 'active' nếu link đang được chọn
      )}
    >
      {children}
    </Link>
  );
};

export function NavigationMenu() {
  return (
    <div className="hidden md:flex items-center gap-6">
      <NavLink href="/dashboard">
        <LayoutDashboard className="h-4 w-4 mr-1" />
        Industry Insights
      </NavLink>
      <NavLink href="/job-search">
        <Search className="h-4 w-4 mr-1" />
        Job Assistant
      </NavLink>
      <NavLink href="/resume">
        <FileText className="h-4 w-4 mr-1" />
        Resume Builder
      </NavLink>
      <NavLink href="/ai-cover-letter">
        <PenBox className="h-4 w-4 mr-1" />
        Cover Letter
      </NavLink>
      <NavLink href="/interview">
        <GraduationCap className="h-4 w-4 mr-1" />
        Interview Prep
      </NavLink>
    </div>
  );
}
