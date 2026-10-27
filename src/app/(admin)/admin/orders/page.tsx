import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OrderStatus } from "@/components/account/order-status";
import { AdminPageHeader, AdminTable, FilterLinks, LOADING } from "@/components/admin/admin-ui";
import { listOrders, parseOrderFilter, type OrderFilter } from "@/lib/admin/queries";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "placed", label: "Placed (paid + processing)" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Awaiting payment" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <AdminPageHeader title="Orders" />
      <Suspense fallback={LOADING}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const filter = parseOrderFilter((await searchParams).status);
  const orders = await listOrders(filter);

  return (
    <div className="flex flex-col gap-6">
      <FilterLinks
        label="Filter by status"
        items={FILTERS.map((f) => ({
          href: f.value === "placed" ? "/admin/orders" : `/admin/orders?status=${f.value}`,
          label: f.label,
          current: f.value === filter,
        }))}
      />
      {orders.length === 0 ? (
        <p className="type-body border-t pt-6 text-muted">No orders here.</p>
      ) : (
        <>
          <AdminTable label="Orders" minWidth="min-w-[40rem]">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date</th>
                <th scope="col">Customer</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.number}>
                  <td>
                    <Link href={`/admin/orders/${o.number}`} className="type-small-medium link-reveal">
                      {formatOrderNumber(o.number)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-muted">{formatDate(o.createdAt)}</td>
                  <td className="max-w-64 truncate">
                    {o.email ?? o.accountEmail ?? <span className="text-muted">No email yet</span>}
                  </td>
                  <td>
                    <OrderStatus status={o.paymentStatus} />
                  </td>
                  <td className="text-right tabular-nums">{formatPrice(o.totalCents ?? o.subtotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          {orders.length === 200 && <p className="type-small text-muted">Showing the 200 most recent.</p>}
        </>
      )}
    </div>
  );
}
