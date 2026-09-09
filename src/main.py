from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from state import SupplyChainState
from nodes import strategist_node
from tools import book_cargo_route
from dotenv import load_dotenv
load_dotenv()

# 1. Initialize the flowchart
workflow = StateGraph(SupplyChainState)

# 2. Add our "brain"
workflow.add_node("strategist", strategist_node)

# 3. Add the pre-built tool executor node
# We pass it a list of the tools it is allowed to run
tool_executor = ToolNode([book_cargo_route])
workflow.add_node("tools", tool_executor)

# 4. Tell the flowchart where to begin when it first runs
workflow.set_entry_point("strategist")

workflow.add_conditional_edges("strategist", tools_condition)

workflow.add_edge("tools","strategist")

app = workflow.compile()

if __name__ == "__main__":
    # 8. Define the starting input
    inputs = {
        "messages":[("user", "There is a massive storm delaying our shipments. Please book cargo route_99 immediately.")]
    }    
    # 9. Run the graph and print the result
    result = app.invoke(inputs)
    
    print("\n--- FINAL AI RESPONSE ---")
    print(result["messages"][-1].content)