CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'paid', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" integer NOT NULL,
	"size_label" text NOT NULL,
	"quantity" integer NOT NULL,
	"product_slug" text NOT NULL,
	"product_name" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"line_total_cents" integer NOT NULL,
	CONSTRAINT "order_items_order_product_size_unique" UNIQUE("order_id","product_id","size_label"),
	CONSTRAINT "order_items_quantity_check" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_unit_price_cents_check" CHECK ("order_items"."unit_price_cents" >= 0),
	CONSTRAINT "order_items_line_total_check" CHECK ("order_items"."line_total_cents" = "order_items"."unit_price_cents" * "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" serial NOT NULL,
	"user_id" text,
	"email" text,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"amount_total_cents" integer,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"reservation_expires_at" timestamp with time zone NOT NULL,
	"shipping_name" text,
	"shipping_address" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number"),
	CONSTRAINT "orders_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "orders_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "orders_subtotal_cents_check" CHECK ("orders"."subtotal_cents" >= 0),
	CONSTRAINT "orders_amount_total_cents_check" CHECK ("orders"."amount_total_cents" >= 0),
	CONSTRAINT "orders_currency_check" CHECK ("orders"."currency" ~ '^[a-z]{3}$'),
	CONSTRAINT "orders_paid_fields_check" CHECK ("orders"."payment_status" <> 'paid' OR ("orders"."paid_at" IS NOT NULL AND "orders"."stripe_checkout_session_id" IS NOT NULL)),
	CONSTRAINT "orders_processing_session_check" CHECK ("orders"."payment_status" <> 'processing' OR "orders"."stripe_checkout_session_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_reservation_idx" ON "orders" USING btree ("payment_status","reservation_expires_at");