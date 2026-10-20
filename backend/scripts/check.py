"""Run the repository's deterministic quality gates."""

from __future__ import annotations

import logging
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOGGER = logging.getLogger(__name__)
CHECKS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Ruff lint", ("check", ".")),
    ("Ruff format", ("format", "--check", ".")),
)


def run_check(name: str, module: str, *arguments: str) -> bool:
    """Run one project tool and report whether it passed."""
    LOGGER.info("Running %s", name)
    result = subprocess.run(  # noqa: S603 - fixed argv; no shell or user input
        [sys.executable, "-m", module, *arguments],
        cwd=ROOT,
        check=False,
    )
    if result.returncode != 0:
        LOGGER.error("%s failed with exit code %s", name, result.returncode)
        return False
    return True


def main() -> int:
    """Run lint, format, type, and test checks; return a process status."""
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    passed = True

    for name, arguments in CHECKS:
        passed = run_check(name, "ruff", *arguments) and passed

    app_path = ROOT / "app"
    if app_path.is_dir() and any(app_path.rglob("*.py")):
        passed = run_check("Mypy", "mypy", "app") and passed
    else:
        LOGGER.info("Skipping Mypy: app/ has no Python files yet")

    passed = run_check("Pytest", "pytest", "-q") and passed
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
