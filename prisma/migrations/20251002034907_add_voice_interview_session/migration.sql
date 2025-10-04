-- CreateTable
CREATE TABLE "public"."VoiceInterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "transcript" JSONB,
    "aiFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceInterviewSession_userId_idx" ON "public"."VoiceInterviewSession"("userId");

-- CreateIndex
CREATE INDEX "VoiceInterviewSession_resumeId_idx" ON "public"."VoiceInterviewSession"("resumeId");

-- AddForeignKey
ALTER TABLE "public"."VoiceInterviewSession" ADD CONSTRAINT "VoiceInterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoiceInterviewSession" ADD CONSTRAINT "VoiceInterviewSession_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
