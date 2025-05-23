import { getSessionUserInfo } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { useChat } from '@ai-sdk/react';
import { Bot, User } from 'lucide-react';
import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const ChatbotUI = () => {
  const currentLessonContent = useAppSelector((state) => state.course.currentLessonContent);
  const currentLessonTitle = useAppSelector((state) => state.course.currentLessonTitle);
  const storedUser = JSON.parse(localStorage.getItem("user_info") || '{}');
  const userid = storedUser.id;
  const tokens = storedUser.tokens;
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    body: {
      content: currentLessonContent,
      tokens,
      userid
    }
  });

  useEffect(() => {
    if (messageEndRef.current && messageContainerRef.current) {
      const container = messageContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const height = container.clientHeight;
      const maxScrollTop = scrollHeight - height;
      getSessionUserInfo()

      container.scrollTo({
        top: maxScrollTop,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] shadow-lg rounded-2xl border border-purple-400">
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white text-lg font-semibold px-4 py-3 rounded--2xl">
        {currentLessonTitle}
      </div>

      <div
        ref={messageContainerRef}
        className="flex-1 bg-white overflow-y-auto px-4 py-3 space-y-4"
      >
        {messages.map(m => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${m.role === 'user'
              ? 'bg-purple-100 ml-6'
              : 'bg-gray-100 mr-6'
              }`}
          >
            <span className="font-bold mb-1">
              {m.role === 'user' ?
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <User size={18} className="text-purple-600" />
                </span> :
                <span className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
                  <Bot size={18} className="text-purple-600" />
                </span>}
            </span>
            <div className="prose max-w-none">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="p-3 bg-gray-100 rounded-lg mr-6">
            <div className="font-bold mb-1">🤖 Assistant</div>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center border- border-purple-300 bg-white p-3 rounded-b-2xl mt-auto"
      >
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 text-sm border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="ml-3 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition disabled:bg-purple-400"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatbotUI;