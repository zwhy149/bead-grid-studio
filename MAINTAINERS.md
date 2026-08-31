# Maintainers

## Primary Maintainer

- [@zwhy149](https://github.com/zwhy149)

The project is currently maintained by its primary maintainer, who is responsible for:

- Issue triage
- Pull request review
- Release management
- Architecture decisions
- Security coordination
- Documentation maintenance

Contributors who make sustained, reliable contributions to code, review, and Issue triage may be invited to become core maintainers in the future.

## Decision process

- User-visible behavior starts with a reproducible Issue or an acceptance criterion that can be tested.
- Pull Requests stay focused on one concern. Maintainers may accept the useful part of a proposal while asking for unsupported claims, duplicate configuration, or speculative platform code to be removed.
- Architecture changes that affect local-only processing, project compatibility, palette identity, or deployment security require an ADR under `docs/adr/`.
- Physical-board and palette claims require a product/data source and redistribution terms when applicable. Passing CI alone is not sufficient evidence for a factual compatibility claim.
- Accepted contributions retain their Git author attribution. Squash merge is used to keep `main` linear and reviewable.

## Review and release targets

- New Issues and Pull Requests should receive an initial triage response within seven days when maintainer availability permits.
- Security reports follow the private process and acknowledgement target in `SECURITY.md`.
- Releases are cut from protected `main`, require the repository quality gates, and publish checksummed portable artifacts.
- Dependency updates are merged only when the complete runtime set stays compatible; partial updates may be superseded by a tested atomic maintenance Pull Request.

These are service targets, not commercial support guarantees. Current project health and independently verifiable public signals are documented in [`docs/project-health.md`](docs/project-health.md).
