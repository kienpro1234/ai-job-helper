import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe } from "lucide-react"; // Bổ sung icon
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Bổ sung Badge
import { getCoverLetter } from "@/actions/cover-letter";
import CoverLetterPreview from "../_components/cover-letter-preview";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0 self-start">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <div className="pb-6">
          <h1 className="text-6xl font-bold gradient-title">
            {coverLetter?.jobTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <p className="text-2xl text-muted-foreground">
              tại {coverLetter?.companyName}
            </p>
            {/* Hiển thị nguồn của job */}
            {coverLetter?.jobSource && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" /> {coverLetter.jobSource}
              </span>
            )}
          </div>
        </div>

        {/* Nút xem job gốc (chỉ hiển thị nếu đủ điều kiện) */}
        {coverLetter?.sourceType === "JSearch" && coverLetter?.jobUrl && (
          <div className="pb-4">
            <Button variant="outline" asChild>
              <a
                href={coverLetter.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Xem tin tuyển dụng gốc
              </a>
            </Button>
          </div>
        )}
      </div>

      <CoverLetterPreview content={coverLetter?.content} />
    </div>
  );
}
