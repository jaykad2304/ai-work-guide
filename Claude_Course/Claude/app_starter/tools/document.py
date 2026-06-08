from markitdown import MarkItDown, StreamInfo
from io import BytesIO
import os
from pydantic import Field


def binary_document_to_markdown(binary_data: bytes, file_type: str) -> str:
    """Converts binary document data to markdown-formatted text."""
    md = MarkItDown()
    file_obj = BytesIO(binary_data)
    stream_info = StreamInfo(extension=file_type)
    result = md.convert(file_obj, stream_info=stream_info)
    return result.text_content


def document_path_to_markdown(
    file_path: str = Field(description="Path to a PDF or DOCX document file")
) -> str:
    """Convert a document file to markdown-formatted text.

    Takes a file path to a PDF or DOCX document, reads the file, and converts
    its content to markdown format. Returns the converted markdown text.

    When to use:
    - When you have a document file path and need to extract its content as markdown
    - When you want to convert PDF or DOCX files to readable text format
    - When integrating with file-based document processing workflows

    Examples:
    >>> document_path_to_markdown("/path/to/document.pdf")
    "# Document Title\\n\\nContent here..."
    >>> document_path_to_markdown("/path/to/report.docx")
    "## Report Section\\n\\nDetails..."
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Document file not found: {file_path}")

    _, file_extension = os.path.splitext(file_path)
    file_extension = file_extension.lstrip(".").lower()

    if file_extension not in ("pdf", "docx"):
        raise ValueError(
            f"Unsupported file type: {file_extension}. Supported types: pdf, docx"
        )

    with open(file_path, "rb") as f:
        binary_data = f.read()

    return binary_document_to_markdown(binary_data, file_extension)
