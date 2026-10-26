CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sort_order" integer NOT NULL,
	"src" text NOT NULL,
	"alt" text NOT NULL,
	"position" text,
	CONSTRAINT "product_images_product_sort_unique" UNIQUE("product_id","sort_order")
);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;