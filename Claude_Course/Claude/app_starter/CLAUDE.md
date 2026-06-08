# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **MCP (Model Context Protocol) server** that exposes document and math tools for AI assistants. Tools are implemented as Python functions and registered with the FastMCP server framework.

## Development Setup

### Initial Setup
```bash
uv venv                    # Create virtual environment
source .venv/bin/activate  # Activate it
uv pip install -e .        # Install package in development mode
```

### Common Commands
```bash
# Start the MCP server (listens for incoming tool requests)
uv run main.py

# Run all tests
uv run pytest

# Run tests with verbose output
uv run pytest -v

# Run a specific test file
uv run pytest tests/test_document.py -v

# Run a specific test
uv run pytest tests/test_document.py::TestBinaryDocumentToMarkdown::test_binary_document_to_markdown_with_docx -v
```

## Architecture

### Tool Registration Pattern

The server is initialized in `main.py` and tools are registered using the `@mcp.tool()` decorator:

```python
from mcp.server.fastmcp import FastMCP
from tools.math import add

mcp = FastMCP("docs")
mcp.tool()(add)  # Register the tool

if __name__ == "__main__":
    mcp.run()
```

To add a new tool:
1. Create a function in a module under `tools/`
2. Use Pydantic's `Field` for parameter descriptions
3. Write comprehensive docstrings following the pattern: one-line summary → detailed explanation → "When to use" section → examples
4. Import and register it with `mcp.tool()` in `main.py`

### Tool Definition Standards

Every tool must include:

- **One-line summary**: Brief description of what it does
- **Detailed explanation**: How the tool works and what it returns
- **When to use**: Specific use cases and scenarios
- **Examples**: Input/output examples showing typical usage

Example from `tools/math.py`:
```python
def add(
    a: float = Field(description="First number to add"),
    b: float = Field(description="Second number to add"),
) -> float:
    """Add two numbers together.
    
    Takes two numerical inputs and returns their sum. This tool handles
    integers and floating point numbers.
    
    When to use:
    - When you need to perform simple addition
    - When you need precise numerical calculation
    
    Examples:
    >>> add(2, 3)
    5.0
    >>> add(2.5, 3.5)
    6.0
    """
    return a + b
```

### Current Tools

- **`tools/math.py:add`** — Adds two numbers together
- **`tools/document.py:binary_document_to_markdown`** — Converts binary document data (PDF, DOCX) to markdown-formatted text

## Testing

Tests use pytest and are organized by tool. Test files should:
- Use fixtures directory (`tests/fixtures/`) for test data
- Follow the class-based structure for organization
- Include basic assertions verifying correct output and formatting

To add a new test:
1. Create a test class in `tests/test_*.py`
2. Add fixture files to `tests/fixtures/` if needed
3. Write assertion tests that verify tool behavior

## Dependencies

Key dependencies (from `pyproject.toml`):
- **markitdown**: Document conversion (PDF, DOCX → markdown)
- **mcp**: Model Context Protocol server framework
- **pydantic**: Type hints and field validation
- **pytest**: Testing framework

## Important Notes

- Tools must have clear, descriptive parameter names and descriptions using Pydantic's `Field`
- MCP server runs via `uv run main.py` — it's a long-running process that waits for tool requests
- The project uses `uv` for package management (faster and more reliable than pip)
- Install the package in development mode (`-e .`) to pick up code changes without reinstalling
