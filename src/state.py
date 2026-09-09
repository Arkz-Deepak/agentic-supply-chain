from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class SupplyChainState(TypedDict):
    messages: Annotated[list, add_messages]
    tool_status: str
    current_route: str