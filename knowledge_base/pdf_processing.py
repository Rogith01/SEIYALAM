from pypdf import PdfReader


def extract_pdf_text(file_field):
    """
    Extract readable text from an uploaded PDF.
    Returns the extracted text as a string.
    """
    file_field.open("rb")

    try:
        reader = PdfReader(file_field)
        pages = []

        for page in reader.pages:
            pages.append(page.extract_text() or "")

        return "\n".join(pages).strip()
    finally:
        file_field.close()
