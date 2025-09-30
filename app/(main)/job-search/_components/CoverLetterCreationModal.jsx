// app/(main)/job-search/_components/CoverLetterCreationModal.jsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateCoverLetter } from "@/actions/cover-letter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Schema chỉ cho các trường cá nhân, vì các trường job đã có sẵn
const personalInfoSchema = z.object({
  yourName: z.string().min(1, "Your name is required"),
  yourAddress: z.string().min(1, "Your address is required"),
  yourPhone: z.string().min(1, "Your phone number is required"),
  yourEmail: z.string().email("A valid email is required"),
});

export function CoverLetterCreationModal({ job, open, onOpenChange }) {
  const { user } = useUser();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(personalInfoSchema),
  });

  useEffect(() => {
    if (user && open) {
      setValue("yourName", user.fullName || "");
      setValue("yourEmail", user.primaryEmailAddress?.emailAddress || "");
      // Giả sử bạn đã lưu address và phone trong user metadata
      // Nếu không, bạn có thể để trống hoặc lấy từ nơi khác
      setValue("yourPhone", user.unsafeMetadata?.phone || "");
      setValue("yourAddress", user.unsafeMetadata?.address || "");
    }
    // Reset form khi modal đóng
    if (!open) {
      reset();
    }
  }, [user, open, setValue, reset]);

  const onSubmit = async (personalData) => {
    setIsGenerating(true);
    const toastId = toast.loading(
      `Generating cover letter for ${job.title}...`
    );

    try {
      const allData = { ...job, ...personalData };
      const newCoverLetter = await generateCoverLetter({
        jobTitle: allData.title,
        companyName: allData.companyName,
        jobDescription: allData.description,
        yourName: allData.yourName,
        yourAddress: allData.yourAddress,
        yourPhone: allData.yourPhone,
        yourEmail: allData.yourEmail,
        url: allData.url,
        source: allData.source,
        sourceType: allData.sourceType,
      });

      toast.success("Cover letter created successfully!", {
        id: toastId,
        action: {
          label: "View",
          onClick: () => router.push(`/ai-cover-letter/${newCoverLetter.id}`),
        },
      });
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Failed to generate cover letter.", {
        id: toastId,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Complete Your Information</DialogTitle>
            <DialogDescription>
              Confirm your details to generate a cover letter for the{" "}
              <strong>{job?.title}</strong> position.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="yourName" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input id="yourName" {...register("yourName")} />
                {errors.yourName && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.yourName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="yourEmail" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input id="yourEmail" {...register("yourEmail")} />
                {errors.yourEmail && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.yourEmail.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="yourPhone" className="text-right">
                Phone
              </Label>
              <div className="col-span-3">
                <Input id="yourPhone" {...register("yourPhone")} />
                {errors.yourPhone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.yourPhone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="yourAddress" className="text-right">
                Address
              </Label>
              <div className="col-span-3">
                <Input id="yourAddress" {...register("yourAddress")} />
                {errors.yourAddress && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.yourAddress.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
