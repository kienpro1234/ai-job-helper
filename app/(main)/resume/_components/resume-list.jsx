import Link from "next/link";
import { getResumes } from "@/actions/resume";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export async function ResumeList() {
  const resumes = await getResumes();

  if (resumes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Bạn chưa tạo CV nào.</p>
        <p>Hãy chuyển qua tab "Tạo CV Mới" để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resumes.map((resume) => (
        <Link href={`/resume/${resume.id}`} key={resume.id}>
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start gap-4">
                <FileText className="h-6 w-6 mt-1 text-primary" />
                <div>
                  <CardTitle>{resume.title}</CardTitle>
                  <CardDescription>
                    Cập nhật lần cuối:{" "}
                    {format(new Date(resume.updatedAt), "dd/MM/yyyy")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
