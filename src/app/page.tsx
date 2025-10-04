import CountingArena from "@/components/CountingArena";
import PlaceValueMachine from "@/components/PlaceValueMachine";
import NumberComparator from "@/components/NumberComparator";
import NumberSorter from "@/components/NumberSorter";
import SkipCounter from "@/components/SkipCounter";
import OddEvenSorter from "@/components/OddEvenSorter";
import QuizMasterAI from "@/components/QuizMasterAI";
import AskAnythingAI from "@/components/AskAnythingAI"; // <-- Tambahkan import ini

export default function Home() {
  return (
    <main className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">
        Bab 1: Bilangan Sampai 100
      </h1>

      {/* --- MODUL LATIHAN --- */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Membilang Benda
        </h2>
        <CountingArena />
      </section>
      <hr className="border-t-2" />
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Mesin Nilai Tempat
        </h2>
        <PlaceValueMachine />
      </section>
      <hr className="border-t-2" />
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Timbangan Bilangan
        </h2>
        <NumberComparator />
      </section>
      <hr className="border-t-2" />
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Penyortir Bilangan Ajaib
        </h2>
        <NumberSorter />
      </section>
      <hr className="border-t-2" />
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Lompatan Angka Ajaib
        </h2>
        <SkipCounter />
      </section>
      <hr className="border-t-2" />
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Penyortir Genap Ganjil
        </h2>
        <OddEvenSorter />
      </section>

      {/* --- TANTANGAN AKHIR BAB (AI) --- */}
      <hr className="border-t-4 border-primary my-16" />
      <section>
        <h2 className="text-3xl font-bold mb-4 text-center text-primary">
          Kalau Kamu JAGO, Coba Ini!
        </h2>
        <QuizMasterAI />
      </section>

      {/* --- TANYA APA SAJA (AI) --- */}
      <hr className="border-t-4 border-primary my-16" />
      <section>
        <h2 className="text-3xl font-bold mb-4 text-center text-primary">
          Punya Pertanyaan?
        </h2>
        <p className="text-center text-muted-foreground -mt-4 mb-6">
          Kak AI dengan senang hati akan menjawab!
        </p>
        <AskAnythingAI />
      </section>
    </main>
  );
}
