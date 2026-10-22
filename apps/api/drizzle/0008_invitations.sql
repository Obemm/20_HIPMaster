CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empreinte_code" text NOT NULL,
	"libelle" text NOT NULL,
	"utilisations_max" integer NOT NULL,
	"utilisations" integer DEFAULT 0 NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_empreinteCode_unique" UNIQUE("empreinte_code"),
	CONSTRAINT "invitations_utilisations" CHECK ("invitations"."utilisations_max" >= 1 and "invitations"."utilisations" between 0 and "invitations"."utilisations_max")
);
--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "invitation_id" uuid;--> statement-breakpoint
ALTER TABLE "joueurs" ADD CONSTRAINT "joueurs_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;