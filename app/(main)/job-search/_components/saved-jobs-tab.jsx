"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteSavedJob } from "@/actions/job";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Briefcase, MapPin, Globe } from "lucide-react";
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

export default function SavedJobsTab({ initialSavedJobs }) {
  const [savedJobs, setSavedJobs] = useState(initialSavedJobs);

  const handleDelete = async (id) => {
    const result = await deleteSavedJob(id);
    if (result.success) {
      setSavedJobs(savedJobs.filter((job) => job.id !== id));
      toast.success("Job removed successfully!");
    } else {
      toast.error("Failed to remove job.");
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
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm" asChild>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original
              </a>
            </Button>
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
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
