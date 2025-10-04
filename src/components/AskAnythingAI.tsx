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
import { Textarea } from "@/components/ui/textarea";

const systemPrompt =
  "Anda adalah 'Kak AI', seorang tutor matematika yang sangat ramah, sabar, dan ceria untuk siswa kelas 2 SD (usia 7-8 tahun). Jawab pertanyaan berikut dengan bahasa yang sederhana, analogi yang mudah dimengerti, dan selalu beri semangat. Gunakan emoji sesekali. Jangan gunakan istilah teknis yang rumit.";

const AskAnythingAI = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    const userPrompt = question.trim();

    if (!userPrompt) {
      setErrorMessage("Tulis pertanyaanmu dulu, ya!");
      setAnswer(null);
      return;
    }

    setIsLoading(true);
    setAnswer(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Gagal bertanya ke Kak AI (status ${response.status}).`);
      }

      const data = (await response.json()) as { answer?: string; error?: string; details?: string };

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setAnswer(data.answer ?? "Hmm, Kak AI belum punya jawaban. Coba tanyakan dengan cara berbeda, ya! ??");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tak terduga. Coba lagi sebentar lagi, ya!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Punya Pertanyaan untuk Bab 1?</CardTitle>
        <CardDescription>
          Tanyakan apa saja ke Kak AI tentang bilangan sampai 100. Kak AI siap membantu!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Tanya Kak AI di sini yuk! Misalnya: Kenapa angka 10 itu genap?"
            rows={4}
            disabled={isLoading}
          />
        </div>
        <div>
          <Button onClick={handleAsk} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sedang bertanya...
              </>
            ) : (
              "Tanyakan!"
            )}
          </Button>
        </div>
        {answer ? (
          <Alert>
            <AlertTitle>Jawaban Kak AI</AlertTitle>
            <AlertDescription>{answer}</AlertDescription>
          </Alert>
        ) : null}
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Oops!</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Kak AI selalu siap membantu. Jangan ragu untuk bertanya lagi kalau belum paham! ??
        </p>
      </CardFooter>
    </Card>
  );
};

export default AskAnythingAI;
