from pathlib import Path


PROMPTS_DIR = Path(__file__).resolve().parents[1] / "prompts"


def load_prompt(name: str) -> str:
    """Load versioned instructions kept outside Python source for easy iteration."""
    return (PROMPTS_DIR / name).read_text(encoding="utf-8").strip()

