"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { searchJobs, saveJob } from "@/actions/job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { generateCoverLetter } from "@/actions/cover-letter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Save,
  ExternalLink,
  Briefcase,
  MapPin,
  Globe,
  FileScan,
  PenBox,
} from "lucide-react";
import { ResumeSelectionModal } from "./ResumeSelectionModal";

export default function JobSearchTab() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState("");
  const { register, handleSubmit, getValues } = useForm();
  const [selectedJob, setSelectedJob] = useState(null);
  const router = useRouter();

  // State để theo dõi việc tạo cover letter cho job nào
  const [generatingLetterId, setGeneratingLetterId] = useState(null);

  const handleNewSearch = async (data) => {
    setIsLoading(true);
    setJobs([]);
    setPage(1);
    setCurrentQuery(data.query);

    const result = await searchJobs(data.query, 1);

    if (result.success) {
      if (result.data.length === 0) {
        toast.info("No jobs found for this query. Try another keyword.");
      }
      setJobs(result.data);
    } else {
      toast.error(result.error || "Failed to search for jobs.");
    }

    setIsLoading(false);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const result = await searchJobs(currentQuery, nextPage);

    if (result.success && result.data.length > 0) {
      setJobs((prevJobs) => [...prevJobs, ...result.data]);
      setPage(nextPage);
    } else if (result.error) {
      toast.error(result.error || "Failed to load more jobs.");
    } else {
      toast.info("No more job listings found.");
    }
    setIsLoadingMore(false);
  };

  const handleSaveJob = async (job) => {
    toast.promise(saveJob(job), {
      loading: "Saving job...",
      success: (res) => res.message || "Job saved successfully!",
      error: (err) => err.error || "Failed to save job.",
    });
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleNewSearch)} className="flex gap-2">
        <Input
          placeholder="Search for job titles, keywords..."
          {...register("query", { required: true })}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job, index) => (
          <Card key={`${job.id}-${index}`} className="flex flex-col">
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
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-2">
              {job.sourceType === "JSearch" ? (
                <Badge
                  variant="secondary"
                  className="border-green-500 text-green-500"
                >
                  Jsearch
                </Badge>
              ) : (
                <Badge variant="outline">Google Search</Badge>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Job
                  </a>
                </Button>
                <Button size="sm" onClick={() => handleSaveJob(job)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
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
                    <PenBox />
                  )}
                  Tạo Cover Letter
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Nút Tải Thêm */}
      {jobs.length > 0 && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
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
