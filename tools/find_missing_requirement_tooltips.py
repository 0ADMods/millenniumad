#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path


def find_missing_requirement_tooltips(root: Path) -> list[Path]:
    missing: list[Path] = []
    for path in sorted(root.rglob("*.xml")):
        text = path.read_text()
        if "<Requirements>" in text and "<Tooltip>" not in text:
            missing.append(path)
    return missing


def main() -> int:
    parser = argparse.ArgumentParser(
        description="List entity templates that define <Requirements> without a nested <Tooltip>."
    )
    parser.add_argument(
        "templates_root",
        nargs="?",
        default="simulation/templates",
        help="Templates directory to scan. Defaults to simulation/templates relative to cwd.",
    )
    args = parser.parse_args()

    root = Path(args.templates_root).resolve()
    if not root.is_dir():
        print(f"error: templates root does not exist: {root}")
        return 2

    missing = find_missing_requirement_tooltips(root)
    for path in missing:
        print(path)

    print(f"TOTAL={len(missing)}")
    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
