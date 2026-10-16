const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Autorise les IDs de story en portée : feat(US-012): …
    'scope-case': [0],
  },
};

export default config;
