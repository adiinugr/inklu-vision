"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Pencil, Info } from "lucide-react";
import MarkdownLatex from "@/components/MarkdownLatex";

interface LatexEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  required?: boolean;
  id?: string;
}

export default function LatexEditor({
  label,
  value,
  onChange,
  placeholder = "Ketik di sini... Gunakan $x^2$ untuk math inline, $$E=mc^2$$ untuk math blok",
  minHeight = "180px",
  required,
  id,
}: LatexEditorProps) {
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [previewHeight, setPreviewHeight] = useState<string>(minHeight);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep preview height in sync with the (resizable) textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const observer = new ResizeObserver(() => {
      setPreviewHeight(`${textarea.offsetHeight}px`);
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  const textareaClass =
    "w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-shadow";

  const previewPanel = (
    <div
      className="overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
      style={{ height: previewHeight, minHeight }}
    >
      {value.trim() ? (
        <MarkdownLatex content={value} />
      ) : (
        <p className="italic text-zinc-400">Pratinjau akan muncul di sini...</p>
      )}
    </div>
  );

  return (
    <div>
      {/* Label row */}
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-zinc-700"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>

        {/* Mobile tab toggle — hidden on lg */}
        <div className="flex overflow-hidden rounded-xl border border-zinc-200 text-xs lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`flex items-center gap-1 px-3 py-1.5 font-medium transition-colors ${
              mobileTab === "edit"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
            aria-pressed={mobileTab === "edit"}>
            <Pencil className="h-3 w-3" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex items-center gap-1 px-3 py-1.5 font-medium transition-colors ${
              mobileTab === "preview"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
            aria-pressed={mobileTab === "preview"}>
            <Eye className="h-3 w-3" aria-hidden="true" />
            Pratinjau
          </button>
        </div>
      </div>

      {/* Desktop: split view */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-xs font-medium text-zinc-400">
            <Pencil className="h-3 w-3" aria-hidden="true" />
            Editor
          </p>
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            style={{ minHeight }}
            className={textareaClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-xs font-medium text-zinc-400">
            <Eye className="h-3 w-3" aria-hidden="true" />
            Pratinjau langsung
          </p>
          {previewPanel}
        </div>
      </div>

      {/* Mobile: single panel based on active tab */}
      <div className="lg:hidden">
        {mobileTab === "edit" ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            style={{ minHeight }}
            className={textareaClass}
          />
        ) : (
          previewPanel
        )}
      </div>

      {/* Hint */}
      <p className="mt-1.5 flex items-center gap-1 text-xs text-zinc-400">
        <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>
          Math inline: <code className="rounded bg-zinc-100 px-1">$x^2$</code>{" "}
          · Math blok:{" "}
          <code className="rounded bg-zinc-100 px-1">$$E=mc^2$$</code> ·
          Mendukung Markdown
        </span>
      </p>
    </div>
  );
}
