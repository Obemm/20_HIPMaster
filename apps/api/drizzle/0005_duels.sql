CREATE TABLE "duels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statut" text DEFAULT 'attente' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"createur_id" uuid NOT NULL,
	"deck_createur" text NOT NULL,
	"adversaire_id" uuid,
	"deck_adversaire" text,
	"etat" jsonb,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_createur_id_joueurs_id_fk" FOREIGN KEY ("createur_id") REFERENCES "public"."joueurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_adversaire_id_joueurs_id_fk" FOREIGN KEY ("adversaire_id") REFERENCES "public"."joueurs"("id") ON DELETE cascade ON UPDATE no action;