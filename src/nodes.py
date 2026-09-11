from state import SupplyChainState
from tools import (
    get_map_routes,
    get_weather_disruptions,
    get_crowdsourced_traffic,
    notify_stakeholders,
)
from langchain_google_genai import ChatGoogleGenerativeAI

def strategist_node(state: SupplyChainState):
    # 1. Initialize Gemini model (3.7-flash)
    llm = ChatGoogleGenerativeAI(model="gemini-3.7-flash")
    
    # 2. Bind the tools so the model can inspect crowdsourced reports, check live weather,
    # compute real road corridors with OpenRouteService, and draft/send stakeholder emails.
    llm_with_tools = llm.bind_tools([
        get_map_routes,
        get_weather_disruptions,
        get_crowdsourced_traffic,
        notify_stakeholders,
    ])
    
    # 3. Ask the AI to process the conversation history
    response = llm_with_tools.invoke(state["messages"])
    
    # 4. Return the new message as a dictionary to update the state
    return {"messages": [response]}