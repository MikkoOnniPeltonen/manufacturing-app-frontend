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

    const rows = table.getRowModel().rows
    const hasRows = rows.length > 0

  return (
        <div className="overflow-x-auto h-[400px]">
            <Table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
                <TableHeader className="bg-blue-50 sticky top-0">
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
                    {hasRows ? (
                        rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-gray-100">
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={table.getAllColumns().length} className="px-6 py-4 text-center text-sm text-gray-500">
                                No Orders available.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow className="bg-blue-50">
                        <TableCell colSpan={4} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</TableCell>
                        <TableCell className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            {rows.reduce((acc, row) => acc + (row.original.quantity || 0), 0)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    )
}

export default OrderTable
