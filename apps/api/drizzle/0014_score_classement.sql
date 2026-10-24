CREATE TABLE "points" (
	"partie_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"victoire" boolean NOT NULL,
	"gagne_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "points_partie_id_joueur_id_pk" PRIMARY KEY("partie_id","joueur_id")
);
--> statement-breakpoint
ALTER TABLE "duels" ADD COLUMN "score_compte" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "cote" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "duels_cotes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "classe" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "points" ADD CONSTRAINT "points_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "points_joueur" ON "points" USING btree ("joueur_id","gagne_le");--> statement-breakpoint
CREATE INDEX "duels_a_compter" ON "duels" USING btree ("maj_le") WHERE "duels"."statut" = 'termine' and not "duels"."score_compte";--> statement-breakpoint
CREATE INDEX "joueurs_classement" ON "joueurs" USING btree ("points" DESC NULLS LAST) WHERE "joueurs"."classe";