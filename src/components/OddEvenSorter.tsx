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
import { cn } from "@/lib/utils";

const DRAG_TYPE = "ODD_EVEN_NUMBER";

type CardId = string;

type DragItem = {
  cardId: CardId;
};

type NumberCardData = {
  id: CardId;
  value: number;
};

type FeedbackState =
  | { status: "success"; message: string }
  | null;

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function createNumberCards(): NumberCardData[] {
  const numbers = new Set<number>();
  while (numbers.size < 10) {
    numbers.add(randomBetween(1, 100));
  }

  return Array.from(numbers).map((value, index) => ({
    id: `card-${value}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    value,
  }));
}

function NumberCard({
  card,
  draggable = false,
}: {
  card: NumberCardData;
  draggable?: boolean;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>(
    () => ({
      type: DRAG_TYPE,
      item: { cardId: card.id },
      canDrag: draggable,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [card.id, draggable],
  );

  return (
    <div ref={draggable ? dragRef : undefined} className="w-full">
      <Card
        className={cn(
          "select-none text-center transition-all",
          draggable ? "cursor-grab" : "cursor-default",
          draggable && isDragging && "scale-95 opacity-60",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl font-bold text-primary">{card.value}</CardTitle>
          <CardDescription>Kartu Bilangan</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function DropZone({
  title,
  description,
  backgroundClass,
  canAccept,
  onAccept,
  cards,
}: {
  title: string;
  description: string;
  backgroundClass: string;
  canAccept: (cardId: CardId) => boolean;
  onAccept: (cardId: CardId) => void;
  cards: NumberCardData[];
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: DRAG_TYPE,
      canDrop: (item) => canAccept(item.cardId),
      drop: (item) => {
        if (canAccept(item.cardId)) {
          onAccept(item.cardId);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [canAccept, onAccept],
  );

  return (
    <Card
      ref={dropRef}
      className={cn(
        "min-h-[220px] transition-colors",
        backgroundClass,
        isOver && canDrop && "border-primary bg-primary/10",
        isOver && !canDrop && "border-destructive bg-destructive/10",
      )}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {cards.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <NumberCard key={card.id} card={card} draggable={false} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada kartu di keranjang ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OddEvenSorterInner() {
  const hintNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const [hasMounted, setHasMounted] = useState(false);
  const [poolCards, setPoolCards] = useState<NumberCardData[]>([]);
  const [evenCards, setEvenCards] = useState<NumberCardData[]>([]);
  const [oddCards, setOddCards] = useState<NumberCardData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const initializeGame = useCallback(() => {
    const cards = createNumberCards();
    setPoolCards(cards);
    setEvenCards([]);
    setOddCards([]);
    setFeedback(null);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      initializeGame();
    }
  }, [hasMounted, initializeGame]);

  const cardLookup = useMemo(() => {
    const map = new Map<CardId, NumberCardData>();
    poolCards.forEach((card) => map.set(card.id, card));
    return map;
  }, [poolCards]);

  const handleAccept = useCallback(
    (destination: "even" | "odd", cardId: CardId) => {
      const card = cardLookup.get(cardId);
      if (!card) {
        return;
      }

      const isEven = card.value % 2 === 0;
      const isCorrect = (destination === "even" && isEven) || (destination === "odd" && !isEven);

      if (!isCorrect) {
        return;
      }

      setPoolCards((previous) => previous.filter((item) => item.id !== cardId));

      if (destination === "even") {
        setEvenCards((previous) => [...previous, card]);
      } else {
        setOddCards((previous) => [...previous, card]);
      }
    },
    [cardLookup],
  );

  const canAcceptEven = useCallback(
    (cardId: CardId) => {
      const card = cardLookup.get(cardId);
      return Boolean(card && card.value % 2 === 0);
    },
    [cardLookup],
  );

  const canAcceptOdd = useCallback(
    (cardId: CardId) => {
      const card = cardLookup.get(cardId);
      return Boolean(card && card.value % 2 !== 0);
    },
    [cardLookup],
  );

  useEffect(() => {
    if (hasMounted && poolCards.length === 0 && (evenCards.length > 0 || oddCards.length > 0)) {
      setFeedback({
        status: "success",
        message: "Selamat! Semua bilangan sudah kamu sortir dengan benar.",
      });
    }
  }, [hasMounted, poolCards.length, evenCards.length, oddCards.length]);

  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle>Permainan Sortir Ganjil & Genap</CardTitle>
        <CardDescription>
          Seret setiap kartu bilangan ke keranjang GENAP atau GANJIL yang sesuai.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Kumpulan Kartu
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {hasMounted ? (
                  poolCards.length > 0 ? (
                    poolCards.map((card) => (
                      <NumberCard key={card.id} card={card} draggable />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Semua kartu sudah kamu sortir! ??
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Menyiapkan kartu...</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DropZone
                title="Keranjang GENAP"
                description="Masukkan semua bilangan genap ke sini."
                backgroundClass="bg-blue-50"
                canAccept={canAcceptEven}
                onAccept={(cardId) => handleAccept("even", cardId)}
                cards={evenCards}
              />
              <DropZone
                title="Keranjang GANJIL"
                description="Masukkan semua bilangan ganjil ke sini."
                backgroundClass="bg-yellow-50"
                canAccept={canAcceptOdd}
                onAccept={(cardId) => handleAccept("odd", cardId)}
                cards={oddCards}
              />
            </div>
          </div>

          <Card className="bg-muted/30 md:col-span-1">
            <CardHeader>
              <CardTitle>Ciri-Ciri Bilangan</CardTitle>
              <CardDescription>Gunakan panduan ini untuk mengenali bilangan genap dan ganjil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2 text-lg font-semibold">
                {hintNumbers.map((number) => (
                  <span
                    key={`hint-number-${number}`}
                    className={number % 2 === 0 ? "text-blue-600" : "text-red-500"}
                  >
                    {number}
                  </span>
                ))}
              </div>
              <div className="space-y-2 text-xs font-semibold">
                <p className="text-red-500">Merah = Ganjil (akhiran 1,3,5,7,9)</p>
                <p className="text-blue-600">Biru = Genap (akhiran 0,2,4,6,8)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button variant="outline" size="sm" onClick={initializeGame} disabled={!hasMounted}>
          Tantangan Baru
        </Button>
        {feedback ? (
          <Alert className="border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/50 dark:text-green-50">
            <AlertTitle>Kerja Keren!</AlertTitle>
            <AlertDescription className="text-sm">{feedback.message}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sortir semua kartu untuk memenangkan permainan.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

export default function OddEvenSorter() {
  return (
    <DndProvider backend={HTML5Backend}>
      <OddEvenSorterInner />
    </DndProvider>
  );
}


