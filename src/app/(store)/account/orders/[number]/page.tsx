import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OrderDetail } from "@/components/account/order-detail";
import { getMyOrder, parseOrderNumber } from "@/lib/account-orders";

export const metadata: Metadata = { title: "Order details" };

/*
 * The proxy already sent a 404 for numbers that aren't this customer's; the
 * check here repeats it on the server (getMyOrder reads the session itself).
 */
export default function AccountOrderPage({ params }: PageProps<"/account/orders/[number]">) {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/account/orders/[number]">, "params">) {
  const orderNumber = parseOrderNumber((await params).number);
  const order = orderNumber ? await getMyOrder(orderNumber) : undefined;
  if (!order) notFound();

  return <OrderDetail order={order} />;
}
