from state import SupplyChainState
from tools import book_cargo_route
from langchain_google_genai import ChatGoogleGenerativeAI

def strategist_node(state: SupplyChainState):
    # 1. Initialize the Gemini model 
    # (We will use 3.7-flash for speed and cost-efficiency)
    llm = ChatGoogleGenerativeAI(model="gemini-3.7-flash")
    
    # 2. Bind the tool to the model so the AI knows it exists
    llm_with_tools = llm.bind_tools([book_cargo_route])
    
    # 3. Ask the AI to process the conversation history
    # -> YOUR TURN: Call the `invoke()` method on `llm_with_tools`.
    response = llm_with_tools.invoke(state["messages"])
    # You need to pass it the conversation history, which you can grab from `state["messages"]`.
    # Store the result in a variable named `response`.
    
    
    # 4. Return the new message as a dictionary to update the state
    return {"messages": [response]}