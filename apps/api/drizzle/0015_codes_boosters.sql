CREATE TABLE "boosters_offerts" (
	"code_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	"boosters" integer NOT NULL,
	"recu_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boosters_offerts_code_id_joueur_id_pk" PRIMARY KEY("code_id","joueur_id")
);
--> statement-breakpoint
CREATE TABLE "codes_boosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empreinte_code" text NOT NULL,
	"libelle" text NOT NULL,
	"boosters" integer NOT NULL,
	"utilisations_max" integer NOT NULL,
	"utilisations" integer DEFAULT 0 NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"revoque_le" timestamp with time zone,
	CONSTRAINT "codes_boosters_empreinteCode_unique" UNIQUE("empreinte_code"),
	CONSTRAINT "codes_boosters_boosters" CHECK ("codes_boosters"."boosters" between 1 and 20),
	CONSTRAINT "codes_boosters_utilisations" CHECK ("codes_boosters"."utilisations_max" >= 1 and "codes_boosters"."utilisations" between 0 and "codes_boosters"."utilisations_max")
);
--> statement-breakpoint
ALTER TABLE "boosters_offerts" ADD CONSTRAINT "boosters_offerts_code_id_codes_boosters_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."codes_boosters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosters_offerts" ADD CONSTRAINT "boosters_offerts_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boosters_offerts_joueur" ON "boosters_offerts" USING btree ("joueur_id");