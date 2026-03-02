import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  X,
  Filter,
  RotateCcw,
  Search,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import type { Filters, TripRow } from "../types";
import { format, subDays, subMonths, startOfYear } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface FilterBarProps {
  data: TripRow[];
  filters: Filters;
  filteredCount: number;
  onChange: (filters: Filters) => void;
}

// ── Format status name for display ───────────────────────────────

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}

// ── Dropdown multi-select (improved) ─────────────────────────────

function MultiSelect({
  label,
  icon,
  options,
  selected,
  onChange,
  colorMap,
  searchable = false,
  formatLabel = (s: string) => s,
}: {
  label: string;
  icon?: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  colorMap?: Record<string, string>;
  searchable?: boolean;
  formatLabel?: (s: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  const toggle = (v: string) => {
    onChange(
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v],
    );
  };

  const allSelected = selected.length === options.length;
  const noneSelected = selected.length === 0;
  const isFiltered = !allSelected;

  const filtered =
    searchable && search
      ? options.filter((o) =>
          formatLabel(o).toLowerCase().includes(search.toLowerCase()),
        )
      : options;

  // Summary text for the button
  const summaryText = noneSelected ? `No ${label.toLowerCase()}` : `${label}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm rounded-xl border
          transition-all duration-150 min-w-0
          ${
            open
              ? "border-primary bg-primary-light text-primary shadow-sm shadow-primary/10"
              : isFiltered
                ? "border-primary/30 bg-primary-light/40 text-text hover:border-primary/50"
                : "border-border bg-surface text-text hover:border-primary/40"
          }
        `}
      >
        {icon || <Filter className="w-3.5 h-3.5 shrink-0" />}
        <span className="font-medium truncate max-w-32">{summaryText}</span>
        {!noneSelected && (
          <span className="text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0 bg-text-muted/15 text-text-secondary">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-surface rounded-xl border border-border shadow-xl shadow-black/8 z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search input */}
          {searchable && (
            <div className="px-3 pb-2 pt-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-alt border border-border">
                <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}s…`}
                  className="bg-transparent border-none outline-none text-sm text-text placeholder:text-text-muted w-full"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-text-muted hover:text-text"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Select / Deselect all */}
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
              {filtered.length} option{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => onChange(allSelected ? [] : [...options])}
              className="text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>

          <div className="border-t border-border/60 my-1" />

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-muted text-center">
                No matches
              </p>
            ) : (
              filtered.map((opt) => {
                const isChecked = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggle(opt)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors text-left
                      ${isChecked ? "bg-primary-light/40" : "hover:bg-surface-alt"}
                    `}
                  >
                    <span
                      className={`
                        w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors
                        ${
                          isChecked
                            ? "bg-primary border-primary text-white"
                            : "border-border bg-surface"
                        }
                      `}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5" />}
                    </span>
                    {colorMap?.[opt] && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorMap[opt] }}
                      />
                    )}
                    <span
                      className={`capitalize truncate ${isChecked ? "text-text font-medium" : "text-text-secondary"}`}
                    >
                      {formatLabel(opt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quick date presets ───────────────────────────────────────────

interface DatePreset {
  label: string;
  getRange: (max: Date) => [Date, Date];
}

const DATE_PRESETS: DatePreset[] = [
  { label: "Last 30d", getRange: (max) => [subDays(max, 30), max] },
  { label: "Last 3m", getRange: (max) => [subMonths(max, 3), max] },
  { label: "Last 6m", getRange: (max) => [subMonths(max, 6), max] },
  { label: "This year", getRange: (max) => [startOfYear(max), max] },
];

// ── Main FilterBar ───────────────────────────────────────────────

export default function FilterBar({
  data,
  filters,
  filteredCount,
  onChange,
}: FilterBarProps) {
  // Derive available options from data
  const allStatuses = useMemo(
    () => [...new Set(data.map((d) => d.status))].sort(),
    [data],
  );
  const allProducts = useMemo(
    () => [...new Set(data.map((d) => d.product_type_name))].sort(),
    [data],
  );

  const minDate = useMemo(
    () =>
      data.reduce(
        (min, d) =>
          d.request_timestamp_local < min ? d.request_timestamp_local : min,
        data[0].request_timestamp_local,
      ),
    [data],
  );
  const maxDate = useMemo(
    () =>
      data.reduce(
        (max, d) =>
          d.request_timestamp_local > max ? d.request_timestamp_local : max,
        data[0].request_timestamp_local,
      ),
    [data],
  );

  const setDateStart = (d: Date | null) => {
    if (d) d.setHours(0, 0, 0, 0);
    onChange({ ...filters, dateRange: [d, filters.dateRange[1]] });
  };
  const setDateEnd = (d: Date | null) => {
    if (d) d.setHours(23, 59, 59, 999);
    onChange({ ...filters, dateRange: [filters.dateRange[0], d] });
  };

  const applyPreset = (preset: DatePreset) => {
    const [start, end] = preset.getRange(maxDate);
    start.setHours(0, 0, 0, 0);
    const endCopy = new Date(end);
    endCopy.setHours(23, 59, 59, 999);
    onChange({
      ...filters,
      dateRange: [start < minDate ? minDate : start, endCopy],
    });
  };

  const hasActiveFilters =
    filters.dateRange[0] !== null ||
    filters.dateRange[1] !== null ||
    filters.statuses.length !== allStatuses.length ||
    filters.products.length !== allProducts.length;

  // Build comprehensive pills for all active filters
  const pills: {
    key: string;
    label: string;
    type: "date" | "status" | "product";
    remove: () => void;
  }[] = [];

  if (filters.dateRange[0]) {
    pills.push({
      key: "from",
      label: `Start Date: ${format(filters.dateRange[0], "MMM d, yyyy")}`,
      type: "date",
      remove: () =>
        onChange({ ...filters, dateRange: [null, filters.dateRange[1]] }),
    });
  }
  if (filters.dateRange[1]) {
    pills.push({
      key: "to",
      label: `End Date: ${format(filters.dateRange[1], "MMM d, yyyy")}`,
      type: "date",
      remove: () =>
        onChange({ ...filters, dateRange: [filters.dateRange[0], null] }),
    });
  }

  // Always show pills for selected statuses
  for (const s of filters.statuses) {
    pills.push({
      key: `status-${s}`,
      label: `Status: ${formatStatus(s)}`,
      type: "status",
      remove: () =>
        onChange({
          ...filters,
          statuses: filters.statuses.filter((x) => x !== s),
        }),
    });
  }

  // Always show pills for selected products
  for (const p of filters.products) {
    pills.push({
      key: `product-${p}`,
      label: `Product: ${p}`,
      type: "product",
      remove: () =>
        onChange({
          ...filters,
          products: filters.products.filter((x) => x !== p),
        }),
    });
  }

  const statusColors: Record<string, string> = {
    completed: "#05944F",
    rider_canceled: "#E54B4B",
    unfulfilled: "#FFC043",
  };

  const pillColors = {
    date: "bg-primary-light text-primary",
    status: "bg-danger-light text-danger",
    product: "bg-warning-light text-warning",
  };

  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = pills.length;

  return (
    <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-2.5">
        {/* Mobile compact bar — visible only on small screens */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-text transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-text-muted" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-white leading-none">
                {activeCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-text-muted transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted">
              <span className="font-semibold text-text">
                {filteredCount.toLocaleString()}
              </span>{" "}
              of {data.length.toLocaleString()}
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  onChange({
                    dateRange: [null, null],
                    statuses: [...allStatuses],
                    products: [...allProducts],
                  });
                }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter controls — always visible on sm+, collapsible on mobile */}
        <div className={`${mobileOpen ? "block" : "hidden"} sm:block space-y-2.5`}>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter icon label */}
            <div className="hidden sm:flex items-center gap-1.5 text-text-muted mr-1">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Filters
              </span>
            </div>

          {/* Date: From */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm [&_.react-datepicker-wrapper]:w-auto [&_.react-datepicker-popper]:z-50">
            <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-text-muted text-xs font-medium shrink-0">
              From
            </span>
            <DatePicker
              selected={filters.dateRange[0]}
              onChange={setDateStart}
              selectsStart
              startDate={filters.dateRange[0]}
              endDate={filters.dateRange[1]}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Start date"
              dateFormat="MMM d, yyyy"
              isClearable
              className="bg-transparent border-none outline-none text-sm text-text w-28 placeholder:text-text-muted cursor-pointer"
            />
          </div>

          {/* Date: To */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm [&_.react-datepicker-wrapper]:w-auto [&_.react-datepicker-popper]:z-50">
            <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-text-muted text-xs font-medium shrink-0">
              To
            </span>
            <DatePicker
              selected={filters.dateRange[1]}
              onChange={setDateEnd}
              selectsEnd
              startDate={filters.dateRange[0]}
              endDate={filters.dateRange[1]}
              minDate={filters.dateRange[0] ?? minDate}
              maxDate={maxDate}
              placeholderText="End date"
              dateFormat="MMM d, yyyy"
              isClearable
              className="bg-transparent border-none outline-none text-sm text-text w-28 placeholder:text-text-muted cursor-pointer"
            />
          </div>

          {/* Quick date presets */}
          <div className="flex items-center gap-1">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className="px-2 py-1.5 text-[11px] font-semibold text-text-muted hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => onChange({ ...filters, dateRange: [null, null] })}
              className="px-2 py-1.5 text-[11px] font-semibold text-text-muted hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
            >
              All time
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Status multi-select */}
          <MultiSelect
            label="Status"
            options={allStatuses}
            selected={filters.statuses}
            onChange={(statuses) => onChange({ ...filters, statuses })}
            colorMap={statusColors}
            formatLabel={formatStatus}
          />

          {/* Product multi-select */}
          <MultiSelect
            label="Product"
            options={allProducts}
            selected={filters.products}
            onChange={(products) => onChange({ ...filters, products })}
            searchable
          />

          {/* Reset + count — desktop only (mobile has its own in compact bar) */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted">
              <span className="font-semibold text-text">
                {filteredCount.toLocaleString()}
              </span>{" "}
              of {data.length.toLocaleString()} trips
            </span>
            <button
              onClick={() => {
                onChange({
                  dateRange: [null, null],
                  statuses: [...allStatuses],
                  products: [...allProducts],
                });
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                hasActiveFilters
                  ? "text-text-muted hover:text-danger hover:bg-danger-light cursor-pointer"
                  : "text-text-muted/30 cursor-default"
              }`}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Active filter pills */}
        <div className="flex items-center gap-1.5 min-h-6 overflow-x-auto sm:flex-wrap scrollbar-none">
          {pills.length > 0 && (
            <>
              <span className="text-[11px] text-text-muted font-medium mr-1 shrink-0">
                Active:
              </span>
              {pills.map((pill) => (
                <span
                  key={pill.key}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 ${pillColors[pill.type]}`}
                >
                  {pill.label}
                  <button
                    onClick={pill.remove}
                    className="hover:opacity-60 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  onChange({
                    dateRange: [null, null],
                    statuses: [],
                    products: [],
                  });
                }}
                className="text-[11px] text-text-muted hover:text-danger font-medium ml-1 transition-colors shrink-0"
              >
                Clear all
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
