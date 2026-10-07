from pathlib import Path

from django.core.exceptions import ValidationError


# Maximum upload size = 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024


# Allowed file extensions
ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
}


def validate_evidence_file(file):

    if not file:
        raise ValidationError(
            "A file is required."
        )

    # File size validation
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(
            "File size cannot exceed 10 MB."
        )

    # Extension validation
    extension = Path(
        file.name
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise ValidationError(
            "Unsupported file type. "
            "Allowed: JPG, JPEG, PNG, WEBP and PDF."
        )