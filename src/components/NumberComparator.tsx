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
import { cn } from "@/lib/utils";

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const createDistinctNumbers = () => {
  let first = randomBetween(11, 99);
  let second = randomBetween(11, 99);
  while (second === first) {
    second = randomBetween(11, 99);
  }
  return { first, second };
};

function TensBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-24 w-4 rounded-sm bg-blue-500", "shadow-sm", className)}
    />
  );
}

function OnesBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-4 w-4 rounded-sm bg-yellow-400", "shadow-sm", className)}
    />
  );
}

function ValueVisualization({ value }: { value: number }) {
  const tens = Math.floor(value / 10);
  const ones = value % 10;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: tens }, (_, idx) => (
          <TensBlock key={`tens-${idx}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: ones }, (_, idx) => (
          <OnesBlock key={`ones-${idx}`} />
        ))}
      </div>
    </div>
  );
}

type FeedbackState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | null;

type ComparisonChoice = "<" | ">" | "=";

function NumberCard({
  label,
  value,
  isReady,
}: {
  label: string;
  value: number;
  isReady: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-4xl font-bold text-primary">
          {isReady ? value : "…"}
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        {isReady ? (
          <ValueVisualization value={value} />
        ) : (
          <p className="text-sm text-muted-foreground">Menyiapkan angka…</p>
        )}
      </CardContent>
    </Card>
  );
}

function ComparisonButtons({
  onSelect,
  disabled,
}: {
  onSelect: (choice: ComparisonChoice) => void;
  disabled: boolean;
}) {
  const buttons: ComparisonChoice[] = ["<", ">", "="];

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {buttons.map((button) => (
        <Button
          key={button}
          variant="secondary"
          size="lg"
          className="h-16 w-16 text-3xl font-bold"
          onClick={() => onSelect(button)}
          disabled={disabled}
        >
          {button}
        </Button>
      ))}
    </div>
  );
}

function NumberComparatorInner() {
  const [hasMounted, setHasMounted] = useState(false);
  const [numberA, setNumberA] = useState(0);
  const [numberB, setNumberB] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const initializeChallenge = useCallback(() => {
    const { first, second } = createDistinctNumbers();
    setNumberA(first);
    setNumberB(second);
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

  const comparisonResult = useMemo<ComparisonChoice>(() => {
    if (numberA > numberB) return ">";
    if (numberA < numberB) return "<";
    return "=";
  }, [numberA, numberB]);

  const handleChoice = useCallback(
    (choice: ComparisonChoice) => {
      if (!hasMounted) return;

      if (choice === comparisonResult) {
        setFeedback({
          status: "success",
          message: "Kamu jago membandingkan bilangan!",
        });
      } else {
        setFeedback({
          status: "error",
          message: "Coba bandingkan angka puluhannya terlebih dahulu!",
        });
      }
    },
    [comparisonResult, hasMounted]
  );

  const handleNext = useCallback(() => {
    initializeChallenge();
  }, [initializeChallenge]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <NumberCard label="Bilangan A" value={numberA} isReady={hasMounted} />
        <NumberCard label="Bilangan B" value={numberB} isReady={hasMounted} />
      </div>

      <ComparisonButtons onSelect={handleChoice} disabled={!hasMounted} />

      <Card>
        <CardFooter className="w-full">
          {feedback ? (
            feedback.status === "success" ? (
              <Alert className="w-full border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/50 dark:text-green-50">
                <AlertTitle>Tepat Sekali!</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-3 text-sm">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={handleNext}
                  >
                    Lanjut
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="w-full">
                <AlertTitle>Belum Tepat!</AlertTitle>
                <AlertDescription className="mt-1 flex flex-col gap-3 text-sm">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={handleNext}
                  >
                    Soal Berikutnya
                  </Button>
                </AlertDescription>
              </Alert>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Pilih simbol yang paling tepat untuk membandingkan kedua bilangan
              di atas.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function NumberComparator() {
  return <NumberComparatorInner />;
}
