"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Eye,
  Trash2,
  Globe,
  ExternalLink,
  Loader2,
  X,
  CheckCheck,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  deleteCoverLetter,
  deleteMultipleCoverLetters,
} from "@/actions/cover-letter";

export default function CoverLetterList({ coverLetters: initialCoverLetters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [coverLetters, setCoverLetters] = useState(initialCoverLetters);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedLetters, setSelectedLetters] = useState(new Set());

  const handleSingleDelete = (id, title) => {
    startTransition(async () => {
      const result = await deleteCoverLetter(id);
      if (result.success) {
        toast.success(`Đã xóa cover letter "${title}"`);
        setCoverLetters((prev) => prev.filter((cl) => cl.id !== id));
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedLetters.size === 0) {
      toast.info("Vui lòng chọn ít nhất một thư để xóa.");
      return;
    }
    startTransition(async () => {
      const idsToDelete = Array.from(selectedLetters);
      const result = await deleteMultipleCoverLetters(idsToDelete);
      if (result.success) {
        toast.success(`Đã xóa ${idsToDelete.length} cover letter.`);
        setCoverLetters((prev) =>
          prev.filter((cl) => !idsToDelete.includes(cl.id))
        );
        setIsBulkDeleteMode(false);
        setSelectedLetters(new Set());
      } else {
        toast.error(result.error);
      }
    });
  };

  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode(!isBulkDeleteMode);
    setSelectedLetters(new Set());
  };

  const handleToggleSelection = (id) => {
    const newSelection = new Set(selectedLetters);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedLetters(newSelection);
  };

  if (coverLetters.length === 0 && initialCoverLetters.length === 0) {
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
      <div className="flex justify-end gap-2">
        {coverLetters.length > 0 &&
          (isBulkDeleteMode ? (
            <>
              <Button
                variant="ghost"
                onClick={toggleBulkDeleteMode}
                disabled={isPending}
              >
                <X className="mr-2 h-4 w-4" /> Hủy
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isPending || selectedLetters.size === 0}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Xóa ({selectedLetters.size}) mục
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này sẽ xóa vĩnh viễn {selectedLetters.size}{" "}
                      cover letter đã chọn.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Xác nhận xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button variant="outline" onClick={toggleBulkDeleteMode}>
              <CheckCheck className="mr-2 h-4 w-4" /> Xóa nhiều
            </Button>
          ))}
      </div>

      <div className="space-y-4">
        {coverLetters.map((letter) => {
          const isSelected = selectedLetters.has(letter.id);
          const title = `${letter.jobTitle} at ${letter.companyName}`;

          const CardInnerContent = (
            <>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {isBulkDeleteMode && (
                    <Checkbox checked={isSelected} className="mt-1.5" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-xl gradient-title truncate pr-28">
                      {title}
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
                </div>
              </CardHeader>
              {letter.jobDescription && (
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-3 italic">
                    &quot;{letter.jobDescription}&quot;
                  </p>
                </CardContent>
              )}
            </>
          );

          return (
            <div key={letter.id} className="relative group">
              <Card
                className={`transition-colors h-full ${
                  isBulkDeleteMode ? "cursor-pointer" : ""
                } ${isSelected ? "border-primary border-2" : ""}`}
                onClick={
                  isBulkDeleteMode
                    ? () => handleToggleSelection(letter.id)
                    : undefined
                }
              >
                {isBulkDeleteMode ? (
                  <div className="flex flex-col flex-grow h-full">
                    {CardInnerContent}
                  </div>
                ) : (
                  <Link
                    href={`/ai-cover-letter/${letter.id}`}
                    className="block hover:bg-accent/50 rounded-lg h-full"
                  >
                    {CardInnerContent}
                  </Link>
                )}
              </Card>

              {!isBulkDeleteMode && (
                <div className="absolute top-4 right-4 z-10 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {letter.jobUrl && (
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={letter.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
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
                        <AlertDialogTitle>
                          Delete Cover Letter?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will permanently delete your cover letter
                          for "{title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSingleDelete(letter.id, title)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
