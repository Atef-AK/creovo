
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from lensio.core.config import settings
    print(f"Origins: {settings.allowed_origins}")
except Exception as e:
    print(f"Error loading settings: {e}")
    import traceback
    traceback.print_exc()
