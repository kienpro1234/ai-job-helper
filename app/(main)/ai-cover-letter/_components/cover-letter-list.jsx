// "use client";

// import { useRouter } from "next/navigation";
// import { format } from "date-fns";
// import { Edit2, Eye, Trash2, Globe  } from "lucide-react";
// import { toast } from "sonner";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import { deleteCoverLetter } from "@/actions/cover-letter";
// import { Badge } from "@/components/ui/badge";

// export default function CoverLetterList({ coverLetters }) {
//   const router = useRouter();

//   const handleDelete = async (id) => {
//     try {
//       await deleteCoverLetter(id);
//       toast.success("Cover letter deleted successfully!");
//       router.refresh();
//     } catch (error) {
//       toast.error(error.message || "Failed to delete cover letter");
//     }
//   };

//   if (!coverLetters?.length) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>No Cover Letters Yet</CardTitle>
//           <CardDescription>
//             Create your first cover letter to get started
//           </CardDescription>
//         </CardHeader>
//       </Card>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {coverLetters.map((letter) => (
//         <Card key={letter.id} className="group relative ">
//           <CardHeader>
//             <div className="flex items-start justify-between">
//               <div>
//                 <CardTitle className="text-xl gradient-title">
//                   {letter.jobTitle} at {letter.companyName}
//                 </CardTitle>
//                 <CardDescription>
//                   Created {format(new Date(letter.createdAt), "PPP")}
//                 </CardDescription>
//               </div>
//               <div className="flex space-x-2">
//                 <AlertDialog>
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
//                   >
//                     <Eye className="h-4 w-4" />
//                   </Button>
//                   <AlertDialogTrigger asChild>
//                     <Button variant="outline" size="icon">
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </AlertDialogTrigger>
//                   <AlertDialogContent>
//                     <AlertDialogHeader>
//                       <AlertDialogTitle>Delete Cover Letter?</AlertDialogTitle>
//                       <AlertDialogDescription>
//                         This action cannot be undone. This will permanently
//                         delete your cover letter for {letter.jobTitle} at{" "}
//                         {letter.companyName}.
//                       </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                       <AlertDialogCancel>Cancel</AlertDialogCancel>
//                       <AlertDialogAction
//                         onClick={() => handleDelete(letter.id)}
//                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//                       >
//                         Delete
//                       </AlertDialogAction>
//                     </AlertDialogFooter>
//                   </AlertDialogContent>
//                 </AlertDialog>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="text-muted-foreground text-sm line-clamp-3">
//               {letter.jobDescription}
//             </div>
//           </CardContent>
//         </Card>
//       ))}
//     </div>
//   );
// }

"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, Trash2, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCoverLetter } from "@/actions/cover-letter";
import { Badge } from "@/components/ui/badge";

export default function CoverLetterList({ coverLetters }) {
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id);
      toast.success("Cover letter deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to delete cover letter");
    }
  };

  if (!coverLetters?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Cover Letters Yet</CardTitle>
          <CardDescription>
            Create your first cover letter to get started
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {coverLetters.map((letter) => (
        <Card
          key={letter.id}
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 overflow-hidden">
                <CardTitle className="text-xl gradient-title truncate">
                  {letter.jobTitle} at {letter.companyName}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>
                    Created {format(new Date(letter.createdAt), "PPP")}
                  </span>
                  {letter.jobSource && (
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> {letter.jobSource}
                    </span>
                  )}
                </div>
              </div>
              <div
                className="flex space-x-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {letter.jobUrl && letter.jobSource && letter.sourceType && (
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={letter.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Cover Letter?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your cover letter for {letter.jobTitle} at{" "}
                        {letter.companyName}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(letter.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          {letter.jobDescription && (
            <CardContent>
              <p className="text-muted-foreground text-sm line-clamp-3 italic">
                &quot;{letter.jobDescription}&quot;
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
