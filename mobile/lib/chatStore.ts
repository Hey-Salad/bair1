import { create } from 'zustand';

import { streamChat } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';

interface ChatState {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  abort: AbortController | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

let counter = 0;
const nextId = () => `m${Date.now()}_${counter++}`;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streaming: false,
  error: null,
  abort: null,

  send: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || get().streaming) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', content: trimmed };
    const assistantMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '' };
    const controller = new AbortController();

    set((s) => ({
      messages: [...s.messages, userMsg, assistantMsg],
      streaming: true,
      error: null,
      abort: controller,
    }));

    const history = get()
      .messages.filter((m) => m.id !== assistantMsg.id)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChat(
        history,
        (delta) => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m,
            ),
          }));
        },
        controller.signal,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Chat request failed';
      set((s) => ({
        error: message,
        messages: s.messages.map((m) =>
          m.id === assistantMsg.id && m.content === ''
            ? { ...m, content: 'Sorry — I could not reach the assistant. Please try again.' }
            : m,
        ),
      }));
    } finally {
      set({ streaming: false, abort: null });
    }
  },

  reset: () => {
    get().abort?.abort();
    set({ messages: [], streaming: false, error: null, abort: null });
  },
}));
