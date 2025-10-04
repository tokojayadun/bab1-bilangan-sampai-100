"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AuthGuardProps = {
  children: ReactNode;
};

function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const session = await supabase.auth.getSession();
        setIsAuthenticated(Boolean(session.data.session));
      } catch (error) {
        console.error("Supabase session check failed", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    void verifySession();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "https://peserta-paham-pelajaran.netlify.app/";
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return <div>Memverifikasi akses Anda...</div>;
  }

  if (!isAuthenticated) {
    return <div>Akses ditolak. Anda akan dialihkan ke halaman login...</div>;
  }

  return <>{children}</>;
}

export default AuthGuard;
