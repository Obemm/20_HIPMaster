CREATE TABLE "collection" (
	"joueur_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"exemplaires" integer NOT NULL,
	"obtenue_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_joueur_id_numero_pk" PRIMARY KEY("joueur_id","numero")
);
--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "boosters" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "recharge_depuis" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE cascade ON UPDATE no action;