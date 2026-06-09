'use client';

import { useEffect, useRef, useState } from 'react';
import { AccessGate } from '@/components/AccessGate';
import { AppHeader } from '@/components/AppHeader';
import { authHeaders, getCurrentUser, getStoredToken } from '@/lib/api-client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function GrocerBotChat() {
  const [unlocked, setUnlocked] = useState(() => Boolean(getStoredToken()));
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Ahoj! Som GrocerBot. Pomôžem s nákupným zoznamom, receptami a tipmi pre Lunys a Tesco. Čo potrebuješ?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          messages: newMessages,
          user_name: getCurrentUser(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Chat error');

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Prepáč, momentálne neviem odpovedať. Skús znova o chvíľu.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col pb-safe">
      <AppHeader badge="GB" title="GrocerBot" subtitle="Nákupný asistent" />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 border border-zinc-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-zinc-500 text-sm animate-pulse">GrocerBot píše…</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur p-4 safe-bottom">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Napíš správu…"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 outline-none text-base"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-white text-black rounded-2xl font-medium disabled:opacity-40 touch-manipulation"
          >
            Odoslať
          </button>
        </div>
      </div>
    </div>
  );
}