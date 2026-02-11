import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoadingSkeleton({
  isAdmin,
}: {
  isAdmin?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        {isAdmin && <Skeleton className="h-10 w-full sm:w-40" />}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-10 w-full sm:w-[260px]" />
        <Skeleton className="h-10 w-full sm:w-[160px]" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
        <Skeleton className="h-10 w-full sm:w-[90px]" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-40" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-12" />
              </TableHead>

              {isAdmin && (
                <TableHead className="text-right">
                  <Skeleton className="h-5 w-24 ml-auto" />
                </TableHead>
              )}

              <TableHead className="text-right">
                <Skeleton className="h-5 w-24 ml-auto" />
              </TableHead>

              <TableHead className="text-right">
                <Skeleton className="h-5 w-20 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>

                {isAdmin && (
                  <TableCell>
                    <Skeleton className="h-5 w-24 ml-auto" />
                  </TableCell>
                )}

                <TableCell>
                  <Skeleton className="h-5 w-24 ml-auto" />
                </TableCell>

                <TableCell>
                  <Skeleton className="h-5 w-20 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
