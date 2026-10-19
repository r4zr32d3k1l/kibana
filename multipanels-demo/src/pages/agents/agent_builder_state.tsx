import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  AGENTS,
  CONVERSATIONS,
  DEFAULT_AGENT_ID,
  getCannedResponse,
  type Agent,
  type Conversation,
  type Message,
  type ToolCallStep,
} from '../../data/agents';

export interface PendingResponse {
  conversationId: string;
  /** Steps revealed so far while the agent "works". */
  steps: ToolCallStep[];
  totalSteps: number;
}

interface AgentBuilderState {
  agents: Agent[];
  conversations: Conversation[];
  pending: PendingResponse | null;
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  getConversation: (id: string | undefined) => Conversation | undefined;
  /** Sends a prompt; creates the conversation when `conversationId` is undefined. Returns the id. */
  sendMessage: (conversationId: string | undefined, agentId: string, prompt: string) => string;
  togglePinned: (id: string) => void;
  markRead: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  cloneAgent: (id: string) => Agent | undefined;
  deleteAgent: (id: string) => void;
}

const Ctx = createContext<AgentBuilderState | null>(null);

const titleFromPrompt = (prompt: string) => (prompt.length > 48 ? `${prompt.slice(0, 47).trimEnd()}…` : prompt);

export const AgentBuilderStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [pending, setPending] = useState<PendingResponse | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState(DEFAULT_AGENT_ID);
  const counter = useRef(0);

  const getConversation = useCallback((id: string | undefined) => conversations.find((c) => c.id === id), [conversations]);

  const sendMessage = useCallback((conversationId: string | undefined, agentId: string, prompt: string) => {
    const now = new Date().toISOString();
    const id = conversationId ?? `conv-new-${++counter.current}`;
    const userMessage: Message = { id: `${id}-u-${Date.now()}`, role: 'user', content: prompt, createdAt: now };

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) => (c.id === id ? { ...c, updatedAt: now, unread: false, messages: [...c.messages, userMessage] } : c));
      }
      return [{ id, agentId, title: titleFromPrompt(prompt), updatedAt: now, messages: [userMessage] }, ...prev];
    });

    const canned = getCannedResponse(prompt);
    setPending({ conversationId: id, steps: [], totalSteps: canned.steps.length });

    // Reveal tool-call steps one by one, then the answer — enough latency to read as "thinking".
    let elapsed = 250;
    canned.steps.forEach((step, index) => {
      elapsed += Math.min(step.durationMs, 900);
      window.setTimeout(() => {
        setPending((p) => (p && p.conversationId === id ? { ...p, steps: canned.steps.slice(0, index + 1) } : p));
      }, elapsed);
    });
    window.setTimeout(() => {
      const reply: Message = {
        id: `${id}-a-${Date.now()}`,
        role: 'assistant',
        content: canned.content,
        createdAt: new Date().toISOString(),
        steps: canned.steps,
      };
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, updatedAt: reply.createdAt, messages: [...c.messages, reply] } : c)));
      setPending((p) => (p && p.conversationId === id ? null : p));
    }, elapsed + 600);

    return id;
  }, []);

  const togglePinned = useCallback((id: string) => setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))), []);
  const markRead = useCallback((id: string) => setConversations((prev) => prev.map((c) => (c.id === id && c.unread ? { ...c, unread: false } : c))), []);
  const renameConversation = useCallback((id: string, title: string) => setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c))), []);
  const deleteConversation = useCallback((id: string) => setConversations((prev) => prev.filter((c) => c.id !== id)), []);

  const cloneAgent = useCallback(
    (id: string) => {
      const source = agents.find((a) => a.id === id);
      if (!source) return undefined;
      const clone: Agent = {
        ...source,
        id: `${source.id}-copy-${++counter.current}`,
        name: `${source.name} (copy)`,
        type: 'Custom',
        createdBy: 'pavel.manko',
        updatedBy: 'pavel.manko',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSpaceDefault: false,
        readonly: false,
        access: 'Private',
      };
      setAgents((prev) => [...prev, clone]);
      return clone;
    },
    [agents]
  );
  const deleteAgent = useCallback((id: string) => setAgents((prev) => prev.filter((a) => a.id !== id)), []);

  const value = useMemo<AgentBuilderState>(
    () => ({
      agents,
      conversations,
      pending,
      selectedAgentId,
      setSelectedAgentId,
      getConversation,
      sendMessage,
      togglePinned,
      markRead,
      renameConversation,
      deleteConversation,
      cloneAgent,
      deleteAgent,
    }),
    [agents, conversations, pending, selectedAgentId, getConversation, sendMessage, togglePinned, markRead, renameConversation, deleteConversation, cloneAgent, deleteAgent]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAgentBuilder = (): AgentBuilderState => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAgentBuilder must be used inside AgentBuilderStateProvider');
  return ctx;
};
