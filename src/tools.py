from langchain_core.tools import tool

@tool
def book_cargo_route(route_id: str):
    """Use this tool to book a cargo route. Returns 'success' if the booking goes through, or 'error' if the route is blocked."""
    if route_id == "route_99":
        return "error"
    else:
        return "success"