"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { supabase, ATTACHMENTS_BUCKET } from "../../lib/supabase";
import { Card, CardContent, CardHeader, Button, Pill } from "../../components/ui";
import { strings, type Lang } from "../../lib/i18n";
import { useRouter } from "next/navigation";

type ConsultationRow = {
  id: string;
  created_at: string;
  doctor_phone: string;
  urgency: "elective" | "urgent" | "very_urgent";
  status: "new" | "in_progress" | "closed";
  patients: Array<{
    id: string;
    name: string;
    location: string;
    location_other: string | null;
    case_summary: string | null;
  }>;
  attachments: Array<{
    id: string;
    file_path: string;
    file_name: string;
    mime_type: string | null;
    size_bytes: number | null;
  }>;
};

function urgencyTone(u: ConsultationRow["urgency"]) {
  if (u === "very_urgent") return "danger";
  if (u === "urgent") return "warn";
  return "neutral";
}

function statusTone(s: ConsultationRow["status"]) {
  if (s === "closed") return "ok";
  if (s === "in_progress") return "warn";
  return "neutral";
}

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => strings[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function ensureAuth() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) router.replace("/admin/login");
  }

  async function load() {
    setErr(null);
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select(
          "id, created_at, doctor_phone, urgency, status, patients(id,name,location,location_other,case_summary), attachments(id,file_path,file_name,mime_type,size_bytes)"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data || []) as any);
    } catch (e: any) {
      console.error("Admin Load Error:", e);
      setErr(lang === "ar" ? "لا يمكن عرض البيانات. تأكد من صلاحيات المشرف." : "Cannot load data. Check permissions.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  async function updateStatus(id: string, status: ConsultationRow["status"]) {
    try {
      const { error } = await supabase.from("consultations").update({ status }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      // ignore
    }
  }

  async function getPublicUrl(path: string) {
    const { data } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  useEffect(() => {
    ensureAuth().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-4 md:p-10 animate-fade-in" dir={dir}>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#369094] text-white shadow-lg shadow-[#369094]/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">{lang === "ar" ? "لوحة المشرف" : "Admin Dashboard"}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            {t.consultations}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {t.newestFirst}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 glass p-1.5 rounded-2xl shadow-sm">
          <div className="flex bg-slate-100 p-0.5 rounded-xl">
            <button
              onClick={() => setLang("ar")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                lang === "ar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >عربي</button>
            <button
              onClick={() => setLang("en")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                lang === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >EN</button>
          </div>
          <Button variant="secondary" size="sm" onClick={load} className="gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            {t.signOut}
          </Button>
        </div>
      </header>

      {err && (
        <Card className="mb-8 border-rose-100 bg-rose-50/50">
          <CardContent className="py-4 text-sm font-bold text-rose-800 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {err}
          </CardContent>
        </Card>
      )}

      {busy ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-[#d9f0f0] border-t-[#369094] rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14.5 2 14.5 7.5 20 7.5" /></svg>
          </div>
          <p className="text-slate-500 font-bold">{lang === "ar" ? "لا توجد استشارات حالياً" : "No consultations at the moment"}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {rows.map((r, idx) => (
            <Card key={r.id} className="animate-scale-in group" style={{ animationDelay: `${idx * 50}ms` }}>
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-6 bg-slate-50/30">
                <div className="flex flex-wrap items-center gap-3">
                  <Pill tone={urgencyTone(r.urgency) as any}>
                    {r.urgency === "elective" ? t.elective : r.urgency === "urgent" ? t.urgent : t.veryUrgent}
                  </Pill>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white/50 px-2 py-1 rounded-lg border border-slate-100">
                    {new Date(r.created_at).toLocaleString(lang === "ar" ? "ar" : "en", {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      className={clsx(
                        "rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold appearance-none transition-all duration-200 outline-none pr-8 pl-8",
                        r.status === "closed" ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                          r.status === "in_progress" ? "text-amber-700 bg-amber-50 border-amber-100" :
                            "text-slate-700 bg-slate-50 border-slate-200"
                      )}
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value as any)}
                    >
                      <option value="new">{t.new}</option>
                      <option value="in_progress">{t.inProgress}</option>
                      <option value="closed">{t.closed}</option>
                    </select>
                    <div className={clsx("absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-50", lang === "ar" ? "left-3" : "right-3")}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-8 md:grid-cols-[1fr_2fr] p-6 lg:p-8">
                <div className="space-y-6">
                  <div className="space-y-1.5 p-4 rounded-2xl bg-[#f0f9f9]/50 border border-[#d9f0f0]/50">
                    <div className="text-[10px] font-bold text-[#2d7479] uppercase tracking-widest">{lang === "ar" ? "هاتف الطبيب" : "Doctor phone"}</div>
                    <div className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#369094]"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      {r.doctor_phone}
                    </div>
                  </div>

                  {r.attachments?.length ? (
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mr-1">{lang === "ar" ? "المرفقات" : "Attachments"}</div>
                      <div className="flex flex-wrap gap-2">
                        {r.attachments.map((a) => (
                          <button
                            key={a.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            onClick={async () => {
                              const url = await getPublicUrl(a.file_path);
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#369094]"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            {a.file_name.length > 20 ? a.file_name.substring(0, 17) + '...' : a.file_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mr-1">{lang === "ar" ? "المرضى والحالات" : "Patients & Cases"}</div>
                  <div className="grid gap-4">
                    {r.patients?.map((p) => (
                      <div key={p.id} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/20 p-5 group/patient transition-all hover:bg-white hover:border-[#b5e1e2] hover:shadow-md">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between mb-3 border-b border-slate-100 pb-3">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-[#369094]/50 group-hover/patient:bg-[#369094] transition-colors"></div>
                            {p.name}
                          </div>
                          <div className="text-[11px] font-bold text-[#2d7479] bg-[#f0f9f9] px-3 py-1 rounded-lg border border-[#d9f0f0] flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            {p.location === "Other" ? (p.location_other || "Other") : p.location}
                          </div>
                        </div>
                        {p.case_summary && (
                          <div className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed font-medium pl-3 pr-3 italic bg-white/50 p-3 rounded-xl border border-slate-50">
                            {p.case_summary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
