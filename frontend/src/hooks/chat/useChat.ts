import { useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { sendMessage, addMessage, clearChat } from '../../redux/slices/chatSlice';

export function useChat() {
  const dispatch = useAppDispatch();
  const { messages, isTyping, loading, error } = useAppSelector(s => s.chat);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback((content: string) => {
    dispatch(addMessage({ role: 'user', content }));
    dispatch(sendMessage(content));
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      dispatch(sendMessage(lastUserMsg.content));
    }
  }, [dispatch, messages]);

  const handleClear = useCallback(() => {
    dispatch(clearChat());
  }, [dispatch]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return {
    messages,
    isTyping,
    loading,
    error,
    containerRef,
    handleSend,
    handleRetry,
    handleClear,
  };
}
