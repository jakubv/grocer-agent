'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function GrocerBotChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Ahoj! Som GrocerBot. Môžem ti pomôcť s nákupným zoznamom, receptami alebo ti navrhnúť, čo sa oplatí kúpiť podľa aktuálnych akcií na Lunyse a v Tescu. Čo potrebuješ?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // For now, we simulate the response.
    // In the future this will call a real backend / Grok with a strong system prompt.
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Rozumiem. Chceš, aby som ti pripravil nákupný zoznam na krevety + navrhol recept? Alebo chceš, aby som sa pozrel aj na aktuálne akcie na Lunyse a v Tescu?',
      };
      setMessages([...newMessages, assistantMessage]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-xl tracking-tighter">GB</span>
            </div>
            <div>
              <div className="font-semibold text-xl tracking-tight">GrocerBot</div>
              <div className="text-[10px] text-zinc-500 -mt-1">Tvoj osobný nákupný asistent</div>
            </div>
          </div>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Späť na zoznam</Link>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-3xl px-5 py-3 text-sm leading-relaxed ${
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
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-3 text-sm">
                GrocerBot premýšľa...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Napíš sem... napr. „Mám chuť na krevety“ alebo „Čo je teraz v akcii v Lunyse?“"
            className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-white rounded-2xl px-5 py-3 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 rounded-2xl bg-white text-black font-medium disabled:opacity-50"
          >
            Poslať
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-500 mt-2">
          GrocerBot zatiaľ odpovedá cez mňa (Grok). Neskôr bude mať vlastný mozog + prístup k akciám.
        </p>
      </div>
    </div>
  );
}
