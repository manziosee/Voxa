from slowapi import Limiter
from slowapi.util import get_remote_address

# Global limiter — imported by main.py and by individual routes that need
# endpoint-specific limits tighter than the global default (200/minute).
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
