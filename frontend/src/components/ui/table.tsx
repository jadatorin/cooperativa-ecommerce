"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, ...props }, ref) => (
    <table ref={ref} className={className} {...props}>
      {children}
    </table>
  )
);
Table.displayName = "Table";

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <thead ref={ref} className={className}>{children}</thead>
  )
);
TableHeader.displayName = "TableHeader";

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className, ...props }, ref) => (
    <tr ref={ref} className={className} {...props}>
      {children}
    </tr>
  )
);
TableRow.displayName = "TableRow";

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className, ...props }, ref) => (
    <td ref={ref} className={className} {...props}>
      {children}
    </td>
  )
);
TableCell.displayName = "TableCell";

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ children, className, ...props }, ref) => (
    <th ref={ref} className={cn("px-4 py-2 text-left font-medium text-muted-foreground", className)} {...props}>
      {children}
    </th>
  )
);
TableHead.displayName = "TableHead";

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className, ...props }, ref) => (
    <tbody ref={ref} className={className}>{children}</tbody>
  )
);
TableBody.displayName = "TableBody";

export { Table, TableHeader, TableRow, TableCell, TableHead, TableBody };