"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const SKIP_OPTIONS = [2, 3, 5, 10] as const;

interface Challenge {
  start: number;
  step: (typeof SKIP_OPTIONS)[number];
  sequence: number[];
  hiddenIndices: number[];
}

type FeedbackState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | null;

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickHiddenIndices = (length: number, count: number) => {
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(randomBetween(0, length - 1));
  }
  return Array.from(indices).sort((a, b) => a - b);
};

function createChallenge(): Challenge {
  const step = SKIP_OPTIONS[randomBetween(0, SKIP_OPTIONS.length - 1)];
  const start = randomBetween(1, 50);
  const sequence = Array.from({ length: 6 }, (_, index) => start + index * step);
  const hiddenIndices = pickHiddenIndices(sequence.length, 2);
  return { start, step, sequence, hiddenIndices };
}

function SkipCounterInner() {
  const [hasMounted, setHasMounted] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const initializeChallenge = useCallback(() => {
    const newChallenge = createChallenge();
    setChallenge(newChallenge);
    setAnswers(
      newChallenge.hiddenIndices.reduce<Record<number, string>>((acc, index) => {
        acc[index] = "";
        return acc;
      }, {}),
    );
    setFeedback(null);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      initializeChallenge();
    }
  }, [hasMounted, initializeChallenge]);

  const isReady = Boolean(hasMounted && challenge);

  const handleChangeAnswer = useCallback((index: number, value: string) => {
    setAnswers((previous) => ({ ...previous, [index]: value }));
  }, []);

  const handleCheckAnswer = useCallback(() => {
    if (!challenge) {
      return;
    }

    const allFilled = challenge.hiddenIndices.every((index) => {
      const value = answers[index];
      return value !== undefined && value.trim() !== "";
    });

    if (!allFilled) {
      setFeedback({
        status: "error",
        message: "Isi semua kotak kosong terlebih dahulu, ya!",
      });
      return;
    }

    const isCorrect = challenge.hiddenIndices.every((index) => {
      const expected = challenge.sequence[index];
      const provided = Number(answers[index]);
      return Number.isFinite(provided) && provided === expected;
    });

    if (isCorrect) {
      setFeedback({
        status: "success",
        message: "Keren! Kamu menemukan semua angka yang hilang.",
      });
      return;
    }

    setFeedback({
      status: "error",
      message: "Masih ada yang salah. Coba hitung lagi pola loncatannya!",
    });
  }, [answers, challenge]);

  const handleNextChallenge = useCallback(() => {
    initializeChallenge();
  }, [initializeChallenge]);

  const renderedSequence = useMemo(() => {
    if (!challenge) {
      return null;
    }

    return challenge.sequence.map((value, index) => {
      if (challenge.hiddenIndices.includes(index)) {
        return (
          <Input
            key={`input-${index}`}
            type="number"
            inputMode="numeric"
            className="w-16 text-center"
            value={answers[index] ?? ""}
            onChange={(event) => handleChangeAnswer(index, event.target.value)}
            placeholder="?"
          />
        );
      }

      return (
        <span key={`value-${index}`} className="text-lg font-semibold">
          {value}
        </span>
      );
    });
  }, [challenge, answers, handleChangeAnswer]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permainan Membilang Loncat</CardTitle>
        <CardDescription>
          Temukan angka yang hilang pada barisan membilang loncat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <p className="text-sm text-muted-foreground">
              {isReady
                ? `Pola loncatan pada barisan ini adalah: +${challenge?.step}`
                : "Menyiapkan tantangan baru..."}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {isReady ? renderedSequence : "-"}
            </div>
          </div>
          <Card className="bg-muted/30 md:col-span-1">
            <CardHeader>
              <CardTitle>Contoh Lompatan</CardTitle>
              <CardDescription>Lihat bagaimana loncatan +3 bekerja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <div className="absolute inset-x-6 -top-4 flex justify-between text-xs font-semibold text-emerald-600">
                  <span className="flex-1 text-center">+3</span>
                  <span className="flex-1 text-center">+3</span>
                  <span className="flex-1 text-center">+3</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-background px-6 py-4 text-xl font-semibold text-primary shadow-sm">
                  <span>2</span>
                  <span>5</span>
                  <span>8</span>
                  <span>11</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Loncat tiga berarti menambahkan tiga setiap langkah.
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={handleCheckAnswer} disabled={!isReady}>
          Periksa Jawaban
        </Button>
        <div className="flex-1">
          {feedback ? (
            feedback.status === "success" ? (
              <Alert className="border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/50 dark:text-green-50">
                <AlertTitle>Hebat, Polanya Benar!</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-3 text-sm">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={handleNextChallenge}
                  >
                    Lanjut
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Hmm, Coba Hitung Lagi!</AlertTitle>
                <AlertDescription className="mt-1 text-sm">
                  {feedback.message}
                </AlertDescription>
              </Alert>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Isi angka yang hilang lalu tekan Periksa Jawaban.
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function SkipCounter() {
  return <SkipCounterInner />;
}
