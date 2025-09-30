"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteSavedJob, deleteMultipleSavedJobs } from "@/actions/job";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateCoverLetter } from "@/actions/cover-letter";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  ExternalLink,
  Briefcase,
  MapPin,
  Globe,
  FileScan,
  Loader2,
  PenBox,
  X,
  CheckCheck,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ResumeSelectionModal } from "./ResumeSelectionModal";
import { CoverLetterCreationModal } from "./CoverLetterCreationModal";

export default function SavedJobsTab({ initialSavedJobs }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [savedJobs, setSavedJobs] = useState(initialSavedJobs);
  const [selectedJob, setSelectedJob] = useState(null);
  const [generatingLetterId, setGeneratingLetterId] = useState(null);

  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState(new Set());

  // <<< THÊM STATE CHO MODAL >>>
  const [jobForLetter, setJobForLetter] = useState(null);

  useEffect(() => {
    setSavedJobs(initialSavedJobs);
  }, [initialSavedJobs]);

  const handleSingleDelete = (id) => {
    startTransition(async () => {
      const result = await deleteSavedJob(id);
      if (result.success) {
        toast.success("Job removed successfully!");
        router.refresh();
      } else {
        toast.error("Failed to remove job.");
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedJobs.size === 0) {
      toast.info("Vui lòng chọn ít nhất một công việc để xóa.");
      return;
    }
    startTransition(async () => {
      const idsToDelete = Array.from(selectedJobs);
      const result = await deleteMultipleSavedJobs(idsToDelete);
      if (result.success) {
        toast.success(`Đã xóa ${result.count} công việc đã lưu.`);
        setIsBulkDeleteMode(false);
        setSelectedJobs(new Set());
        router.refresh();
      } else {
        toast.error(result.error || "Không thể xóa các công việc đã chọn.");
      }
    });
  };

  // === PHẦN SỬA LỖI: KHÔI PHỤC LẠI LOGIC CHO HÀM NÀY ===
  const handleGenerateCoverLetter = (job) => {
    setJobForLetter(job); // Mở modal bằng cách set job
  };
  // =======================================================

  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode((prev) => !prev);
    setSelectedJobs(new Set());
  };

  const handleToggleSelection = (id) => {
    const newSelection = new Set(selectedJobs);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedJobs(newSelection);
  };

  if (savedJobs.length === 0) {
    return (
      <p className="text-muted-foreground">
        Bạn chưa có công việc nào được lưu.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {isBulkDeleteMode ? (
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
                  disabled={isPending || selectedJobs.size === 0}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Xóa ({selectedJobs.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này sẽ xóa vĩnh viễn {selectedJobs.size} công việc
                    đã lưu.
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
        )}
      </div>

      <div className="space-y-4">
        {savedJobs.map((job) => {
          const isSelected = selectedJobs.has(job.id);
          return (
            <Card
              key={job.id}
              className={`transition-colors ${
                isBulkDeleteMode ? "cursor-pointer" : ""
              } ${isSelected ? "border-primary border-2" : ""}`}
              onClick={
                isBulkDeleteMode
                  ? () => handleToggleSelection(job.id)
                  : undefined
              }
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  {isBulkDeleteMode && (
                    <Checkbox checked={isSelected} className="mt-1.5" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription className="flex flex-col gap-1 pt-2">
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> {job.companyName}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {job.location}
                      </span>
                      {job.source && (
                        <span className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3" /> {job.source}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {job.description}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                {job.sourceType ? (
                  job.sourceType === "JSearch" ? (
                    <Badge
                      variant="secondary"
                      className="border-green-500 text-green-500"
                    >
                      JSearch
                    </Badge>
                  ) : (
                    <Badge variant="outline">Google Search</Badge>
                  )
                ) : (
                  <div />
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original
                    </a>
                  </Button>
                  {job.sourceType === "JSearch" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedJob(job)}
                    >
                      <FileScan className="h-4 w-4 mr-2" />
                      Đánh giá CV
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleGenerateCoverLetter(job)}
                    disabled={generatingLetterId === job.id}
                  >
                    {generatingLetterId === job.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <PenBox className="h-4 w-4" />
                    )}
                    Tạo Cover Letter
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSingleDelete(job.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {jobForLetter && (
        <CoverLetterCreationModal
          job={jobForLetter}
          open={!!jobForLetter}
          onOpenChange={() => setJobForLetter(null)}
        />
      )}
      {selectedJob && (
        <ResumeSelectionModal
          job={selectedJob}
          open={!!selectedJob}
          onOpenChange={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
