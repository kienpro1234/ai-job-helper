// File: kienpro1234/ai-job-helper/ai-job-helper-70c88787fe3da399b39e38aedab1e16a8bc5d1f4/app/(main)/resume/_components/analysis-history.jsx

"use client";

import { useEffect, useState } from "react";
import { deleteResumeAnalysis } from "@/actions/analysis";
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
  AccordionTrigger,
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
import { format } from "date-fns";
import { ExternalLink, Trash2, MessageSquareQuote, Eye } from "lucide-react";
import { toast } from "sonner";
import { InlineFeedbackDialog } from "./inline-feedback-dialog";

export const AnalysisHistory = ({ resumeId, initialHistory }) => {
  const [history, setHistory] = useState(initialHistory);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [viewingJD, setViewingJD] = useState(null);

  // Cập nhật state nếu prop từ server thay đổi (sau khi router.refresh được gọi)
  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  const handleDelete = async (analysisId) => {
    const result = await deleteResumeAnalysis(analysisId);
    if (result.success) {
      setHistory((currentHistory) =>
        currentHistory.filter((item) => item.id !== analysisId)
      );
      toast.success("Đã xóa kết quả phân tích.");
    } else {
      toast.error(result.error || "Không thể xóa kết quả phân tích.");
    }
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
          <CardTitle>Lịch sử Phân tích CV</CardTitle>
          <CardDescription>
            Đây là danh sách các lần phân tích bạn đã lưu cho CV này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {history.map((item) => (
              <AccordionItem value={item.id} key={item.id}>
                <AccordionTrigger>
                  <div className="flex flex-col md:flex-row justify-between w-full pr-4 text-left">
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
                    <span className="text-sm text-muted-foreground mt-1 md:mt-0 md:ml-4">
                      {format(new Date(item.createdAt), "dd/MM/yyyy")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
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
                  <CardFooter className="p-0 pt-4 flex justify-end gap-2">
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
                          Xem nhận xét trực quan
                        </Button>
                      )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Bạn có chắc chắn muốn xóa?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Phân tích cho vị
                            trí "{item.jobTitle || "này"}" sẽ bị xóa vĩnh viễn.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      <InlineFeedbackDialog
        analysis={selectedAnalysis}
        open={!!selectedAnalysis}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedAnalysis(null);
          }
        }}
      />
      <Dialog
        open={!!viewingJD}
        onOpenChange={(isOpen) => !isOpen && setViewingJD(null)}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Mô tả Công việc</DialogTitle>
            <DialogDescription>
              Đây là JD đã được sử dụng để phân tích cho vị trí "
              {viewingJD?.jobTitle || "N/A"}".
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
