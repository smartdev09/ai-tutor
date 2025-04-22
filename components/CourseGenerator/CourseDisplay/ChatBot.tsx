import { useState } from 'react';

const ChatbotUI = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setInput('');
    // Add your bot logic here to generate a response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: input },
        { sender: 'bot', text: 'Thanks for your message!' },
      ]);
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto min-h-full mt-[6vh] shadow-lg rounded-2xl border border-purple-400">
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white text-lg font-semibold px-4 py-3 rounded-t-2xl">
        🤖 Chatbot Assistant
      </div>
      <div className="bg-white h-96 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 rounded-xl text-sm max-w-xs ${
                msg.sender === 'user'
                  ? 'bg-purple-200 text-right'
                  : 'bg-purple-100 text-left'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center border-t border-purple-300 bg-white p-3 rounded-b-2xl">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 text-sm border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={sendMessage}
          className="ml-3 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatbotUI;
