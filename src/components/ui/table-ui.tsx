import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table';

import { Table } from './table';
import { MouseEvent } from 'react';
import { cn } from '@/lib/utils';

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (
    e: MouseEvent<HTMLTableDataCellElement, globalThis.MouseEvent>,
    row: Row<T>,
  ) => void;
};

export function DataTable<T>({ columns, data, onRowClick }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table.Root>
      <Table.Header>
        {table.getHeaderGroups().map((headerGroup) => (
          <Table.Row key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <Table.Head key={header.id} style={{ width: header.getSize() }}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </Table.Head>
            ))}
          </Table.Row>
        ))}
      </Table.Header>

      <Table.Body>
        {table.getRowModel().rows.map((row) => (
          <Table.Row key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <Table.Cell
                onClick={(e) => onRowClick?.(e, row)}
                key={cell.id}
                style={{ width: cell.column.getSize() }}
                className={cn({
                  'cursor-pointer': onRowClick,
                })}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
