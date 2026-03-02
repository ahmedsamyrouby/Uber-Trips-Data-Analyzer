import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import type { TripRow } from "../types";

interface TripTableProps {
  data: TripRow[];
  selectedTripIndex: number | null;
  onSelectTrip: (index: number) => void;
  currency: string;
}

const columnHelper = createColumnHelper<TripRow & { _index: number }>();

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-accent-light text-accent",
  rider_canceled: "bg-danger-light text-danger",
  unfulfilled: "bg-warning-light text-warning",
};

export default function TripTable({
  data,
  selectedTripIndex,
  onSelectTrip,
  currency,
}: TripTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);

  const tableData = useMemo(
    () => data.map((d, i) => ({ ...d, _index: i })),
    [data],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("request_timestamp_local", {
        id: "date",
        header: "Date",
        cell: (info) => format(info.getValue(), "MMM d, yyyy  HH:mm"),
        sortingFn: "datetime",
      }),
      columnHelper.accessor("product_type_name", {
        header: "Product",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const v = info.getValue();
          const badge = STATUS_BADGE[v] ?? "bg-surface-alt text-text-secondary";
          return (
            <span
              className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium capitalize ${badge}`}
            >
              {v.replace("_", " ")}
            </span>
          );
        },
      }),
      columnHelper.accessor("fare_amount", {
        header: "Fare",
        cell: (info) =>
          `${info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`,
      }),
      columnHelper.accessor("begintrip_address", {
        header: "Pickup",
        cell: (info) => (
          <span
            className="truncate max-w-45 block"
            title={info.getValue()}
          >
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("dropoff_address", {
        header: "Dropoff",
        cell: (info) => (
          <span
            className="truncate max-w-45 block"
            title={info.getValue()}
          >
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "map",
        header: "",
        cell: (info) => {
          const row = info.row.original;
          const hasCoords =
            row.begintrip_lat != null && row.begintrip_lng != null;
          return hasCoords ? (
            <MapPin className="w-4 h-4 text-text-muted" />
          ) : null;
        },
      }),
    ],
    [currency],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-surface-alt">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        ))}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isSelected = row.original._index === selectedTripIndex;
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectTrip(row.original._index)}
                  className={`
                    cursor-pointer border-b border-border/50 transition-colors
                    ${
                      isSelected
                        ? "bg-primary-light ring-1 ring-inset ring-primary/20"
                        : "hover:bg-surface-alt/60"
                    }
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-text whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-alt/50">
        <p className="text-xs text-text-muted">
          {data.length} trips · Page {table.getState().pagination.pageIndex + 1}{" "}
          of {table.getPageCount()}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
