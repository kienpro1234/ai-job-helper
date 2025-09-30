"use client";
import { analyzeResumeWithJD, saveResumeAnalysis } from "@/actions/analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ListX, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Đặt component này ở đâu đó bên trong component ResumePage
const ResumeAnalyzer = ({ resumeId, initialJd = "", job = null }) => {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState(initialJd || "");
  // State này giờ sẽ lưu cả generalAnalysis và inlineFeedback
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Phải có cả 2 loại kết quả mới cho lưu
    if (!analysisResult?.generalAnalysis || !analysisResult?.inlineFeedback)
      return;

    setIsSaving(true);

    // Truyền cả 2 loại kết quả vào action
    const result = await saveResumeAnalysis(
      analysisResult.generalAnalysis,
      jobDescription,
      resumeId,
      job,
      analysisResult.inlineFeedback // Dữ liệu mới
    );

    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Đã lưu kết quả phân tích!", {
        action: {
          label: "Xem lịch sử",
          onClick: () => router.push(`/resume/${resumeId}`),
        },
      });
      setIsDialogOpen(false);
      router.refresh();
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error("Vui lòng nhập mô tả công việc.");
      return;
    }
    setIsLoading(true);
    setAnalysisResult(null); // Reset kết quả cũ
    const result = await analyzeResumeWithJD(jobDescription, resumeId);
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      // Lưu toàn bộ kết quả trả về từ action
      setAnalysisResult(result.data);
      setIsDialogOpen(true); // Mở dialog khi có kết quả
    }
  };

  // Lấy dữ liệu phân tích tổng quan để hiển thị
  const generalAnalysis = analysisResult?.generalAnalysis;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Phân tích CV với Mô tả công việc (JD)</CardTitle>
        <CardDescription>
          Dán JD vào ô bên dưới để AI chấm điểm và đưa ra gợi ý cải thiện CV của
          bạn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Dán toàn bộ mô tả công việc (JD) vào đây..."
          className="h-40"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? "Đang phân tích..." : "Phân tích ngay"}
        </Button>
      </CardFooter>

      {/* Dialog hiển thị kết quả */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Kết quả Phân tích CV</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-6 -mr-6">
            {generalAnalysis && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Điểm tương thích</h3>
                  <p className="text-5xl font-bold text-primary">
                    {generalAnalysis.matchScore}/100
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {generalAnalysis.summary}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Từ khóa còn thiếu
                      </CardTitle>
                      <ListX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {generalAnalysis.missingKeywords.map(
                          (keyword, index) => (
                            <Badge key={index} variant="destructive">
                              {keyword}
                            </Badge>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Gợi ý cải thiện
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {generalAnalysis.suggestions.map(
                          (suggestion, index) => (
                            <li key={index} className="text-sm">
                              {suggestion}
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu kết quả
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ResumeAnalyzer;
