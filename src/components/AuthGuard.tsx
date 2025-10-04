"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AuthGuardProps = {
  children: ReactNode;
};

function AuthGuard({ children }: AuthGuardProps) {
  const babId = 4;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = searchParams.get("token");

  useEffect(() => {
    const redirectToLogin = () => {
      router.replace("https://peserta-paham-pelajaran.netlify.app/");
    };

    const validateAccess = async () => {
      if (!token) {
        redirectToLogin();
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token,
        });

        if (sessionError) {
          throw sessionError;
        }

        const user = sessionData.session?.user;
        if (!user?.email) {
          throw new Error("User tidak valid.");
        }

        const { data: pembeliData, error: pembeliError } = await supabase
          .from("pembeli")
          .select("id")
          .eq("username", user.email)
          .single();

        if (pembeliError || !pembeliData?.id) {
          throw pembeliError ?? new Error("Pembeli tidak ditemukan.");
        }

        const pembeliId = pembeliData.id;

        const { data: pembelianData, error: pembelianError } = await supabase
          .from("pembelian")
          .select("*")
          .eq("pembeli_id", pembeliId)
          .eq("bab_id", babId);

        if (pembelianError) {
          throw pembelianError;
        }

        if (Array.isArray(pembelianData) && pembelianData.length > 0) {
          setIsAuthorized(true);
          return;
        }

        window.alert("Anda belum memiliki akses ke materi Bab ini.");
        redirectToLogin();
      } catch (error) {
        console.error("Validasi akses gagal:", error);
        window.alert("Terjadi kesalahan saat memverifikasi akses. Silakan login ulang.");
        redirectToLogin();
      } finally {
        setLoading(false);
      }
    };

    void validateAccess();
  }, [router, token]);

  if (loading) {
    return <div>Memverifikasi akses Anda...</div>;
  }

  if (!isAuthorized) {
    return <div>Akses ditolak. Anda akan dialihkan ke halaman login...</div>;
  }

  return <>{children}</>;
}

export default AuthGuard;
