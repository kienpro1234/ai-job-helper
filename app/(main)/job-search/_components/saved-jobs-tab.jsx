"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteSavedJob } from "@/actions/job";
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
import { ResumeSelectionModal } from "./ResumeSelectionModal";

export default function SavedJobsTab({ initialSavedJobs }) {
  const [savedJobs, setSavedJobs] = useState(initialSavedJobs);
  const [selectedJob, setSelectedJob] = useState(null);
  const router = useRouter();

  // State để theo dõi việc tạo cover letter cho job
  const [generatingLetterId, setGeneratingLetterId] = useState(null);

  const handleDelete = async (id) => {
    const result = await deleteSavedJob(id);
    if (result.success) {
      setSavedJobs(savedJobs.filter((job) => job.id !== id));
      toast.success("Job removed successfully!");
    } else {
      toast.error("Failed to remove job.");
    }
  };

  const handleGenerateCoverLetter = async (job) => {
    setGeneratingLetterId(job.id);
    const toastId = toast.loading(
      `Đang tạo cover letter cho vị trí ${job.title}...`
    );

    try {
      const newCoverLetter = await generateCoverLetter({
        jobTitle: job.title,
        companyName: job.companyName,
        jobDescription: job.description,

        url: job.url,
        source: job.source,
        sourceType: job.sourceType,
      });

      toast.success("Tạo cover letter thành công!", {
        id: toastId,
        action: {
          label: "Xem ngay",
          onClick: () => router.push(`/ai-cover-letter/${newCoverLetter.id}`),
        },
      });
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Tạo cover letter thất bại.", {
        id: toastId,
      });
    } finally {
      setGeneratingLetterId(null);
    }
  };

  if (savedJobs.length === 0) {
    return <p className="text-muted-foreground">You have no saved jobs yet.</p>;
  }

  return (
    <div className="space-y-4">
      {savedJobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
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
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {job.description}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            {
              job.sourceType ? (
                job.sourceType === "JSearch" ? (
                  <Badge
                    variant="secondary"
                    className="border-green-500 text-green-500"
                  >
                    Jsearch
                  </Badge>
                ) : (
                  <Badge variant="outline">Google Search</Badge>
                )
              ) : (
                <div />
              ) /* Để trống nếu job cũ chưa có sourceType */
            }
            <div className="flex gap-2">
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the saved job. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(job.id)}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleGenerateCoverLetter(job)}
                disabled={generatingLetterId === job.id}
                className={job.sourceType !== "JSearch" ? "col-span-2" : ""}
              >
                {generatingLetterId === job.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <PenBox />
                )}
                Tạo Cover Letter
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}

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
