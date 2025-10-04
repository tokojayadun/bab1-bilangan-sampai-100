"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ShoppingBasket } from "lucide-react";

const DRAG_TYPES = {
  apple: "APPLE",
} as const;

const APPLE_ICON = String.fromCodePoint(0x1f34e);
const CELEBRATION_ICON = String.fromCodePoint(0x1f389);

type DragItem = {
  id: string;
  type: typeof DRAG_TYPES.apple;
};

type FeedbackState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | null;

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const createAppleIds = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    return `apple-${Date.now()}-${index}-${randomSuffix}`;
  });

function DraggableApple({ id }: { id: string }) {
  const [{ isDragging }, drag] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: DRAG_TYPES.apple,
      item: { id, type: DRAG_TYPES.apple },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id],
  );

  const elementRef = useRef<HTMLSpanElement | null>(null);
  drag(elementRef);

  return (
    <span
      ref={elementRef}
      role="img"
      aria-label="apel"
      className={cn(
        "flex h-12 w-12 cursor-grab select-none items-center justify-center rounded-lg border bg-background text-2xl shadow-sm transition-transform",
        isDragging ? "scale-95 opacity-40" : "hover:scale-105",
      )}
    >
      {APPLE_ICON}
    </span>
  );
}

function BasketDropZone({
  basketIds,
  onDropApple,
}: {
  basketIds: string[];
  onDropApple: (appleId: string) => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: DRAG_TYPES.apple,
      drop: (item) => {
        onDropApple(item.id);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onDropApple],
  );

  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  drop(dropZoneRef);

  const renderContent = () => {
    if (basketIds.length > 0) {
      return basketIds.map((id) => (
        <span key={id} aria-hidden="true" className="text-3xl">
          {APPLE_ICON}
        </span>
      ));
    }

    return (
      <span className="text-sm text-muted-foreground">
        Keranjang kosong. Ayo mulai!
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle>Keranjang Puluhan</CardTitle>
          <CardDescription>
            Seret apel ke sini. Saat penuh, keranjang otomatis jadi puluhan.
          </CardDescription>
        </div>
        <div
          className={cn(
            "text-sm font-semibold",
            basketIds.length > 0
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground",
          )}
        >
          {basketIds.length}/10
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={dropZoneRef}
          className={cn(
            "flex min-h-[140px] w-full flex-wrap items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted/40 p-4 text-2xl transition-colors",
            isOver && canDrop
              ? "border-green-500 bg-green-100/80"
              : "border-muted-foreground/40",
          )}
          aria-label="Keranjang puluhan"
        >
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}

function TensStacksCard({ tensStacks }: { tensStacks: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keranjang Apel</CardTitle>
        <CardDescription>Setiap keranjang berisi 10 apel.</CardDescription>
      </CardHeader>
      <CardContent>
        {tensStacks > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: tensStacks }, (_, index) => (
              <ShoppingBasket
                key={`stack-${index}`}
                className="h-10 w-10 text-amber-700"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada keranjang penuh. Isi keranjang sampai 10 apel.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CountingArenaInner() {
  const [hasMounted, setHasMounted] = useState(false);
  const [initialAppleCount, setInitialAppleCount] = useState(0);
  const [availableAppleIds, setAvailableAppleIds] = useState<string[]>([]);
  const [basketAppleIds, setBasketAppleIds] = useState<string[]>([]);
  const [tensStacks, setTensStacks] = useState(0);
  const [tensInput, setTensInput] = useState("");
  const [unitsInput, setUnitsInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const initializeLevel = useCallback(() => {
    const nextCount = randomBetween(11, 29);
    setInitialAppleCount(nextCount);
    setAvailableAppleIds(createAppleIds(nextCount));
    setBasketAppleIds([]);
    setTensStacks(0);
    setTensInput("");
    setUnitsInput("");
    setFeedback(null);
  }, []);

  const handleRetry = useCallback(() => {
    setTensInput("");
    setUnitsInput("");
    setFeedback(null);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      initializeLevel();
    }
  }, [hasMounted, initializeLevel]);

  const totalRemainingUnits = availableAppleIds.length + basketAppleIds.length;
  const totalApples = tensStacks * 10 + totalRemainingUnits;
  const isLevelReady = initialAppleCount > 0;
  const handleDropApple = useCallback(
    (appleId: string) => {
      let removed = false;

      setAvailableAppleIds((previous) => {
        if (!previous.includes(appleId)) {
          return previous;
        }

        removed = true;
        return previous.filter((id) => id !== appleId);
      });

      if (!removed) {
        return;
      }

      setBasketAppleIds((previous) => {
        if (previous.includes(appleId)) {
          return previous;
        }

        const updated = [...previous, appleId];

        if (updated.length >= 10) {
          setTensStacks((current) => current + 1);
          return [];
        }

        return updated;
      });

      setFeedback(null);
    },
    [setAvailableAppleIds, setBasketAppleIds, setTensStacks, setFeedback],
  );

  const handleCheckAnswer = useCallback(() => {
    const tensValue = Number(tensInput);
    const unitsValue = Number(unitsInput);

    const invalidInput =
      tensInput.trim() === "" ||
      unitsInput.trim() === "" ||
      Number.isNaN(tensValue) ||
      Number.isNaN(unitsValue) ||
      tensValue < 0 ||
      unitsValue < 0 ||
      !Number.isInteger(tensValue) ||
      !Number.isInteger(unitsValue);

    if (invalidInput) {
      setFeedback({
        status: "error",
        message: "Isi jawaban dengan angka bulat dan tidak negatif, ya.",
      });
      return;
    }

    const actualTens = tensStacks;
    const actualUnits = totalRemainingUnits;

    if (tensValue === actualTens && unitsValue === actualUnits) {
      setFeedback({
        status: "success",
        message: `Mantap! Kamu membuat ${actualTens} puluhan dan ${actualUnits} satuan.`,
      });
      return;
    }

    setFeedback({
      status: "error",
      message: "Belum tepat. Hitung kembali puluhan dan satuannya, ya!",
    });
  }, [tensInput, unitsInput, tensStacks, totalRemainingUnits]);

  const handleNextLevel = useCallback(() => {
    initializeLevel();
  }, [initializeLevel]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Arena Membilang Benda</CardTitle>
            <CardDescription>
              {isLevelReady
                ? `Level ini dimulai dengan ${initialAppleCount} apel. Masih ada ${totalApples} apel yang perlu kamu kelompokkan ke puluhan.`
                : "Menyiapkan level baru..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {isLevelReady && availableAppleIds.length > 0 ? (
                availableAppleIds.map((id) => (
                  <DraggableApple key={id} id={id} />
                ))
              ) : isLevelReady ? (
                <p className="text-sm text-muted-foreground">
                  Semua apel sudah kamu pindahkan dari arena {CELEBRATION_ICON}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Mohon tunggu sebentar...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <BasketDropZone
            basketIds={basketAppleIds}
            onDropApple={handleDropApple}
          />
          <TensStacksCard tensStacks={tensStacks} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Jawabanmu</CardTitle>
          <CardDescription>
            Tuliskan jumlah tumpukan puluhan dan sisa apel satuan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tens-input">Puluhan</Label>
              <Input
                id="tens-input"
                type="number"
                min={0}
                inputMode="numeric"
                value={tensInput}
                onChange={(event) => setTensInput(event.target.value)}
                placeholder="contoh: 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="units-input">Satuan</Label>
              <Input
                id="units-input"
                type="number"
                min={0}
                inputMode="numeric"
                value={unitsInput}
                onChange={(event) => setUnitsInput(event.target.value)}
                placeholder="contoh: 4"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <Button onClick={handleCheckAnswer} disabled={!isLevelReady}>
            Periksa Jawaban
          </Button>
          {feedback ? (
            feedback.status === "success" ? (
              <Alert className="w-full border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/50 dark:text-green-50 md:max-w-md">
                <AlertTitle>Jawaban Tepat!</AlertTitle>
                <AlertDescription className="flex flex-col gap-3">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextLevel}
                    className="self-start"
                  >
                    Soal Berikutnya
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="w-full md:max-w-md">
                <AlertTitle>Belum Tepat</AlertTitle>
                <AlertDescription className="flex flex-col gap-3">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="self-start"
                  >
                    Coba Lagi
                  </Button>
                </AlertDescription>
              </Alert>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Isi jawabanmu, lalu tekan Periksa Jawaban.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CountingArena() {
  return (
    <DndProvider backend={HTML5Backend}>
      <CountingArenaInner />
    </DndProvider>
  );
}















