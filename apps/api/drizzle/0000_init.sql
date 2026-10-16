CREATE TYPE "public"."rarete" AS ENUM('commune', 'rare', 'epique', 'legendaire');--> statement-breakpoint
CREATE TABLE "cartes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"rarete" "rarete" NOT NULL,
	"attaque" integer NOT NULL,
	"defense" integer NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
