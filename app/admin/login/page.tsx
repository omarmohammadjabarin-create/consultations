"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { supabase } from "../../../lib/supabase";
import { Card, CardContent, CardHeader, Button, Input, Label } from "../../../components/ui";
import { strings, type Lang } from "../../../lib/i18n";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => strings[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [email, setEmail] = useState("dr.f.jabb@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function signIn() {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/admin");
    } catch (e: any) {
      setErr(lang === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in" dir={dir}>
      <div className="w-full max-w-md space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#369094] text-white shadow-xl shadow-[#369094]/20 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.login}</h1>
            <p className="text-sm text-slate-500 font-medium whitespace-pre-wrap max-w-[280px] mx-auto">{t.subtitle}</p>
          </div>

          <div className="flex glass p-1 rounded-xl shadow-sm w-fit mx-auto">
            <button
              onClick={() => setLang("ar")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                lang === "ar" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
              )}
            >
              عربي
            </button>
            <button
              onClick={() => setLang("en")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                lang === "en" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
              )}
            >
              EN
            </button>
          </div>
        </header>

        <Card className="animate-slide-up">
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t.adminEmail}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminPassword}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {err && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 animate-shake flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {err}
              </div>
            )}

            <Button variant="brand" onClick={signIn} disabled={busy} className="w-full py-4 text-base" type="button">
              {busy ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {lang === "ar" ? "جارٍ الدخول..." : "Signing in..."}
                </div>
              ) : t.signIn}
            </Button>

            <div className="text-center pt-2">
              <a className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#2d7479] transition-colors" href="/">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                {lang === "ar" ? "العودة للصفحة الرئيسية" : "Back to home"}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
