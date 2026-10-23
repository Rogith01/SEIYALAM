
from .settings import *

# Isolated in-memory SQLite test database.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Use the test-only copy of accounts migrations.
MIGRATION_MODULES = {
    "accounts": "test_migrations.accounts",
}
