CREATE INDEX "duels_createur" ON "duels" USING btree ("createur_id","maj_le");--> statement-breakpoint
CREATE INDEX "duels_adversaire" ON "duels" USING btree ("adversaire_id","maj_le");--> statement-breakpoint
CREATE INDEX "duels_attente" ON "duels" USING btree ("cree_le") WHERE "duels"."statut" = 'attente';--> statement-breakpoint
CREATE INDEX "parties_joueur" ON "parties" USING btree ("joueur_id");--> statement-breakpoint
CREATE INDEX "parties_session" ON "parties" USING btree ("session");--> statement-breakpoint
CREATE INDEX "recompenses_joueur" ON "recompenses" USING btree ("joueur_id","accordee_le");--> statement-breakpoint
CREATE INDEX "sessions_joueur" ON "sessions" USING btree ("joueur_id");