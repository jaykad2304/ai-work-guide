from fastapi import APIRouter
from backend.collectors.registry import connector_catalog, load_collectors

router = APIRouter(tags=["connectors"])


@router.get("/connectors")
def list_connectors():
    """Return supported/planned integration coverage."""
    enabled = {collector.tool_name for collector in load_collectors()}
    catalog = connector_catalog()
    return {
        "connectors": [
            {
                **connector,
                "enabled": connector["name"] in enabled,
            }
            for connector in catalog
        ],
        "guidance": {
            "supported": "Captured automatically by built-in collectors.",
            "connector_ready": "Can be observed by posting normalized events to /api/events.",
            "planned": "Needs a provider-specific collector, wrapper, extension, or API integration.",
        },
    }
