ALTER TABLE "sessions" ADD COLUMN "utilisee_le" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "sessions_utilisee_le" ON "sessions" USING btree ("utilisee_le");