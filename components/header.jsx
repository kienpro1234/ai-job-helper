import React from "react";
import {
  PenBox,
  LayoutDashboard,
  FileText,
  GraduationCap,
  Search,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { checkUser } from "@/lib/checkUser";
import { Button } from "./ui/button";
import { NavigationMenu } from "./navigation-menu";

const NavLink = ({ href, children }) => (
  <Link
    href={href}
    className="nav-link text-sm font-medium text-muted-foreground transition-colors"
  >
    {children}
  </Link>
);

export default async function Header() {
  await checkUser();

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center h-full flex-shrink-0">
          <Link href="/" className="h-full w-32 flex items-center">
            {" "}
            <Image
              src={"/new-logo-3.png"}
              alt="Prepin Logo"
              width={120}
              height={40}
              quality={100}
              className="w-full h-full object-contain"
            />
          </Link>
        </div>

        {/* Navigation Links - Chỉ hiển thị khi đã đăng nhập */}
        <SignedIn>
          <NavigationMenu />
        </SignedIn>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
