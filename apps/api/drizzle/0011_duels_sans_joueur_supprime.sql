ALTER TABLE "duels" DROP CONSTRAINT "duels_createur_id_joueurs_id_fk";
--> statement-breakpoint
ALTER TABLE "duels" DROP CONSTRAINT "duels_adversaire_id_joueurs_id_fk";
--> statement-breakpoint
ALTER TABLE "duels" ALTER COLUMN "createur_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_createur_id_joueurs_id_fk" FOREIGN KEY ("createur_id") REFERENCES "public"."joueurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_adversaire_id_joueurs_id_fk" FOREIGN KEY ("adversaire_id") REFERENCES "public"."joueurs"("id") ON DELETE set null ON UPDATE no action;