"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { searchJobs, saveJob } from "@/actions/job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  Search,
  Save,
  ExternalLink,
  Briefcase,
  MapPin,
  Globe,
} from "lucide-react";

// Hàm tiện ích để tạo độ trễ
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function JobSearchTab() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState("");
  const { register, handleSubmit, getValues } = useForm();

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
          <Card key={`${job.id}-${index}`}>
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
            <CardFooter className="flex justify-between">
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
    </div>
  );
}
