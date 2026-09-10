"use client";

import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  daysInMonth,
  firstWeekdayOfMonth,
  monthNameId,
  toDateString,
  todayWitaDateString,
} from "@/lib/time";

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export type DateStatus = "filled" | "empty";

interface MonthCalendarProps {
  year: number;
  month: number; // 1-12
  statusByDate: Record<string, DateStatus>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
}

export function MonthCalendar({
  year,
  month,
  statusByDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  canGoNext,
}: MonthCalendarProps) {
  const total = daysInMonth(year, month);
  const leadingBlank = (firstWeekdayOfMonth(year, month) + 6) % 7; // Monday-first
  const today = todayWitaDateString();
  const cells: (number | null)[] = [
    ...Array(leadingBlank).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-100/80 p-1.5">
        <button
          onClick={onPrevMonth}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-brand-blue"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-heading text-sm font-bold text-slate-900">
          {monthNameId(month)} <span className="text-brand-blue">{year}</span>
        </p>
        <button
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold text-slate-500">
          {WEEKDAY_LABELS.map((d, i) => (
            <div
              key={d}
              className={cn("py-2", (i === 5 || i === 6) && "bg-slate-100/70")}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {cells.map((day, idx) => {
            const isWeekendCol = idx % 7 === 5 || idx % 7 === 6;

            if (day === null) {
              return (
                <div
                  key={`blank-${idx}`}
                  className={cn("bg-slate-50/60", isWeekendCol && "bg-slate-100/40")}
                />
              );
            }

            const dateStr = toDateString(year, month, day);
            const isFuture = dateStr > today;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const status = statusByDate[dateStr];

            return (
              <button
                key={dateStr}
                disabled={isFuture}
                onClick={() => onSelectDate(dateStr)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2.5 text-sm font-medium transition-colors",
                  isWeekendCol && !isSelected && "bg-slate-50/70",
                  isFuture && "cursor-not-allowed text-slate-300",
                  !isFuture && !isSelected && "text-slate-700 hover:bg-brand-blue/5",
                  isSelected && "z-10 bg-brand-blue text-white shadow-sm shadow-brand-blue/25",
                  isToday && !isSelected && "z-10 ring-2 ring-inset ring-brand-blue/50"
                )}
              >
                <span>{day}</span>
                {!isFuture &&
                  (status === "filled" ? (
                    <Check
                      className={cn(
                        "size-3.5",
                        isSelected ? "text-white" : "text-brand-green"
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "size-2 rounded-[3px] border",
                        isSelected ? "border-white/70" : "border-slate-300"
                      )}
                    />
                  ))}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Check className="size-3.5 text-brand-green" /> Sudah diisi
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-[3px] border border-slate-300" /> Belum diisi
        </span>
      </div>
    </div>
  );
}
