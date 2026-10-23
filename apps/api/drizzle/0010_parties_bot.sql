CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"joueur_id" uuid,
	"session" text,
	"deck" text NOT NULL,
	"deck_bot" text NOT NULL,
	"niveau" text NOT NULL,
	"etat" jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parties_proprietaire" CHECK (("parties"."joueur_id" is null) = ("parties"."session" is null))
);
--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_session_sessions_empreinte_jeton_fk" FOREIGN KEY ("session") REFERENCES "public"."sessions"("empreinte_jeton") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parties_maj_le" ON "parties" USING btree ("maj_le");