"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-input h-11 rounded-lg border px-4 text-sm print:hidden"
    >
      Print
    </button>
  );
}
