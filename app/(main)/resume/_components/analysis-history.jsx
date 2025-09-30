"use client";

import * as React from "react"; // 👈 THÊM DÒNG NÀY ĐỂ SỬA LỖI
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  deleteResumeAnalysis,
  deleteMultipleResumeAnalyses,
} from "@/actions/analysis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import {
  ExternalLink,
  Trash2,
  MessageSquareQuote,
  Eye,
  Loader2,
  X,
  CheckCheck,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { InlineFeedbackDialog } from "./inline-feedback-dialog";
import { cn } from "@/lib/utils";

// Trigger tùy chỉnh để không chiếm toàn bộ chiều rộng, cho phép đặt nút khác bên cạnh
const CustomAccordionTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  )
);
CustomAccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export const AnalysisHistory = ({ resumeId, initialHistory }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [history, setHistory] = useState(initialHistory);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedAnalyses, setSelectedAnalyses] = useState(new Set());

  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [viewingJD, setViewingJD] = useState(null);

  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  const handleSingleDelete = (analysisId) => {
    startTransition(async () => {
      const result = await deleteResumeAnalysis(analysisId);
      if (result.success) {
        toast.success("Đã xóa kết quả phân tích.");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể xóa kết quả phân tích.");
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedAnalyses.size === 0) {
      toast.info("Vui lòng chọn ít nhất một mục để xóa.");
      return;
    }
    startTransition(async () => {
      const idsToDelete = Array.from(selectedAnalyses);
      const result = await deleteMultipleResumeAnalyses(idsToDelete);
      if (result.success) {
        toast.success(`Đã xóa ${result.count} mục phân tích thành công!`);
        setIsBulkDeleteMode(false);
        setSelectedAnalyses(new Set());
        router.refresh();
      } else {
        toast.error(result.error || "Không thể xóa các mục đã chọn.");
      }
    });
  };

  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode((prev) => !prev);
    setSelectedAnalyses(new Set());
  };

  const handleToggleSelection = (id) => {
    const newSelection = new Set(selectedAnalyses);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedAnalyses(newSelection);
  };

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử Phân tích CV</CardTitle>
          <CardDescription>
            Chưa có lịch sử phân tích nào cho CV này.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lịch sử Phân tích CV</CardTitle>
              <CardDescription>
                Các lần phân tích đã lưu cho CV này.
              </CardDescription>
            </div>
            {isBulkDeleteMode ? (
              <div className="flex gap-2">
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
                      disabled={isPending || selectedAnalyses.size === 0}
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Xóa ({selectedAnalyses.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này sẽ xóa vĩnh viễn {selectedAnalyses.size}{" "}
                        mục đã chọn.
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
              </div>
            ) : (
              <Button variant="outline" onClick={toggleBulkDeleteMode}>
                <CheckCheck className="mr-2 h-4 w-4" /> Xóa nhiều
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {history.map((item) => {
              const isSelected = selectedAnalyses.has(item.id);
              return (
                <AccordionItem
                  value={item.id}
                  key={item.id}
                  className={isSelected ? "bg-muted/50" : ""}
                >
                  <AccordionPrimitive.Header className="flex items-center px-4">
                    {isBulkDeleteMode && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelection(item.id)}
                        className="mr-4"
                      />
                    )}
                    <CustomAccordionTrigger>
                      <div className="flex-1 truncate">
                        <p
                          className="font-semibold truncate"
                          title={item.jobTitle || item.jobDescription}
                        >
                          {item.jobTitle || "Phân tích chung"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.companyName ||
                            `JD: ${item.jobDescription.substring(0, 50)}...`}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground ml-4">
                        {format(new Date(item.createdAt), "dd/MM/yyyy")}
                      </span>
                    </CustomAccordionTrigger>

                    {!isBulkDeleteMode && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive ml-2"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Bạn có chắc chắn muốn xóa?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này sẽ xóa vĩnh viễn phân tích cho vị
                              trí "{item.jobTitle || "này"}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSingleDelete(item.id)}
                            >
                              Xác nhận
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </AccordionPrimitive.Header>
                  <AccordionContent className="space-y-4 px-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">
                        {item.matchScore}/100
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.summary}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Từ khóa còn thiếu:</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.missingKeywords.map((keyword, index) => (
                          <Badge key={index} variant="destructive">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Gợi ý cải thiện:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {item.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingJD(item)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Xem JD
                      </Button>
                      {item.sourceType === "JSearch" && item.jobUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={item.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Xem Job gốc
                          </a>
                        </Button>
                      )}
                      {item.inlineFeedback &&
                        Object.keys(item.inlineFeedback).length > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedAnalysis(item)}
                          >
                            <MessageSquareQuote className="mr-2 h-4 w-4" />
                            Xem trực quan nhận xét
                          </Button>
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <InlineFeedbackDialog
        analysis={selectedAnalysis}
        open={!!selectedAnalysis}
        onOpenChange={(isOpen) => !isOpen && setSelectedAnalysis(null)}
      />

      <Dialog
        open={!!viewingJD}
        onOpenChange={(isOpen) => !isOpen && setViewingJD(null)}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Mô tả Công việc</DialogTitle>
            <DialogDescription>
              Đây là JD đã được sử dụng để phân tích.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-6 -mr-6 jd-content">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  viewingJD?.formattedJobDescription ||
                  `<pre>${viewingJD?.jobDescription}</pre>`,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
