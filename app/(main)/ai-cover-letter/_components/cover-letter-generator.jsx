"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCoverLetter } from "@/actions/cover-letter";
import useFetch from "@/hooks/use-fetch";
import { coverLetterSchema } from "@/app/lib/schema";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function CoverLetterGenerator() {
  const router = useRouter();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(coverLetterSchema),
    defaultValues: {
      yourName: "",
      yourAddress: "",
      yourPhone: "",
      yourEmail: "",
      jobTitle: "",
      companyName: "",
      jobDescription: "",
    },
  });

  useEffect(() => {
    if (user) {
      setValue("yourName", user.fullName || "");
      setValue("yourEmail", user.primaryEmailAddress?.emailAddress || "");
    }
  }, [user, setValue]);

  const {
    loading: generating,
    fn: generateLetterFn,
    data: generatedLetter,
  } = useFetch(generateCoverLetter);

  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated successfully!");
      router.push(`/ai-cover-letter/${generatedLetter.id}`);
      router.refresh();
      reset();
    }
  }, [generatedLetter, router, reset]);

  const onSubmit = async (data) => {
    try {
      await generateLetterFn(data);
    } catch (error) {
      toast.error(error.message || "Failed to generate cover letter");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide information about the position you're applying for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Details Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium text-lg">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yourName">Full Name</Label>
                  <Input
                    id="yourName"
                    placeholder="Your full name"
                    {...register("yourName")}
                  />
                  {errors.yourName && (
                    <p className="text-sm text-red-500">
                      {errors.yourName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yourPhone">Phone Number</Label>
                  <Input
                    id="yourPhone"
                    placeholder="(123) 456-7890"
                    {...register("yourPhone")}
                  />
                  {errors.yourPhone && (
                    <p className="text-sm text-red-500">
                      {errors.yourPhone.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yourAddress">Address</Label>
                <Input
                  id="yourAddress"
                  placeholder="City, State, Zip Code"
                  {...register("yourAddress")}
                />
                {errors.yourAddress && (
                  <p className="text-sm text-red-500">
                    {errors.yourAddress.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="yourEmail">Email Address</Label>
                <Input
                  id="yourEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register("yourEmail")}
                />
                {errors.yourEmail && (
                  <p className="text-sm text-red-500">
                    {errors.yourEmail.message}
                  </p>
                )}
              </div>
            </div>

            {/* Job Details Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium text-lg">Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Enter job title"
                    {...register("jobTitle")}
                  />
                  {errors.jobTitle && (
                    <p className="text-sm text-red-500">
                      {errors.jobTitle.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here"
                  className="h-32"
                  {...register("jobDescription")}
                />
                {errors.jobDescription && (
                  <p className="text-sm text-red-500">
                    {errors.jobDescription.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
