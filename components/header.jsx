// import React from "react";
// import { Button } from "./ui/button";
// import {
//   PenBox,
//   LayoutDashboard,
//   FileText,
//   GraduationCap,
//   ChevronDown,
//   StarsIcon,
//   Search,
// } from "lucide-react";
// import Link from "next/link";
// import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import Image from "next/image";
// import { checkUser } from "@/lib/checkUser";

// export default async function Header() {
//   await checkUser();

//   return (
//     <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
//       <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
//         <Link href="/">
//           <Image
//             src={"/new-logo-2.png"}
//             alt="Prepin Logo"
//             width={400}
//             height={200}
//             quality={100}
//             className="h-52 py-1 w-auto object-contain"
//           />
//         </Link>

//         {/* Action Buttons */}
//         <div className="flex items-center space-x-2 md:space-x-4">
//           <SignedIn>
//             <Link href="/dashboard">
//               <Button
//                 variant="outline"
//                 className="hidden md:inline-flex items-center gap-2"
//               >
//                 <LayoutDashboard className="h-4 w-4" />
//                 Industry Insights
//               </Button>
//               <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
//                 <LayoutDashboard className="h-4 w-4" />
//               </Button>
//             </Link>

//             {/* Growth Tools Dropdown */}
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button className="flex items-center gap-2">
//                   <StarsIcon className="h-4 w-4" />
//                   <span className="hidden md:block">Growth Tools</span>
//                   <ChevronDown className="h-4 w-4" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-48">
//                 <DropdownMenuItem asChild>
//                   <Link href="/job-search" className="flex items-center gap-2">
//                     <Search className="h-4 w-4" />
//                     AI Job Assistant
//                   </Link>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem asChild>
//                   <Link href="/resume" className="flex items-center gap-2">
//                     <FileText className="h-4 w-4" />
//                     Build Resume
//                   </Link>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem asChild>
//                   <Link
//                     href="/ai-cover-letter"
//                     className="flex items-center gap-2"
//                   >
//                     <PenBox className="h-4 w-4" />
//                     Cover Letter
//                   </Link>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem asChild>
//                   <Link href="/interview" className="flex items-center gap-2">
//                     <GraduationCap className="h-4 w-4" />
//                     Interview Prep
//                   </Link>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </SignedIn>

//           <SignedOut>
//             <SignInButton>
//               <Button variant="outline">Sign In</Button>
//             </SignInButton>
//           </SignedOut>

//           <SignedIn>
//             <UserButton
//               appearance={{
//                 elements: {
//                   avatarBox: "w-10 h-10",
//                   userButtonPopoverCard: "shadow-xl",
//                   userPreviewMainIdentifier: "font-semibold",
//                 },
//               }}
//               afterSignOutUrl="/"
//             />
//           </SignedIn>
//         </div>
//       </nav>
//     </header>
//   );
// }

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

// Component Link điều hướng mới cho gọn gàng
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
            {/* Thêm w-32 để cố định chiều rộng */}
            <Image
              src={"/new-logo-3.png"}
              alt="Prepin Logo"
              width={120}
              height={40}
              quality={100}
              className="w-full h-full object-contain" // Để ảnh lấp đầy thẻ Link
            />
          </Link>
        </div>

        {/* Navigation Links - Chỉ hiển thị khi đã đăng nhập */}
        <SignedIn>
          {/* <div className="hidden md:flex items-center gap-6">
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
          </div> */}
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
