"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Mic, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createClient } from "@deepgram/sdk";
import { getAiInterviewResponse } from "@/actions/interview";
import { getTemporaryApiKey, getAudioFromText } from "@/actions/deepgram";

export default function VoiceInterviewStarter({ resumes }) {
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isInterviewing, setIsInterviewing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);

  const workExperienceRef = useRef("");
  const micRef = useRef(null);
  const userSpeechRef = useRef("");
  const connectionRef = useRef(null);
  const audioRef = useRef(null);

  const startDeepgramConnection = async () => {
    try {
      const apiKeyResult = await getTemporaryApiKey();
      if (!apiKeyResult.success || !apiKeyResult.key) {
        throw new Error(
          apiKeyResult.error || "Could not create temporary API key."
        );
      }

      const deepgram = createClient(apiKeyResult.key);
      const conn = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: false, // Chỉ nhận kết quả cuối cùng
      });

      conn.on("open", () => {
        console.log("Deepgram connection opened.");
        setIsListening(true);
      });
      conn.on("close", () => {
        console.log("Deepgram connection closed.");
        setIsListening(false);
      });
      conn.on("error", (error) => console.error("Deepgram error:", error));
      conn.on("transcript", (data) => {
        const text = data.channel.alternatives[0].transcript;
        if (text) {
          userSpeechRef.current += text + " ";
        }
      });

      connectionRef.current = conn;
    } catch (error) {
      toast.error(error.message);
      setIsInterviewing(false);
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const microphone = new MediaRecorder(stream);
      microphone.start(500);

      microphone.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          connectionRef.current?.getReadyState() === 1
        ) {
          connectionRef.current.send(event.data);
        }
      };

      micRef.current = microphone;
    } catch (error) {
      toast.error("Could not access microphone. Please grant permission.");
      console.error("Microphone access error:", error);
    }
  };

  const stopMicAndConnection = () => {
    if (micRef.current && micRef.current.state !== "inactive") {
      micRef.current.stop();
      micRef.current = null;
    }
    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  };

  const speakAiResponse = (text) =>
    new Promise(async (resolve, reject) => {
      // Dừng và dọn dẹp âm thanh cũ
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }

      setIsListening(false);
      setIsAiSpeaking(true);

      try {
        const result = await getAudioFromText(text);

        if (result.success && result.audio) {
          const audio = new Audio(`data:audio/mp3;base64,${result.audio}`);
          audioRef.current = audio;

          // Định nghĩa các trình xử lý sự kiện
          const onEnd = () => {
            setIsAiSpeaking(false);
            setIsListening(true);
            userSpeechRef.current = "";
            resolve();
          };

          const onError = (e) => {
            console.error("Audio playback error:", e);
            toast.error("An error occurred playing the AI voice.");
            setIsAiSpeaking(false);
            setIsListening(true);
            reject(e);
          };

          // Gắn trình xử lý sự kiện TRƯỚC KHI play()
          audio.onended = onEnd;
          audio.onerror = onError;

          // Bắt lỗi có thể xảy ra ngay lúc play
          audio.play().catch(onError);
        } else {
          throw new Error(result.error || "Failed to get audio data.");
        }
      } catch (error) {
        console.error("Error in speakAiResponse:", error);
        toast.error("Could not play AI voice.");
        // Đảm bảo reset trạng thái khi có lỗi
        setIsAiSpeaking(false);
        setIsListening(true);
        reject(error);
      }
    });

  const handleUserFinishSpeaking = () => {
    if (!userSpeechRef.current.trim() || isPending || isAiSpeaking) return;

    setIsListening(false); // Ngừng nghe ngay khi người dùng gửi
    const userText = userSpeechRef.current.trim();
    const newHistory = [
      ...transcript,
      { role: "user", parts: [{ text: userText }] },
    ];
    setTranscript(newHistory);
    userSpeechRef.current = "";

    startTransition(async () => {
      try {
        const result = await getAiInterviewResponse(
          newHistory,
          jobDescription,
          jobTitle,
          workExperienceRef.current
        );

        if (result.success && result.message) {
          const aiText = result.message;
          setTranscript((prev) => [
            ...prev,
            { role: "model", parts: [{ text: aiText }] },
          ]);
          await speakAiResponse(aiText);
        } else {
          throw new Error(result.error || "AI could not respond.");
        }
      } catch (error) {
        toast.error(error.message);
        setIsListening(true); // Bật lại listening nếu có lỗi
      }
    });
  };

  const handleStartInterview = async () => {
    if (!selectedResumeId || !jobTitle || !jobDescription) {
      toast.error("Please fill in all fields.");
      return;
    }
    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume) return;

    workExperienceRef.current = selectedResume.content;
    setIsInterviewing(true);
    setTranscript([]);

    await startDeepgramConnection();
    await startMic();

    setTimeout(async () => {
      try {
        const initialPrompt = `Hi, I'm Alex. Thanks for joining today. I've had a look at your resume for the ${jobTitle} position. To start, could you please tell me a bit about your most recent project?`;
        setTranscript([{ role: "model", parts: [{ text: initialPrompt }] }]);
        await speakAiResponse(initialPrompt);
      } catch (e) {
        console.error("Error speaking initial prompt", e);
      }
    }, 1000);
  };

  const handleEndInterview = () => {
    stopMicAndConnection();
    setIsInterviewing(false);
    toast.info("Interview has ended.");
  };

  useEffect(() => {
    return () => stopMicAndConnection();
  }, []);

  if (isInterviewing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🎙️ Interview in Progress...</CardTitle>
          <CardDescription>Position: {jobTitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-8">
          <div className="w-full h-48 overflow-y-auto p-4 border rounded-md">
            {transcript.map((msg, index) => (
              <p
                key={index}
                className={`mb-2 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {msg.parts[0].text}
                </span>
              </p>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleUserFinishSpeaking}
              disabled={isAiSpeaking || isPending || !isListening}
            >
              <Mic className="mr-2 h-5 w-5" /> Send Response
            </Button>
            <Button onClick={handleEndInterview} variant="destructive">
              <PhoneOff className="mr-2 h-5 w-5" /> End Interview
            </Button>
          </div>
          {isListening && !isAiSpeaking && (
            <p className="text-sm text-green-500">Listening...</p>
          )}
          {isAiSpeaking && (
            <p className="text-sm text-blue-500">AI is speaking...</p>
          )}
          {isPending && (
            <p className="text-sm text-gray-500">AI is thinking...</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🎙️ AI Voice Interview (High Quality)</CardTitle>
        <CardDescription>
          Practice interviewing with an AI using accurate speech recognition.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select CV</Label>
            <Select
              onValueChange={setSelectedResumeId}
              value={selectedResumeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a resume to start" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Software Engineer Intern"
            />
          </div>
          <div className="space-y-2">
            <Label>Job Description (JD)</Label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
            />
          </div>
          <Button
            onClick={handleStartInterview}
            disabled={isPending}
            className="w-full"
          >
            Start Interview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
