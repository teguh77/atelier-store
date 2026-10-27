import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderHistory } from "@/components/account/order-history";
import { listMyOrders } from "@/lib/account-orders";

export const metadata: Metadata = { title: "Orders" };

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  // Reads the session itself and only returns this customer's orders.
  const orders = await listMyOrders();

  return (
    <section className="flex flex-col gap-8 lg:border-t lg:pt-6">
      <h2 className="type-title-xs">Orders</h2>
      <OrderHistory orders={orders} />
    </section>
  );
}
