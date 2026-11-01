# 0022 — Public GitHub repository

- **Date**: 2026-10-22
- **Status**: Accepted
- **Completes**: [0009](0009-qualite-sonarway.md) (its "private repository" premise no longer holds)

## Context

The review before going online on 2026-10-22 found that the `Obemm/20_HIPMaster` repository is **public**, whereas ADR
0009 reasons "as long as the repository is private". The repository contains the text of the cards (company products and
integration platform, with their versions) and a summary of the company ADR reference (ADR 0005).

## Decision

- The repository **stays public**. The project owner judges that this information is not confidential: it can be found
  in a few minutes on public profiles (2026-10-22). The card texts do not change.
- What must never enter the repository: secrets (passwords, tokens, keys), player data, `.env` files. Production
  secrets live in Secret Manager and in the GitHub variables (ADR 0021).

## Alternatives considered

- **Private repository**: nothing is visible, but GitHub Actions minutes become limited (2,000 per month), when CI
  consumed about 80 per day during the week of 2026-10-16, and SonarQube Cloud becomes paid.
- **Public repository cleaned** of every mention of the company: pointless, since this information is public.

## Consequences

- GitHub Actions stays free and without a minutes cap for this repository.
- **SonarQube Cloud is free for a public repository**: the deviation that ADR 0009 accepted (no dashboard or debt
  tracking) can be lifted, through a dedicated story if the project owner wishes.
- The code is readable by everyone: security never relies on the secrecy of an algorithm. This is why the randomness of
  the duels must become unpredictable even for someone reading the code (US-058).
- GitHub's protection against publishing secrets (secret scanning, push protection) must be kept enabled.
