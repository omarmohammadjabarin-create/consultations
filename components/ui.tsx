import React from "react";
import clsx from "clsx";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "glass rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]",
        props.className
      )}
    />
  );
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "p-6 border-b border-slate-100 bg-white/40",
        props.className
      )}
    />
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={clsx("p-6", props.className)} />;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "brand";
    size?: "sm" | "md" | "lg";
  }
) {
  const { variant = "primary", size = "md", ...rest } = props;

  const base = "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-7 py-3.5 text-base rounded-2xl",
  };

  const variants = {
    primary: "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-slate-900/20",
    secondary: "bg-white text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300",
    brand: "bg-[#369094] text-white shadow-lg shadow-[#369094]/20 hover:bg-[#2d7479] hover:shadow-[#369094]/30",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100/50 hover:text-slate-900",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-100",
  };

  return <button {...rest} className={clsx(base, sizes[size], variants[variant], props.className)} />;
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm transition-all duration-200",
        "placeholder:text-slate-400 outline-none",
        "focus:ring-4 focus:ring-[#369094]/10 focus:border-[#369094] focus:bg-white",
        props.className
      )}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm transition-all duration-200",
        "placeholder:text-slate-400 outline-none resize-none",
        "focus:ring-4 focus:ring-[#369094]/10 focus:border-[#369094] focus:bg-white",
        props.className
      )}
    />
  );
}

export function Label(props: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={clsx(
        "block text-sm font-semibold text-slate-700 mb-1.5 ml-1 mr-1",
        props.className
      )}
    />
  );
}

export function Pill(
  props: React.HTMLAttributes<HTMLSpanElement> & {
    tone?: "neutral" | "warn" | "danger" | "ok" | "brand";
  }
) {
  const { tone = "neutral", ...rest } = props;

  const tones = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
    warn: "bg-amber-50 text-amber-700 border-amber-100/50",
    danger: "bg-rose-50 text-rose-700 border-rose-100/50",
    brand: "bg-[#f0f9f9] text-[#285e63] border-[#d9f0f0]/50",
    neutral: "bg-slate-100 text-slate-600 border-slate-200/50",
  };

  return (
    <span
      {...rest}
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
        tones[tone],
        props.className
      )}
    />
  );
}
