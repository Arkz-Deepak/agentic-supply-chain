from state import SupplyChainState
from tools import (
    get_map_routes,
    get_weather_disruptions,
    get_crowdsourced_traffic,
    notify_stakeholders,
)
import os
from langchain_google_genai import ChatGoogleGenerativeAI

def get_strategist_llm():
    # Use gemini-2.5-flash for reliable free-tier quota and sub-second latency
    for model_name in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]:
        try:
            return ChatGoogleGenerativeAI(
                model=model_name,
                max_retries=1,
                timeout=15.0
            )
        except Exception:
            continue
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", max_retries=1, timeout=15.0)

def strategist_node(state: SupplyChainState):
    # 1. Initialize Gemini model (2.5-flash)
    llm = get_strategist_llm()
    
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