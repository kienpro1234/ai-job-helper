import { Search, FileText, PenBox, GraduationCap } from "lucide-react";

export const howItWorks = [
  {
    title: "AI Job Assistant",
    description:
      "Search, save, and manage suitable jobs from various sources with the help of AI.",
    icon: <Search className="w-10 h-10 text-primary" />,
  },
  {
    title: "Build Resume",
    description:
      "Build a professional, ATS-optimized resume and receive detailed feedback from AI.",
    icon: <FileText className="w-10 h-10 text-primary" />,
  },
  {
    title: "AI Cover Letter",
    description:
      "Create impressive cover letters tailored to each job application in just a few seconds.",
    icon: <PenBox className="w-10 h-10 text-primary" />,
  },
  {
    title: "Interview Prep",
    description:
      "Practice for interviews with AI-generated questions based on your skills and track your progress.",
    icon: <GraduationCap className="w-10 h-10 text-primary" />,
  },
];
