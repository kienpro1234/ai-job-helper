"use client";

import { useEffect, useState } from "react";
import { getAnalysisHistory } from "@/actions/analysis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const AnalysisHistory = ({ resumeId }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (resumeId) {
      const fetchHistory = async () => {
        setIsLoading(true);
        const result = await getAnalysisHistory(resumeId);
        if (result.success) {
          setHistory(result.data);
        }
        setIsLoading(false);
      };
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [resumeId]);

  if (isLoading) {
    return <div>Đang tải lịch sử phân tích...</div>;
  }

  if (history.length === 0) {
    return null; // Không hiển thị gì nếu chưa có lịch sử
  }

  return (
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
                <div className="flex justify-between w-full pr-4">
                  <span
                    className="truncate max-w-xs md:max-w-md"
                    title={item.jobDescription}
                  >
                    {item.jobDescription}
                  </span>
                  <span className="text-sm text-muted-foreground">
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
