"""
Core AI agent powered by LangChain + LangGraph.
Handles reasoning, tool use, multilingual response, memory injection, and RAG context.
"""
import uuid
from dataclasses import dataclass, field

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services.ai.tools import VOXA_TOOLS
from app.services.ai.memory import CustomerMemoryService
from app.services.ai.rag import RAGService

settings = get_settings()

_SYSTEM_PROMPT_TEMPLATE = """You are Voxa, an AI voice receptionist for {business_name}.
You speak {language} fluently. You are professional, warm, and helpful.

Business category: {category}
Business hours: {hours}
Greeting style: {greeting}

Customer history:
{customer_history}

Relevant knowledge:
{knowledge_context}

Guidelines:
- Keep responses concise (under 3 sentences) — this is a voice call.
- If you need to book an appointment, use the book_appointment tool.
- If the customer is very upset or requests a human, use escalate_to_human.
- Always confirm appointments by also sending a WhatsApp message.
- Detect the customer's preferred language and respond in it.
- For unsupported languages, respond in English.
"""


@dataclass
class AgentResult:
    reply: str
    escalate: bool = False
    escalation_reason: str | None = None
    suggested_actions: list[str] = field(default_factory=list)
    tool_calls_made: list[str] = field(default_factory=list)


class VoxaAgent:

    def __init__(self, business_id: uuid.UUID, conversation_id: uuid.UUID):
        self.business_id = business_id
        self.conversation_id = conversation_id
        self.memory_service = CustomerMemoryService()
        self.rag_service = RAGService()
        self._llm = self._build_llm()

    def _build_llm(self):
        if settings.llm_provider == "anthropic":
            return ChatAnthropic(
                model=settings.llm_model,
                api_key=settings.anthropic_api_key,
                max_tokens=512,
            )
        return ChatOpenAI(
            model=settings.llm_model,
            api_key=settings.openai_api_key,
            max_tokens=512,
            temperature=0.4,
        )

    async def respond(
        self,
        user_message: str,
        language: str,
        customer_id: uuid.UUID | None = None,
        business_info: dict | None = None,
        db: AsyncSession | None = None,
    ) -> AgentResult:
        # Fetch long-term customer memory and RAG knowledge context
        customer_history = ""
        if customer_id:
            customer_history = await self.memory_service.get_customer_summary(customer_id, self.business_id)

        knowledge_context = await self.rag_service.retrieve_context(
            business_id=self.business_id,
            query=user_message,
        )

        info = business_info or {}
        system_content = _SYSTEM_PROMPT_TEMPLATE.format(
            business_name=info.get("name", "the business"),
            language=language,
            category=info.get("category", ""),
            hours=info.get("hours", "See our website"),
            greeting=info.get("greeting_message", "How can I help you today?"),
            customer_history=customer_history or "No prior interactions.",
            knowledge_context=knowledge_context or "No specific knowledge loaded.",
        )

        # Load conversation history from DB for in-session context (last 20 turns)
        history_messages: list[BaseMessage] = []
        if db is not None:
            history_messages = await self._load_conversation_history(db)

        agent = create_react_agent(self._llm, VOXA_TOOLS)
        messages: list[BaseMessage] = [
            SystemMessage(content=system_content),
            *history_messages,
            HumanMessage(content=user_message),
        ]

        result = await agent.ainvoke({"messages": messages})
        final_msg = result["messages"][-1]
        reply_text = final_msg.content if isinstance(final_msg.content, str) else str(final_msg.content)

        # Detect escalation signal from tool result
        escalate = False
        escalation_reason = None
        if "ESCALATE:" in reply_text:
            escalate = True
            escalation_reason = reply_text.split("ESCALATE:", 1)[1].strip()
            reply_text = "Let me connect you with one of our team members right away."

        # Collect tool calls made
        tool_calls_made = [
            m.tool_calls[0]["name"]
            for m in result["messages"]
            if hasattr(m, "tool_calls") and m.tool_calls
        ]

        return AgentResult(
            reply=reply_text,
            escalate=escalate,
            escalation_reason=escalation_reason,
            suggested_actions=self._extract_suggested_actions(reply_text),
            tool_calls_made=tool_calls_made,
        )

    async def _load_conversation_history(self, db: AsyncSession) -> list[BaseMessage]:
        """Fetch the last 20 messages from this conversation and convert to LangChain messages."""
        from sqlalchemy import select
        from app.models.conversation import Message, MessageRole

        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == self.conversation_id)
            .order_by(Message.created_at.desc())
            .limit(20)
        )
        rows = result.scalars().all()
        # Reverse so oldest-first for the LLM
        rows = list(reversed(rows))
        messages: list[BaseMessage] = []
        for row in rows:
            if row.role == MessageRole.user:
                messages.append(HumanMessage(content=row.content))
            elif row.role == MessageRole.assistant:
                messages.append(AIMessage(content=row.content))
        return messages

    def _extract_suggested_actions(self, reply: str) -> list[str]:
        actions = []
        lower = reply.lower()
        if "appointment" in lower or "book" in lower:
            actions.append("book_appointment")
        if "whatsapp" in lower or "message" in lower:
            actions.append("send_whatsapp")
        if "call back" in lower or "callback" in lower:
            actions.append("schedule_callback")
        return actions
