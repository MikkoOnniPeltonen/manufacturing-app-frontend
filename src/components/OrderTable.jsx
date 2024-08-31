


import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

  import { flexRender } from "@tanstack/react-table"


function OrderTable({ table }) {

  return (
    <Table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
        <TableHeader className="bg-blue-50">
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            {header.isPlaceholder ? null : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                    ))}
                </TableRow>
            ))}
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-100">
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
        <TableFooter>
            <TableRow className="bg-blue-50">
                <TableCell colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-700">Total</TableCell>
                <TableCell className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {table.showData.reduce((acc, row) => acc + (row.quantity || 0), 0)}
                </TableCell>
            </TableRow>
        </TableFooter>
    </Table>
  )
}

export default OrderTable
