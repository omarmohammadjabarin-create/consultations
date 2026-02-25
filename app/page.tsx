"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { supabase, ATTACHMENTS_BUCKET } from "../lib/supabase";
import { Card, CardContent, CardHeader, Button, Input, Label, Textarea, Pill } from "../components/ui";
import { strings, type Lang } from "../lib/i18n";
import type { ConsultationDraft, PatientDraft, Urgency } from "../lib/types";

const defaultPatient = (): PatientDraft => ({
  name: "",
  location: "",
  locationOther: "",
  notes: ""
});

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

export default function Page() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => strings[lang], [lang]);

  const [draft, setDraft] = useState<ConsultationDraft>({
    doctorPhone: "",
    urgency: "",
    patients: [defaultPatient()],
    attachments: []
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const dir = lang === "ar" ? "rtl" : "ltr";

  function addPatient() {
    setDraft((d) => ({ ...d, patients: [...d.patients, defaultPatient()] }));
  }

  function removePatient(idx: number) {
    setDraft((d) => ({ ...d, patients: d.patients.filter((_, i) => i !== idx) }));
  }

  function clearForm() {
    setDraft({ doctorPhone: "", urgency: "", patients: [defaultPatient()], attachments: [] });
    setMsg(null);
    const input = document.getElementById("attachments") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function submit() {
    setMsg(null);

    if (!draft.doctorPhone.trim()) return setMsg({ type: "err", text: `${t.doctorPhone}: ${t.required}` });
    if (!isValidPhone(draft.doctorPhone)) return setMsg({ type: "err", text: t.invalidPhone });
    if (!draft.urgency) return setMsg({ type: "err", text: `${t.urgency}: ${t.required}` });

    for (let i = 0; i < draft.patients.length; i++) {
      const p = draft.patients[i];
      if (!p.name.trim()) return setMsg({ type: "err", text: `${t.patientName} (${i + 1}): ${t.required}` });
      if (!p.location) return setMsg({ type: "err", text: `${t.patientLocation} (${i + 1}): ${t.required}` });
      if (p.location === "Other" && !(p.locationOther || "").trim()) {
        return setMsg({ type: "err", text: `${t.otherSpecify} (${i + 1}): ${t.required}` });
      }
    }

    setBusy(true);
    const consultationId = self.crypto.randomUUID();
    try {
      const { error: cErr } = await supabase
        .from("consultations")
        .insert({
          id: consultationId,
          doctor_phone: draft.doctorPhone.trim(),
          urgency: draft.urgency,
          status: "new"
        });

      if (cErr) throw cErr;

      const patientsPayload = draft.patients.map((p) => ({
        consultation_id: consultationId,
        name: p.name.trim(),
        location: p.location,
        location_other: p.location === "Other" ? (p.locationOther || "").trim() : null,
        case_summary: p.notes.trim()
      }));

      const { error: pErr } = await supabase.from("patients").insert(patientsPayload);
      if (pErr) throw pErr;

      if (draft.attachments.length) {
        const metas: any[] = [];
        for (const file of draft.attachments) {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${consultationId}/${Date.now()}_${safeName}`;
          const { error: upErr } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, {
            cacheControl: "3600",
            upsert: false
          });
          if (upErr) throw upErr;

          metas.push({
            consultation_id: consultationId,
            file_path: path,
            file_name: file.name,
            mime_type: file.type || null,
            size_bytes: file.size
          });
        }

        const { error: aErr } = await supabase.from("attachments").insert(metas);
        if (aErr) throw aErr;
      }

      setMsg({ type: "ok", text: t.success });
      clearForm();
    } catch (e: any) {
      console.error("Submission Error Details:", {
        message: e.message,
        details: e.details,
        hint: e.hint,
        code: e.code,
        payload: {
          consultationId,
          doctorPhone: draft.doctorPhone,
          urgency: draft.urgency,
          patientsCount: draft.patients.length
        }
      });
      setMsg({ type: "err", text: e.message || t.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-10 animate-fade-in" dir={dir}>
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#369094]/10 text-[#2d7479] border border-[#369094]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#50acb0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#369094]"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{lang === "ar" ? "نظام الاستشارات الرقمي" : "Digital Consultation System"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-normal">
            {t.title.split('–')[0]}
            <span className="text-[#369094]"> – {t.title.split('–')[1]}</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-500 leading-relaxed font-medium">
            {t.subtitle}
          </p>
        </div>

        <div className="flex glass p-1.5 rounded-2xl shadow-sm self-start md:self-end">
          <button
            onClick={() => setLang("ar")}
            className={clsx(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
              lang === "ar" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
            )}
          >
            عربي
          </button>
          <button
            onClick={() => setLang("en")}
            className={clsx(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
              lang === "en" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
            )}
          >
            EN
          </button>
        </div>
      </header>

      <div className="grid gap-8 animate-slide-up">
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#369094] text-white flex items-center justify-center text-sm">1</span>
              {t.patientInfo}
            </h2>
            <Button variant="secondary" size="sm" onClick={addPatient} className="flex gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              {t.addPatient}
            </Button>
          </div>

          <div className="grid gap-6">
            {draft.patients.map((p, idx) => (
              <Card key={idx} className="relative group animate-scale-in">
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Pill tone="brand">{lang === "ar" ? `مريض ${idx + 1}` : `Patient ${idx + 1}`}</Pill>
                    {draft.patients.length > 1 && (
                      <Button variant="danger" size="sm" onClick={() => removePatient(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {lang === "ar" ? "إزالة" : "Remove"}
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t.patientName}</Label>
                      <Input
                        value={p.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((d) => {
                            const patients = [...d.patients];
                            patients[idx] = { ...patients[idx], name: v };
                            return { ...d, patients };
                          });
                        }}
                        placeholder={lang === "ar" ? "اكتب اسم المريض" : "Enter patient name"}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t.patientLocation}</Label>
                      <div className="relative">
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm transition-all duration-200 focus:ring-4 focus:ring-[#369094]/10 focus:border-[#369094] focus:bg-white outline-none appearance-none"
                          value={p.location}
                          onChange={(e) => {
                            const v = e.target.value as PatientDraft["location"];
                            setDraft((d) => {
                              const patients = [...d.patients];
                              patients[idx] = { ...patients[idx], location: v };
                              return { ...d, patients };
                            });
                          }}
                        >
                          <option value="">{lang === "ar" ? "اختر المكان" : "Choose location"}</option>
                          <option value="ICU">{lang === "ar" ? "العناية المركزة" : "ICU"}</option>
                          <option value="Medical ward">{lang === "ar" ? "القسم الباطني" : "Medical ward"}</option>
                          <option value="Surgical ward">{lang === "ar" ? "القسم الجراحي" : "Surgical ward"}</option>
                          <option value="OBGYN">{lang === "ar" ? "النسائية والتوليد" : "OBGYN"}</option>
                          <option value="Other">{lang === "ar" ? "أخرى" : "Other"}</option>
                        </select>
                        <div className={clsx("absolute top-1/2 -translate-y-1/2 pointer-events-none text-slate-400", lang === "ar" ? "left-4" : "right-4")}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                      </div>

                      {p.location === "Other" && (
                        <div className="mt-3 animate-fade-in">
                          <Label className="text-[11px] uppercase tracking-wider text-[#2d7479] mb-1">{t.otherSpecify}</Label>
                          <Input
                            value={p.locationOther || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDraft((d) => {
                                const patients = [...d.patients];
                                patients[idx] = { ...patients[idx], locationOther: v };
                                return { ...d, patients };
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t.caseNotes}</Label>
                    <Textarea
                      value={p.notes}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((d) => {
                          const patients = [...d.patients];
                          patients[idx] = { ...patients[idx], notes: v };
                          return { ...d, patients };
                        });
                      }}
                      placeholder={
                        lang === "ar"
                          ? "اشرح الحالة باختصار (الأعراض، العلامات الحيوية، أهم النتائج)"
                          : "Brief summary (symptoms, vitals, key findings)"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-lg bg-[#369094] text-white flex items-center justify-center text-sm">2</span>
            {lang === "ar" ? "تفاصيل الطلب" : "Request Details"}
          </h2>

          <Card>
            <CardContent className="space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Label>{t.urgency}</Label>
                  <div className="grid gap-3">
                    {[
                      { value: "elective", label: t.elective, active: "bg-slate-50 border-slate-200 ring-slate-500/20", dot: "border-slate-500 bg-slate-500", text: "text-slate-900" },
                      { value: "urgent", label: t.urgent, active: "bg-amber-50 border-amber-200 ring-amber-500/20", dot: "border-amber-500 bg-amber-500", text: "text-amber-900" },
                      { value: "very_urgent", label: t.veryUrgent, active: "bg-rose-50 border-rose-200 ring-rose-500/20", dot: "border-rose-500 bg-rose-500", text: "text-rose-900" }
                    ].map((x) => (
                      <label
                        key={x.value}
                        className={clsx(
                          "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all duration-300",
                          draft.urgency === x.value
                            ? `${x.active} ring-2`
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <div className={clsx(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                          draft.urgency === x.value
                            ? x.dot
                            : "border-slate-300 bg-white"
                        )}>
                          {draft.urgency === x.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <input
                          type="radio"
                          className="hidden"
                          name="urgency"
                          checked={draft.urgency === (x.value as Urgency)}
                          onChange={() => setDraft((d) => ({ ...d, urgency: x.value as Urgency }))}
                        />
                        <span className={clsx(
                          "text-sm font-bold",
                          draft.urgency === x.value ? x.text : "text-slate-600"
                        )}>{x.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <Label>{t.doctorPhone}</Label>
                    <Input
                      value={draft.doctorPhone}
                      onChange={(e) => setDraft((d) => ({ ...d, doctorPhone: e.target.value }))}
                      placeholder={lang === "ar" ? "05X XXX XXXX" : "+970…"}
                    />
                    <p className="px-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t.phoneHint}</p>
                  </div>

                  <div className="space-y-3">
                    <Label>{t.attachments}</Label>
                    <div className="relative group">
                      <input
                        id="attachments"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setDraft((d) => ({ ...d, attachments: files }));
                        }}
                      />
                      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 group-hover:bg-[#f0f9f9] group-hover:border-[#83cbcd] transition-all duration-300">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#369094] mb-3 group-hover:scale-110 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{lang === "ar" ? "اضغط لرفع الملفات" : "Click to upload files"}</span>
                        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1">{t.uploadHint}</span>
                      </div>
                    </div>
                    {draft.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {draft.attachments.map((file, i) => (
                          <Pill key={i} tone="brand">{file.name}</Pill>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {msg && (
                <div
                  className={clsx(
                    "rounded-2xl border p-4 text-sm font-bold animate-fade-in flex items-center gap-3",
                    msg.type === "ok"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                      : "border-rose-100 bg-rose-50 text-rose-800"
                  )}
                >
                  <div className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    msg.type === "ok" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    {msg.type === "ok" ?
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> :
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    }
                  </div>
                  {msg.text}
                </div>
              )}

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-t border-slate-100 pt-8">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800 italic">{t.thanks}</div>
                  <div className="text-xs text-slate-400 font-medium">{t.thanksEn}</div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={clearForm} disabled={busy}>
                    {t.clear}
                  </Button>
                  <Button variant="brand" onClick={submit} disabled={busy} className="min-w-[160px]">
                    {busy ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {lang === "ar" ? "جارٍ الإرسال..." : "Submitting..."}
                      </div>
                    ) : t.submit}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <footer className="mt-12 text-center">
        <a
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-[#2d7479] hover:bg-[#f0f9f9] transition-all duration-300"
          href="/admin/login"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          {lang === "ar" ? "لوحة تحكم المشرف" : "Admin Dashboard"}
        </a>
      </footer>
    </main>
  );
}
