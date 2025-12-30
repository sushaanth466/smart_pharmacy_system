from fastapi import APIRouter
from pydantic import BaseModel
import os
from openai import OpenAI

router = APIRouter()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

MODEL = "mistralai/mixtral-8x7b-instruct"

# Chat memory (per session can be improved later)
conversation = [
    {
        "role": "system",
        "content": "You are ChatGPT, a friendly, helpful assistant.",
    }
]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    conversation.append({"role": "user", "content": request.message})

    response = client.chat.completions.create(
        model=MODEL,
        temperature=0.7,
        messages=conversation,
    )

    reply = response.choices[0].message.content.strip()
    conversation.append({"role": "assistant", "content": reply})

    return {"reply": reply}
