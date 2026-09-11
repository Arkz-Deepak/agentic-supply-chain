import os
import sys
from pathlib import Path

# Add project root and src directory to sys.path so modules resolve correctly in Vercel Serverless environment
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "src"))

from src.server import app

# Export app as ASGI entrypoint for Vercel
__all__ = ["app"]
