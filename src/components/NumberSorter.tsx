"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// HAPUS VERSI YANG LAMA DAN GANTI DENGAN INI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DRAG_TYPE = "NUMBER_CARD";

type SortMode = "asc" | "desc";

type CardId = string;

type DragSource = "pool" | "slot";

type DragItem = {
  cardId: CardId;
  source: DragSource;
  slotIndex?: number;
};

type FeedbackState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | null;

type LayoutState = {
  poolIds: CardId[];
  slotIds: Array<CardId | null>;
};

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(input: T[]): T[] => {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

function TensBlock({ className }: { className?: string }) {
  return (
    <div className={cn("h-24 w-4 rounded-sm bg-blue-500", "shadow-sm", className)} />
  );
}

function OnesBlock({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 w-4 rounded-sm bg-yellow-400", "shadow-sm", className)} />
  );
}

function NumberCardDraggable({
  cardId,
  value,
  source,
  slotIndex,
  disabled,
}: {
  cardId: CardId;
  value: number;
  source: DragSource;
  slotIndex?: number;
  disabled?: boolean;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>(
    () => ({
      type: DRAG_TYPE,
      item: { cardId, source, slotIndex },
      canDrag: !disabled,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [cardId, source, slotIndex, disabled],
  );

  return (
    <div ref={dragRef} className="w-full">
      <Card
        className={cn(
          "select-none text-center transition-all",
          isDragging && "scale-95 opacity-60",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl font-bold text-primary">{value}</CardTitle>
          <CardDescription>Kartu Bilangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto flex max-w-[120px] flex-col gap-2">
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.floor(value / 10) }, (_, index) => (
                <TensBlock key={`tens-${cardId}-${index}`} className="h-12" />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: value % 10 }, (_, index) => (
                <OnesBlock key={`ones-${cardId}-${index}`} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortSlot({
  index,
  cardId,
  value,
  onDrop,
  isInteractive,
}: {
  index: number;
  cardId: CardId | null;
  value: number | null;
  onDrop: (slotIndex: number, item: DragItem) => void;
  isInteractive: boolean;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: DRAG_TYPE,
      canDrop: () => isInteractive,
      drop: (item) => {
        if (isInteractive) {
          onDrop(index, item);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [index, onDrop, isInteractive],
  );

  return (
    <div
      ref={dropRef}
      className={cn(
        "flex min-h-[160px] w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 p-3 transition-colors",
        isOver && canDrop
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/40",
      )}
    >
      {cardId && value !== null ? (
        <NumberCardDraggable
          cardId={cardId}
          value={value}
          source="slot"
          slotIndex={index}
          disabled={!isInteractive}
        />
      ) : (
        <span className="text-sm text-muted-foreground">Taruh kartu di sini</span>
      )}
    </div>
  );
}

function NumberSorterInner() {
  const [hasMounted, setHasMounted] = useState(false);
  const [cardValues, setCardValues] = useState<Record<CardId, number>>({});
  const [layout, setLayout] = useState<LayoutState>({
    poolIds: [],
    slotIds: Array(5).fill(null),
  });
  const [sortMode, setSortMode] = useState<SortMode>("asc");
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const initializeChallenge = useCallback(() => {
    const values = new Set<number>();
    while (values.size < 5) {
      values.add(randomBetween(11, 99));
    }
    const numbers = shuffleArray(Array.from(values));
    const newCardValues: Record<CardId, number> = {};
    const poolIds = numbers.map((value) => {
      const id = value.toString();
      newCardValues[id] = value;
      return id;
    });

    setCardValues(newCardValues);
    setLayout({ poolIds, slotIds: Array(5).fill(null) });
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

  const handleDropToSlot = useCallback(
    (targetIndex: number, item: DragItem) => {
      if (!hasMounted) {
        return;
      }

      setLayout((previous) => {
        const poolIds = [...previous.poolIds];
        const slotIds = [...previous.slotIds];
        const { cardId, source } = item;

        if (source === "slot" && item.slotIndex === targetIndex) {
          return previous;
        }

        const targetCardId = slotIds[targetIndex];

        if (source === "pool") {
          const poolPosition = poolIds.indexOf(cardId);
          if (poolPosition === -1) {
            return previous;
          }
          poolIds.splice(poolPosition, 1);

          if (targetCardId && targetCardId !== cardId) {
            poolIds.push(targetCardId);
          }

          slotIds[targetIndex] = cardId;
          return { poolIds, slotIds };
        }

        if (source === "slot" && typeof item.slotIndex === "number") {
          const fromIndex = item.slotIndex;
          const fromCardId = slotIds[fromIndex];

          if (fromCardId !== cardId) {
            return previous;
          }

          slotIds[fromIndex] = targetCardId ?? null;
          slotIds[targetIndex] = cardId;
          return { poolIds, slotIds };
        }

        return previous;
      });

      setFeedback(null);
    },
    [hasMounted],
  );

  const handleToggleMode = useCallback(() => {
    setSortMode((previous) => (previous === "asc" ? "desc" : "asc"));
    setFeedback(null);
  }, []);

  const slotValues = useMemo(
    () => layout.slotIds.map((id) => (id ? cardValues[id] ?? null : null)),
    [layout.slotIds, cardValues],
  );

  const isCompleted = useMemo(
    () => slotValues.every((value) => value !== null),
    [slotValues],
  );

  const handleCheckOrder = useCallback(() => {
    if (!hasMounted) {
      return;
    }

    if (!isCompleted) {
      setFeedback({
        status: "error",
        message: "Isi semua slot sebelum memeriksa urutan, ya!",
      });
      return;
    }

    const values = slotValues.filter((value): value is number => value !== null);
    const isSorted = values.every((value, index) => {
      if (index === 0) {
        return true;
      }
      return sortMode === "asc"
        ? values[index - 1] <= value
        : values[index - 1] >= value;
    });

    if (isSorted) {
      setFeedback({
        status: "success",
        message: "Keren! Urutanmu sudah tepat.",
      });
      return;
    }

    setFeedback({
      status: "error",
      message: "Urutannya belum tepat. Coba atur lagi sesuai mode sekarang!",
    });
  }, [hasMounted, isCompleted, slotValues, sortMode]);

  const handleNextChallenge = useCallback(() => {
    initializeChallenge();
  }, [initializeChallenge]);

  const currentModeLabel =
    sortMode === "asc" ? "Urutkan dari terkecil" : "Urutkan dari terbesar";
  const toggleButtonLabel =
    sortMode === "asc" ? "Ubah ke urutan terbesar" : "Ubah ke urutan terkecil";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mode pengurutan saat ini:</h2>
          <p className="text-sm text-muted-foreground">{currentModeLabel}</p>
        </div>
        <Button variant="outline" onClick={handleToggleMode} disabled={!hasMounted}>
          {toggleButtonLabel}
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Area Kartu Acak
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {hasMounted ? (
            layout.poolIds.length > 0 ? (
              layout.poolIds.map((cardId) => (
                <NumberCardDraggable
                  key={cardId}
                  cardId={cardId}
                  value={cardValues[cardId]}
                  source="pool"
                  disabled={!hasMounted}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Semua kartu sudah kamu pindahkan ke slot urutan.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Menyiapkan kartu acak...
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Area Urutanmu
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {layout.slotIds.map((cardId, index) => (
            <SortSlot
              key={`slot-${index}`}
              index={index}
              cardId={cardId}
              value={cardId ? cardValues[cardId] ?? null : null}
              onDrop={handleDropToSlot}
              isInteractive={hasMounted}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={handleCheckOrder} disabled={!hasMounted}>
          Periksa
        </Button>
        <div className="flex-1">
          {feedback ? (
            feedback.status === "success" ? (
              <Alert className="border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/50 dark:text-green-50">
                <AlertTitle>Urutanmu Sempurna!</AlertTitle>
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
                <AlertTitle>Coba periksa lagi urutannya ya!</AlertTitle>
                <AlertDescription className="mt-1 flex flex-col gap-3 text-sm">
                  <span>{feedback.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={handleNextChallenge}
                  >
                    Soal Berikutnya
                  </Button>
                </AlertDescription>
              </Alert>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Susun kartu sesuai mode, lalu tekan Periksa untuk melihat hasilmu.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NumberSorter() {
  return (
    <DndProvider backend={HTML5Backend}>
      <NumberSorterInner />
    </DndProvider>
  );
}

