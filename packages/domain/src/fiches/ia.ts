import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille IA agentique, par numéro de carte (ADR 0034). */
export const FICHES_IA: Readonly<Record<number, Fiche>> = {
  39: {
    definition:
      'Un cadre de Solace pour construire des agents d’IA qui coopèrent à travers l’event mesh : ils se découvrent, se délèguent des tâches et partagent des données par événements.',
    usage:
      'Brancher des agents sur les données et les événements de l’entreprise, répartir le travail entre agents spécialisés, et garder des échanges asynchrones, découplés et observables.',
    exemple:
      'Un agent chef reçoit « explique ce retard de livraison » ; il délègue à un agent qui lit les commandes et à un autre qui interroge le transporteur, puis assemble la réponse.',
    aRetenir:
      'Des agents qui se parlent restent des logiciels : tracer chaque échange, limiter les droits de chaque agent, et garder un humain pour les décisions sensibles.',
    liens: [
      {
        titre: 'Solace Agent Mesh',
        url: 'https://solace.com/products/agent-mesh/',
        langue: 'en',
      },
      {
        titre: 'Code source sur GitHub',
        url: 'https://github.com/SolaceProducts/solace-agent-mesh',
        langue: 'en',
      },
    ],
  },
  40: {
    definition:
      'Apigee utilisé comme passerelle devant les modèles d’IA : les appels aux LLM passent par elle, comme des appels d’API, pour être sécurisés, limités et mesurés.',
    usage:
      'Quotas de tokens par application, cache sémantique (une question proche réutilise une réponse), filtres de sécurité sur les prompts, routage vers le modèle adapté et suivi des coûts.',
    exemple:
      'L’assistant interne appelle l’IA par la passerelle : elle vérifie son jeton, coupe au-delà de son quota quotidien de tokens, sert une réponse en cache si la question a déjà été posée, sinon route vers le modèle.',
    aRetenir:
      'Centraliser l’accès aux modèles évite les clés dispersées dans le code et les factures surprises : un seul point pour contrôler, mesurer et changer de modèle.',
    chezElis: 'La future passerelle IA d’Elis, évolution de sa passerelle API.',
    liens: [
      {
        titre: 'Solutions d’IA Apigee (Google Cloud)',
        url: 'https://cloud.google.com/solutions/apigee-ai?hl=fr',
        langue: 'fr',
      },
    ],
  },
  41: {
    definition:
      'Large Language Model : un réseau de neurones entraîné sur d’immenses volumes de textes à prédire la suite d’un texte, token après token, et qui sait ainsi rédiger, résumer, traduire ou coder.',
    usage:
      'Comprendre et produire du langage : assistants, résumés de documents, extraction d’informations, classement de demandes, génération de code ou de mappings.',
    exemple:
      'On donne au modèle un courriel de réclamation ; il en extrait le numéro de commande, le motif et le ton, dans le JSON attendu par l’outil de tickets.',
    aRetenir:
      'Un LLM produit du plausible, pas du vérifié : contrôler ses sorties (format, faits), ne pas lui confier de données sensibles sans cadre, et mesurer sa qualité sur de vrais exemples.',
    liens: [
      {
        titre: 'Grand modèle de langage',
        url: 'https://fr.wikipedia.org/wiki/Grand_mod%C3%A8le_de_langage',
        langue: 'fr',
      },
    ],
  },
  42: {
    definition:
      'Un programme où un LLM décide lui-même des étapes et des outils (recherche, API, code) pour atteindre un objectif, en boucle, jusqu’à juger la tâche terminée.',
    usage:
      'Confier des tâches en plusieurs étapes dont on ne connaît pas le chemin à l’avance : diagnostiquer un incident, préparer une analyse, traiter une demande de bout en bout.',
    exemple:
      '« Pourquoi la commande 1234 n’est pas partie ? » L’agent consulte les journaux, trouve le message en erreur dans la Dead Letter Queue, puis propose de le rejouer.',
    aRetenir:
      'Commencer simple : un enchaînement fixe suffit souvent. Un agent a besoin d’outils bien décrits, de garde-fous, d’un nombre maximal d’étapes et d’une trace de ce qu’il a fait.',
    liens: [
      {
        titre: 'Building effective agents (Anthropic)',
        url: 'https://www.anthropic.com/research/building-effective-agents',
        langue: 'en',
      },
      {
        titre: 'Agent intelligent',
        url: 'https://fr.wikipedia.org/wiki/Agent_intelligent',
        langue: 'fr',
      },
    ],
  },
  43: {
    definition:
      'Un agent chef d’orchestre qui découpe une tâche, la répartit entre des agents spécialisés, souvent en parallèle, puis rassemble et vérifie leurs résultats.',
    usage:
      'Traiter des tâches larges ou parallélisables (recherches, analyse de nombreux documents) en donnant à chaque agent un rôle, des outils et un contexte réduits.',
    exemple:
      'Pour auditer 40 flux, l’orchestrateur confie cinq flux à chacun de ses huit sous-agents, puis fusionne leurs rapports en une synthèse.',
    aRetenir:
      'Plus d’agents, c’est plus de tokens et plus de coordination : des consignes précises pour chaque sous-agent, un nombre d’agents limité, et une vérification du résultat final.',
    liens: [
      {
        titre: 'How we built our multi-agent research system (Anthropic)',
        url: 'https://www.anthropic.com/research/multi-agent-research-system',
        langue: 'en',
      },
      {
        titre: 'Système multi-agents',
        url: 'https://fr.wikipedia.org/wiki/Syst%C3%A8me_multi-agents',
        langue: 'fr',
      },
    ],
  },
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
  45: {
    definition:
      'Dans A2A (Agent2Agent), protocole ouvert lancé par Google en 2025, le document JSON par lequel un agent se présente : nom, compétences, adresse et façon de s’authentifier.',
    usage:
      'Permettre à un agent d’en découvrir un autre et de lui confier une tâche, même s’ils viennent d’éditeurs différents. La carte est souvent publiée à l’adresse /.well-known/agent-card.json.',
    exemple:
      'L’agent « suivi des livraisons » publie sa carte avec la compétence « localiser un colis » ; l’agent du service client la lit, puis lui envoie la tâche.',
    aRetenir:
      'Une carte dit ce qu’un agent prétend savoir faire, pas ce qu’il fait : vérifier son identité, authentifier les appels et ne lui donner que les droits nécessaires.',
    liens: [
      { titre: 'A2A Protocol', url: 'https://a2a-protocol.org/latest/', langue: 'en' },
      {
        titre: 'La spécification A2A',
        url: 'https://a2a-protocol.org/latest/specification/',
        langue: 'en',
      },
    ],
  },
  46: {
    definition:
      'Retrieval-Augmented Generation : avant de répondre, on cherche les passages utiles dans une base de documents et on les donne au modèle, qui s’appuie dessus.',
    usage:
      'Faire répondre un LLM sur des connaissances qu’il n’a pas apprises (documentation interne, procédures, contrats), à jour, en citant ses sources.',
    exemple:
      '« Comment relancer un flux SAP en erreur ? » Le système retrouve les trois paragraphes de la procédure qui en parlent ; le modèle répond en les citant.',
    aRetenir:
      'La réponse ne vaut que ce que vaut la recherche : découper les documents avec soin, respecter les droits d’accès, et vérifier que le modèle cite vraiment ses sources.',
    liens: [
      {
        titre: 'Génération à enrichissement contextuel',
        url: 'https://fr.wikipedia.org/wiki/G%C3%A9n%C3%A9ration_augment%C3%A9e_de_r%C3%A9cup%C3%A9ration',
        langue: 'fr',
      },
      {
        titre: 'L’article fondateur (2020)',
        url: 'https://arxiv.org/abs/2005.11401',
        langue: 'en',
      },
    ],
  },
  47: {
    definition:
      'Une technique de prompt qui fait détailler au modèle son raisonnement étape par étape avant sa réponse, ce qui améliore les résultats sur les problèmes à plusieurs étapes.',
    usage:
      'Calculs, logique, diagnostic, planification : en écrivant ses étapes intermédiaires, le modèle se trompe moins. Les modèles récents le font souvent d’eux-mêmes (mode « réflexion »).',
    exemple:
      'Plutôt que « quel flux est en cause ? », on demande : « liste les symptômes, compare-les à chaque flux, puis conclus ». Le modèle écarte alors les fausses pistes une à une.',
    aRetenir:
      'Un raisonnement affiché n’est pas une preuve : il peut sembler juste et mener à une conclusion fausse. Vérifier la réponse, pas seulement l’explication.',
    liens: [
      {
        titre: 'Chain-of-Thought Prompting (2022)',
        url: 'https://arxiv.org/abs/2201.11903',
        langue: 'en',
      },
      {
        titre: 'Prompt engineering',
        url: 'https://en.wikipedia.org/wiki/Prompt_engineering',
        langue: 'en',
      },
    ],
  },
  48: {
    definition:
      'Un humain dans la boucle d’un système automatisé ou d’une IA : il valide, corrige ou refuse avant qu’une action importante soit exécutée.',
    usage:
      'Garder la maîtrise des actions sensibles ou irréversibles d’un agent (paiement, suppression, envoi à un client), et améliorer le système grâce aux corrections humaines.',
    exemple:
      'L’agent prépare le rejeu de 200 messages en erreur ; il affiche un résumé et attend qu’un opérateur clique sur « Valider » avant de lancer quoi que ce soit.',
    aRetenir:
      'Une validation ne vaut que si l’humain comprend ce qu’il valide : présenter clairement l’action et ses effets, et ne pas noyer l’opérateur sous les demandes.',
    liens: [
      {
        titre: 'Human-in-the-loop',
        url: 'https://en.wikipedia.org/wiki/Human-in-the-loop',
        langue: 'en',
      },
    ],
  },
  49: {
    definition:
      'Une base de données qui range des textes (ou des images) sous forme de vecteurs de nombres, les embeddings, et retrouve ceux dont le sens est le plus proche d’une question.',
    usage:
      'La brique de recherche des systèmes RAG : retrouver les bons passages même quand ils n’emploient pas les mêmes mots que la question.',
    exemple:
      '« Mon colis n’est jamais arrivé » retrouve la procédure « livraison non reçue », sans un seul mot en commun.',
    aRetenir:
      'Proche par le sens ne veut pas dire pertinent : combiner avec une recherche par mots-clés et des filtres (date, droits d’accès), et soigner le découpage des documents.',
    liens: [
      {
        titre: 'Base de données vectorielle',
        url: 'https://fr.wikipedia.org/wiki/Base_de_donn%C3%A9es_vectorielle',
        langue: 'fr',
      },
      {
        titre: 'Plongement de mots (word embedding)',
        url: 'https://fr.wikipedia.org/wiki/Plongement_lexical',
        langue: 'fr',
      },
    ],
  },
  50: {
    definition:
      'La quantité maximale de texte, comptée en tokens, qu’un modèle peut prendre en compte d’un coup : consignes, conversation, documents fournis et réponse compris.',
    usage:
      'Elle borne ce qu’on peut confier au modèle à la fois (un long document, l’historique d’une conversation, les résultats d’outils d’un agent) : de quelques milliers à plus d’un million de tokens selon les modèles.',
    exemple:
      'Un agent qui lit des journaux de 50 000 lignes remplit sa fenêtre en quelques appels : il faut filtrer, résumer ou découper plutôt que tout lui donner.',
    aRetenir:
      'Plus grand n’est pas toujours mieux : un contexte plein coûte cher, ralentit et disperse l’attention du modèle. Lui donner l’essentiel, au bon moment.',
    liens: [
      {
        titre: 'Context windows (documentation Claude)',
        url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows',
        langue: 'en',
      },
    ],
  },
  51: {
    definition:
      'Les consignes données au modèle avant la conversation (son rôle, son ton, ses règles, ce qu’il doit faire ou refuser), qui valent pour tous les échanges qui suivent.',
    usage:
      'Cadrer durablement un assistant ou un agent : son métier, son public, le format attendu, les outils permis et les limites à ne pas franchir.',
    exemple:
      '« Tu es l’assistant de l’équipe d’intégration. Réponds en français, cite la procédure utilisée, et ne propose jamais de modifier la production sans validation. »',
    aRetenir:
      'Un prompt système n’est pas un coffre-fort : il peut fuiter ou être contourné (prompt injection). N’y mettre aucun secret, et appliquer les vraies règles de sécurité hors du modèle.',
    liens: [
      {
        titre: 'Prompting best practices (documentation Claude)',
        url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices',
        langue: 'en',
      },
      {
        titre: 'Prompt engineering',
        url: 'https://en.wikipedia.org/wiki/Prompt_engineering',
        langue: 'en',
      },
    ],
  },
  52: {
    definition:
      'Donner au modèle quelques exemples (une entrée, la sortie attendue) dans le prompt pour qu’il comprenne la tâche et imite le format, sans le réentraîner.',
    usage:
      'Fixer un format de sortie, un ton ou une règle difficile à expliquer : deux ou trois exemples bien choisis valent souvent un long paragraphe de consignes.',
    exemple:
      'Pour classer des tickets, on montre trois tickets déjà classés (« connexion SFTP refusée » → réseau, « champ vide » → mapping…), puis le nouveau ticket.',
    aRetenir:
      'Le modèle imite tout, défauts compris : des exemples variés, justes et représentatifs, sinon il recopie leurs tournures ou leurs biais.',
    liens: [
      {
        titre: 'Language Models are Few-Shot Learners (2020)',
        url: 'https://arxiv.org/abs/2005.14165',
        langue: 'en',
      },
      {
        titre: 'Prompt engineering',
        url: 'https://en.wikipedia.org/wiki/Prompt_engineering',
        langue: 'en',
      },
    ],
  },
};
