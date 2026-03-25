'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { Send, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AIPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant IA. Comment puis-je vous aider ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error('Erreur de communication');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col h-screen">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">Assistant IA</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-[70%] p-4 rounded-2xl ' + (msg.role === 'user' ? 'bg-purple-600' : 'bg-gray-800')}>
                <p className="text-white">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && <div className="text-gray-400">L'assistant écrit...</div>}
        </div>
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Posez votre question..." className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
            <button onClick={sendMessage} disabled={loading} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700">Envoyer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
