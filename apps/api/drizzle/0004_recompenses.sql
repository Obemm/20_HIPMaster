CREATE TABLE "recompenses" (
	"partie_id" uuid PRIMARY KEY NOT NULL,
	"joueur_id" uuid NOT NULL,
	"booster" boolean NOT NULL,
	"accordee_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recompenses" ADD CONSTRAINT "recompenses_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE cascade ON UPDATE no action;