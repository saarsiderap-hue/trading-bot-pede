import React, { useState, useRef, useEffect } from 'react';
import { createChatSession, sendMessageToChat } from '../services/geminiService';
import { Message } from '../types';
import { Send, Bot, User, RefreshCw } from 'lucide-react';

const OracleChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'Systems online. I am the Oracle. Accessing global crypto markets... What sector requires analysis?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    chatRef.current = createChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToChat(chatRef.current, userMsg.text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[600px] flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-2xl">
      <div className="bg-neutral-800 p-4 border-b border-neutral-700 flex justify-between items-center">
         <div className="flex items-center space-x-2">
            <Bot className="text-orange-500" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Oracle Uplink</h2>
         </div>
         <button 
           onClick={() => {
             setMessages([]); 
             chatRef.current = createChatSession();
           }}
           className="text-gray-500 hover:text-white"
         >
           <RefreshCw size={18} />
         </button>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] p-4 rounded-lg border ${
                msg.role === 'user' 
                  ? 'bg-orange-900/20 border-orange-700/50 text-orange-100 rounded-tr-none' 
                  : 'bg-neutral-800 border-neutral-700 text-gray-300 rounded-tl-none'
              }`}
            >
               <div className="flex items-center mb-1 space-x-2 opacity-50 text-xs uppercase font-bold tracking-wider">
                  {msg.role === 'user' ? <User size={12}/> : <Bot size={12}/>}
                  <span>{msg.role === 'user' ? 'Operator' : 'Oracle'}</span>
               </div>
               <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                 {msg.text}
               </div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 rounded-tl-none flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-neutral-800 border-t border-neutral-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query the Oracle..."
            className="flex-grow bg-black border border-neutral-600 rounded p-3 text-white focus:outline-none focus:border-orange-500 font-mono transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-500 text-white p-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OracleChat;