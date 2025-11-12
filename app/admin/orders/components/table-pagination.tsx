import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { useEffect, useState, FocusEvent } from "react";
import "./input-nospin.css";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
}: DataTablePaginationProps<TData>) {
  const [updatePage, setUpdatePage] = useState(false);

  const pageInputHandler = (e: FocusEvent<HTMLInputElement>) => {
    var pageNumber: number = Number(e.target.value);
    // if there's no or "0" input, do nothing
    if (pageNumber <= 0) {
      pageNumber = table.getState().pagination.pageIndex + 1;
    }
    // if the input is larger than the page count, choose the last page instead
    else if (pageNumber > table.getPageCount()) {
      pageNumber = table.getPageCount();
    }
    e.target.value = String(pageNumber); // reset value in input box
    table.setPageIndex(pageNumber - 1);
  };

  // Refreshes the page input's value after setUpdatePage(true);
  useEffect(() => {
    const pageInput = document.getElementById("page") as HTMLInputElement;
    pageInput.value = String(table.getState().pagination.pageIndex + 1);
    setUpdatePage(false);
  }, [updatePage]);
  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8">
      {/*Rows per page*/}
      <div className="flex items-center space-x-2">
        <p className="whitespace-nowrap font-medium text-sm">Rows per page</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
            setUpdatePage(true);
          }}
        >
          <SelectTrigger className="h-8 w-18 font-small text-sm">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((pageSize) => (
              <SelectItem
                key={pageSize}
                value={`${pageSize}`}
                className="font-small text-sm"
              >
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Direct Page Select */}
      <div className="flex items-center justify-center font-medium text-sm gap-1">
        Page
        <Input
          defaultValue={1}
          className="remove-arrow h-8 w-15 font-small text-sm text-center"
          id="page"
          name="page"
          type="number"
          min="1"
          max={table.getPageCount()}
          onBlur={pageInputHandler}
        />
        / {table.getPageCount()}
      </div>

      {/* Select by Button */}
      <div className="flex items-center space-x-2">
        <Button
          aria-label="Go to first page"
          variant="outline"
          size="icon"
          onClick={() => {
            table.setPageIndex(0);
            setUpdatePage(true);
          }}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft />
        </Button>
        <Button
          aria-label="Go to previous page"
          variant="outline"
          size="icon"
          onClick={() => {
            table.previousPage();
            setUpdatePage(true);
          }}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <Button
          aria-label="Go to next page"
          variant="outline"
          size="icon"
          onClick={() => {
            table.nextPage();
            setUpdatePage(true);
          }}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
        <Button
          aria-label="Go to last page"
          variant="outline"
          size="icon"
          onClick={() => {
            table.setPageIndex(table.getPageCount() - 1);
            setUpdatePage(true);
          }}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}

