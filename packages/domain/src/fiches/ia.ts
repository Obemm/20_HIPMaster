import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille IA agentique, par numéro de carte (ADR 0034). */
export const FICHES_IA: Readonly<Record<number, Fiche>> = {
  44: {
    definition:
      'Model Context Protocol : un protocole ouvert, publié par Anthropic fin 2024, qui normalise la façon dont une IA accède à des outils et à des données. Un serveur MCP expose ces outils.',
    usage:
      'Brancher un assistant ou un agent sur un système (base, API, fichiers, outil de tickets) une seule fois, pour tout client compatible MCP, au lieu d’écrire une intégration par modèle.',
    exemple:
      'Un serveur MCP « catalogue d’API » expose l’outil chercher_api ; l’agent l’appelle pour trouver la bonne API avant de répondre au développeur.',
    aRetenir:
      'Un serveur MCP donne des mains à l’IA : n’exposer que les outils utiles, avec les droits de l’utilisateur, et se méfier des données qu’il renvoie (prompt injection).',
    liens: [
      {
        titre: 'Model Context Protocol',
        url: 'https://fr.wikipedia.org/wiki/Model_Context_Protocol',
        langue: 'fr',
      },
      {
        titre: 'Documentation officielle de MCP',
        url: 'https://modelcontextprotocol.io/',
        langue: 'en',
      },
    ],
  },
};
