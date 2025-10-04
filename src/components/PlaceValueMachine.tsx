"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const DRAG_TYPES = {
  tens: "TENS_BLOCK",
  ones: "ONES_BLOCK",
} as const;

type Mode = "build" | "guess";

type BlockType = keyof typeof DRAG_TYPES;

type DragItem = {
  blockType: BlockType;
};

type WorkspaceBlock = {
  id: string;
  type: BlockType;
};

type FeedbackState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | null;

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const createWorkspaceBlock = (type: BlockType): WorkspaceBlock => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
});

function TensBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-24 w-4 rounded-sm bg-blue-500",
        "shadow-sm",
        className,
      )}
    />
  );
}

function OnesBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 rounded-sm bg-yellow-400",
        "shadow-sm",
        className,
      )}
    />
  );
}

function BankBlock({
  blockType,
  label,
  canDrag,
}: {
  blockType: BlockType;
  label: string;
  canDrag: boolean;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>(
    () => ({
      type: DRAG_TYPES[blockType],
      item: { blockType },
      canDrag,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [blockType, canDrag],
  );

  return (
    <div
      ref={dragRef}
      className={cn(
        "flex cursor-grab flex-col items-center gap-2 rounded-md border bg-card p-3 text-center transition-all",
        !canDrag && "cursor-not-allowed opacity-70",
        isDragging && "scale-95 opacity-60",
      )}
    >
      {blockType === "tens" ? (
        <TensBlock className="mx-auto" />
      ) : (
        <OnesBlock className="mx-auto" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function WorkspaceArea({
  mode,
  workspaceBlocks,
  guessTens,
  guessOnes,
  onDropBlock,
}: {
  mode: Mode;
  workspaceBlocks: WorkspaceBlock[];
  guessTens: number;
  guessOnes: number;
  onDropBlock: (type: BlockType) => void;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: [DRAG_TYPES.tens, DRAG_TYPES.ones],
      canDrop: () => mode === "build",
      drop: (item) => {
        if (mode === "build") {
          onDropBlock(item.blockType);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [mode, onDropBlock],
  );

  const renderBlocks = () => {
    if (mode === "build") {
      return workspaceBlocks.map((block) =>
        block.type === "tens" ? (
          <TensBlock key={block.id} />
        ) : (
          <OnesBlock key={block.id} />
        ),
      );
    }

    const blocks: JSX.Element[] = [];
    for (let i = 0; i < guessTens; i += 1) {
      blocks.push(<TensBlock key={`guess-tens-${i}`} />);
    }
    for (let i = 0; i < guessOnes; i += 1) {
      blocks.push(<OnesBlock key={`guess-ones-${i}`} />);
    }
    return blocks;
  };

  const hasBlocks =
    mode === "build"
      ? workspaceBlocks.length > 0
      : guessTens + guessOnes > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Area Bermain Balok
        </h3>
        {mode === "build" ? (
          <span className="text-xs text-muted-foreground">
            Seret balok ke sini
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Hitung balok yang ada
          </span>
        )}
      </div>
      <div
        ref={dropRef}
        className={cn(
          "min-h-[240px] rounded-lg border-2 border-dashed bg-muted/40 p-4 transition-colors",
          mode === "build" && canDrop && isOver && "border-blue-500 bg-blue-100/60",
          mode !== "build" && "border-muted-foreground/40",
        )}
      >
        {hasBlocks ? (
          <div className="flex flex-wrap gap-3">{renderBlocks()}</div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {mode === "build"
              ? "Belum ada balok. Ambil dari bank di atas, ya!"
              : "Menyiapkan balok..."}
          </p>
        )}
      </div>
    </div>
  );
}

function PlaceValueMachineInner() {
  const [mode, setMode] = useState<Mode>("build");
  const [hasMounted, setHasMounted] = useState(false);
  const [targetNumber, setTargetNumber] = useState(0);
  const [workspaceBlocks, setWorkspaceBlocks] = useState<WorkspaceBlock[]>([]);
  const [guessTens, setGuessTens] = useState(0);
  const [guessOnes, setGuessOnes] = useState(0);
  const [guessInput, setGuessInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const workspaceSummary = useMemo(() => {
    const tens = workspaceBlocks.filter((block) => block.type === "tens").length;
    const ones = workspaceBlocks.length - tens;
    return { tens, ones, value: tens * 10 + ones };
  }, [workspaceBlocks]);

  const guessValue = guessTens * 10 + guessOnes;
  const targetTens = Math.floor(targetNumber / 10);
  const targetOnes = targetNumber % 10;

  const initializeBuildChallenge = useCallback(() => {
    const nextTarget = randomBetween(11, 99);
    setTargetNumber(nextTarget);
    setWorkspaceBlocks([]);
    setFeedback(null);
  }, []);

  const initializeGuessChallenge = useCallback(() => {
    const tens = randomBetween(1, 9);
    const ones = randomBetween(0, 9);
    setGuessTens(tens);
    setGuessOnes(ones);
    setGuessInput("");
    setFeedback(null);
    setWorkspaceBlocks([]);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    if (mode === "build") {
      initializeBuildChallenge();
    } else {
      initializeGuessChallenge();
    }
  }, [hasMounted, mode, initializeBuildChallenge, initializeGuessChallenge]);

  const handleDropBlock = useCallback(
    (type: BlockType) => {
      setWorkspaceBlocks((previous) => [...previous, createWorkspaceBlock(type)]);
      setFeedback(null);
    },
    [],
  );

  const handleCheckAnswer = useCallback(() => {
    if (mode === "build") {
      if (workspaceSummary.value === targetNumber) {
        setFeedback({
          status: "success",
          message: `Hebat! Kamu berhasil membangun bilangan ${targetNumber}.`,
        });
      } else {
        setFeedback({
          status: "error",
          message: "Belum pas. Coba cek lagi jumlah puluhan dan satuannya, ya!",
        });
      }
      return;
    }

    if (guessInput.trim() === "") {
      setFeedback({
        status: "error",
        message: "Isi dulu jawabannya dengan angka, ya!",
      });
      return;
    }

    const numericGuess = Number(guessInput);
    if (!Number.isInteger(numericGuess) || numericGuess < 0) {
      setFeedback({
        status: "error",
        message: "Masukkan bilangan bulat yang tidak negatif.",
      });
      return;
    }

    if (numericGuess === guessValue) {
      setFeedback({
        status: "success",
        message: `Tepat sekali! ${guessTens} puluhan dan ${guessOnes} satuan membentuk bilangan ${guessValue}.`,
      });
      return;
    }

    setFeedback({
      status: "error",
      message: "Masih salah. Hitung lagi jumlah puluhan dan satuannya, yuk!",
    });
  }, [mode, workspaceSummary.value, targetNumber, guessInput, guessValue, guessTens, guessOnes]);

  const handleRetry = useCallback(() => {
    if (mode === "build") {
      setWorkspaceBlocks([]);
    } else {
      setGuessInput("");
    }
    setFeedback(null);
  }, [mode, setWorkspaceBlocks, setGuessInput, setFeedback]);

  const handleNextChallenge = useCallback(() => {
    if (mode === "build") {
      initializeBuildChallenge();
    } else {
      initializeGuessChallenge();
    }
  }, [mode, initializeBuildChallenge, initializeGuessChallenge]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Mesin Nilai Tempat</CardTitle>
          <CardDescription>
            Pilih mode permainan, lalu kerjakan tantangannya di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="build">Bangun Bilangan</TabsTrigger>
              <TabsTrigger value="guess">Tebak Bilangan</TabsTrigger>
            </TabsList>

            <TabsContent value="build" className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Ayo bangun bilangan:
                </p>
                <p className="text-3xl font-bold text-primary">
                  {hasMounted ? targetNumber : "..."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-md bg-background p-3 shadow-sm">
                    <p className="font-semibold">Target</p>
                    <p className="text-muted-foreground">
                      {hasMounted ? (
                        <>
                          {targetTens} puluhan & {targetOnes} satuan
                        </>
                      ) : (
                        "Menyiapkan..."
                      )}
                    </p>
                  </div>
                  <div className="rounded-md bg-background p-3 shadow-sm">
                    <p className="font-semibold">Area Bermain Balok</p>
                    <p className="text-muted-foreground">
                      {workspaceSummary.tens} puluhan & {workspaceSummary.ones} satuan
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleCheckAnswer} disabled={!hasMounted}>
                Periksa
              </Button>
            </TabsContent>

            <TabsContent value="guess" className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Hitung balok di area kerja, lalu tulis bilanganmu.
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasMounted
                    ? `Terdapat ${guessTens} puluhan dan ${guessOnes} satuan.`
                    : "Menyiapkan balok..."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guess-input">Jawabanmu</Label>
                <Input
                  id="guess-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={guessInput}
                  onChange={(event) => setGuessInput(event.target.value)}
                  placeholder="contoh: 72"
                  disabled={!hasMounted}
                />
              </div>
              <Button onClick={handleCheckAnswer} disabled={!hasMounted}>
                Periksa
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          {feedback ? (
            feedback.status === "success" ? (
              <Alert className="w-full border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/50 dark:text-green-50">
                <AlertTitle>Benar Sekali!</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-3 text-sm">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={handleNextChallenge}
                    disabled={!hasMounted}
                  >
                    Lanjut
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="w-full">
                <AlertTitle>Coba Lagi ya!</AlertTitle>
                <AlertDescription className="mt-1 flex flex-col gap-3 text-sm">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="self-start"
                    disabled={!hasMounted}
                  >
                    Coba Lagi
                  </Button>
                </AlertDescription>
              </Alert>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Setelah menjawab, kamu akan mendapat umpan balik di sini.
            </p>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Panel Visual</CardTitle>
          <CardDescription>
            Ambil balok dari bank, lalu susun di area kerja untuk memahami nilai tempat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Gudang Balok
              </h3>
              {mode === "build" ? (
                <span className="text-xs text-muted-foreground">
                  Seret balok dari sini
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Mode ini hanya untuk menghitung
                </span>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <BankBlock blockType="tens" label="Balok Puluhan" canDrag={mode === "build" && hasMounted} />
              <BankBlock blockType="ones" label="Balok Satuan" canDrag={mode === "build" && hasMounted} />
            </div>
          </div>

          <WorkspaceArea
            mode={mode}
            workspaceBlocks={workspaceBlocks}
            guessTens={guessTens}
            guessOnes={guessOnes}
            onDropBlock={handleDropBlock}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PlaceValueMachine() {
  return (
    <DndProvider backend={HTML5Backend}>
      <PlaceValueMachineInner />
    </DndProvider>
  );
}
