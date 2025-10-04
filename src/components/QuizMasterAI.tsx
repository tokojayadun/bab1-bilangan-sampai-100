"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type QuizQuestion = {
  question: string;
  answer: string;
  explanation: string;
};

type FeedbackState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | null;

type GameStatus = "idle" | "loading" | "quiz" | "finished";

const systemPrompt = `Anda adalah Kak AI, guru kelas 2 SD yang sangat ceria, sabar, dan selalu memberi pujian positif. Kamu selalu menulis soal dengan format yang jelas: \`Pertanyaan | Jawaban | Penjelasan singkat\` tanpa catatan tambahan.`;
const userPrompt = `Buatkan tepat 5 soal kuis UNIK dan BERBEDA untuk siswa kelas 2 SD (usia 7-8 tahun) tentang materi "Bilangan sampai 100".
Setiap soal harus mencakup salah satu topik: membilang benda, nilai tempat, membandingkan bilangan, mengurutkan bilangan, atau bilangan genap/ganjil.
Jangan membuat soal penjumlahan atau pengurangan sederhana seperti "5 + 3 = ?". Utamakan soal cerita atau konseptual yang mendorong penalaran.

Format keluaran HARUS berupa JSON valid tanpa teks tambahan maupun pemformatan markdown:
{
  "questions": [
    {
      "question": "Pertanyaan dalam bahasa Indonesia yang ramah anak",
      "answer": "Jawaban singkat berupa kata atau angka saja",
      "explanation": "Penjelasan ceria maksimal 15 kata"
    }
  ]
}

Pastikan ada tepat 5 objek pada array "questions" dan setiap objek mengikuti format di atas.
`;
function parseQuizResponse(answer: string): QuizQuestion[] {
  const trimmed = answer.trim();

  const extractJson = (input: string): string => {
    const match = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : input;
  };

  const parseJsonPayload = (): QuizQuestion[] => {
    const candidate = extractJson(trimmed);
    try {
      const parsed = JSON.parse(candidate);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.questions)
          ? parsed.questions
          : [];

      return list
        .map((item) => ({
          question: (item?.question ?? "").toString().trim(),
          answer: (item?.answer ?? "").toString().trim(),
          explanation: (item?.explanation ?? "").toString().trim(),
        }))
        .filter(({ question, answer }) => question.length > 0 && answer.length > 0);
    } catch (error) {
      return [];
    }
  };

  const parsePipeLines = (): QuizQuestion[] => {
    const normalized = trimmed.replace(/\r/g, "\n");
    const seen = new Set<string>();
    const accumulated: QuizQuestion[] = [];

    const pushIfValid = (question: string, answer: string, explanation: string) => {
      const cleanQuestion = question.replace(/^[*\-\d.\s]+/, "").trim();
      const cleanAnswer = answer.replace(/^[*\-\d.\s]+/, "").trim();
      const cleanExplanation = explanation.trim();

      if (!cleanQuestion || !cleanAnswer) {
        return;
      }

      const key = cleanQuestion.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      accumulated.push({
        question: cleanQuestion,
        answer: cleanAnswer,
        explanation: cleanExplanation,
      });
    };

    normalized
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        if (accumulated.length >= 5) {
          return;
        }

        const parts = line.split("|").map((segment) => segment.trim());
        if (parts.length >= 2) {
          const [question, answer, ...rest] = parts;
          pushIfValid(question, answer, rest.join(" | "));
        }
      });

    if (accumulated.length < 5) {
      const matches = normalized.match(/([^\n]+\|[^\n]+\|[^\n]+)/g);
      if (matches) {
        matches.forEach((entry) => {
          if (accumulated.length >= 5) {
            return;
          }
          const parts = entry.split("|").map((segment) => segment.trim());
          const [question, answer, ...rest] = parts;
          pushIfValid(question ?? "", answer ?? "", rest.join(" | "));
        });
      }
    }

    return accumulated;
  };

  const jsonResult = parseJsonPayload();
  if (jsonResult.length >= 5) {
    return jsonResult.slice(0, 5);
  }

  const lineResult = parsePipeLines();
  return lineResult.slice(0, 5);
}
function normaliseAnswer(value: string) {
  return value.trim().toLowerCase();
}

const QuizMasterAI = () => {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];

  const resetQuiz = () => {
    setStatus("idle");
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setScore(0);
    setHasAnswered(false);
    setErrorMessage(null);
  };

  const startQuiz = async () => {
    setStatus("loading");
    setErrorMessage(null);
    setFeedback(null);
    setHasAnswered(false);

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { answer?: string };
      const parsedQuestions = parseQuizResponse(data.answer ?? "");

      if (!parsedQuestions.length) {
        throw new Error("Tidak ada soal yang dapat diproses.");
      }

      setQuestions(parsedQuestions);
      setCurrentIndex(0);
      setUserAnswer("");
      setFeedback(null);
      setScore(0);
      setHasAnswered(false);
      setStatus("quiz");
    } catch (error) {
      console.error("Failed to start quiz:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan saat memulai kuis."
      );
      setStatus("idle");
    }
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion || hasAnswered) {
      return;
    }

    if (!userAnswer.trim()) {
      setFeedback({ status: "error", message: "Isi jawabanmu dulu, ya!" });
      return;
    }

    const isCorrect =
      normaliseAnswer(userAnswer) === normaliseAnswer(currentQuestion.answer);

    if (isCorrect) {
      setScore((previous) => previous + 1);
      setFeedback({
        status: "success",
        message: `Hebat! ${currentQuestion.explanation || "Jawabanmu sudah tepat."}`,
      });
    } else {
      setFeedback({
        status: "error",
        message: `Jawaban yang benar: ${currentQuestion.answer}. ${
          currentQuestion.explanation || "Coba pahami lagi penjelasannya, ya!"
        }`,
      });
    }

    setHasAnswered(true);
  };

  const goToNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setStatus("finished");
      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setUserAnswer("");
    setFeedback(null);
    setHasAnswered(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kuis JAGO Bab 1</CardTitle>
        <CardDescription>
          Tantang dirimu dengan soal-soal yang dibuat Kak AI untuk materi Bilangan
          sampai 100.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "idle" && (
          <div className="space-y-4">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Wah, ada yang salah!</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Siap untuk belajar sambil bermain? Tekan tombol di bawah untuk
              memulai kuisnya!
            </p>
            <Button onClick={startQuiz}>Mulai Kuis!</Button>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Kak AI sedang menyiapkan soal spesial untukmu�
            </p>
          </div>
        )}

        {status === "quiz" && currentQuestion && (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Soal {currentIndex + 1} dari {questions.length}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {currentQuestion.question}
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="quiz-answer" className="text-sm font-medium">
                Jawabanmu
              </label>
              <Input
                id="quiz-answer"
                value={userAnswer}
                onChange={(event) => setUserAnswer(event.target.value)}
                placeholder="Tulis jawaban di sini"
                disabled={hasAnswered}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCheckAnswer} disabled={hasAnswered}>
                Periksa
              </Button>
              <Button
                variant="outline"
                onClick={goToNextQuestion}
                disabled={!hasAnswered}
              >
                Lanjut
              </Button>
            </div>

            {feedback ? (
              <Alert
                variant={feedback.status === "success" ? "default" : "destructive"}
              >
                <AlertTitle>
                  {feedback.status === "success" ? "Mantap!" : "Belum Tepat"}
                </AlertTitle>
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}

        {status === "finished" && (
          <div className="space-y-4 text-center">
            <p className="text-xl font-semibold text-foreground">
              Hebat! Skor kamu: {score}/{questions.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Terus latihan agar semakin mahir berhitung, ya!
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {status === "finished" ? (
          <Button onClick={resetQuiz}>Main Lagi</Button>
        ) : null}
        {status === "idle" ? null : status === "quiz" ? null : status === "loading" ? null : (
          <Button variant="outline" onClick={resetQuiz}>
            Batalkan
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizMasterAI;









