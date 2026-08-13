"use client";

import { Table } from "@tanstack/react-table";
import { X, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  sortColumn?: string;
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Cari...",
  sortColumn,
  children,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-9 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3 text-rose-500"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {sortColumn && table.getColumn(sortColumn) && (
          <Button
            variant="outline"
            onClick={() => {
              const isDesc = table.getColumn(sortColumn)?.getIsSorted() === "desc";
              table.getColumn(sortColumn)?.toggleSorting(!isDesc);
            }}
            className="h-8 px-2 lg:px-3 text-slate-700 font-medium"
          >
            {table.getColumn(sortColumn)?.getIsSorted() === "desc" ? (
              <ArrowDownWideNarrow className="mr-2 h-4 w-4" />
            ) : table.getColumn(sortColumn)?.getIsSorted() === "asc" ? (
              <ArrowUpNarrowWide className="mr-2 h-4 w-4" />
            ) : (
              <ArrowDownWideNarrow className="mr-2 h-4 w-4" />
            )}
            Urutkan
          </Button>
        )}
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
