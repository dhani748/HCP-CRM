import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { sendAgentMessage, clearChat, selectChatTyping, addMessage, selectEditingInteractionId } from '../../redux/slices/chatSlice';
import { updateInteractionFromTool, selectCurrentInteraction } from '../../redux/slices/interactionSlice';
import { selectEditingSession, EditingMode } from '../../redux/slices/editingSessionSlice';
import ChatHeader from './ChatHeader';
import SuggestedPromptCard from './SuggestedPromptCard';
import ToolExecutionBadge from './ToolExecutionBadge';
import ToolExecutionLog from './ToolExecutionLog';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const AIAssistant: React.FC = () => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages);
  const error = useAppSelector((s) => s.chat.error);
  const isTyping = useAppSelector(selectChatTyping);
  const currentTool = useAppSelector((s) => s.chat.currentTool);
  const toolStatus = useAppSelector((s) => s.chat.toolExecutionStatus);
  const updatedFields = useAppSelector((s) => s.chat.updatedFields);
  const session = useAppSelector(selectEditingSession);
  const interaction = useAppSelector(selectCurrentInteraction);
  const editingInteractionId = useAppSelector(selectEditingInteractionId);
  const [input, setInput] = useState('');
  const prevMode = useRef<EditingMode>('idle');

  useEffect(() => {
    const mode = session.mode;
    if (mode === 'idle' || mode === prevMode.current) return;
    prevMode.current = mode;

    if (mode === 'create') {
      dispatch(addMessage({
        role: 'assistant',
        content: 'Describe the HCP interaction and I will populate the form for you in real time.',
        timestamp: new Date().toISOString(),
      }));
    } else if (mode === 'edit') {
      dispatch(addMessage({
        role: 'assistant',
        content: `You are editing interaction #${session.interactionId}. What would you like to change?`,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [session.mode, session.interactionId, dispatch]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');

    dispatch({
      type: 'chat/addMessage',
      payload: { role: 'user', content: text, timestamp: new Date().toISOString() },
    });

    try {
      // Pass current form state so the AI context stays synchronized for edits
      const currentState = interaction as Record<string, unknown>;
      const result = await dispatch(sendAgentMessage({
        message: text,
        editingInteractionId,
        draftMode: true,
        currentState,
      })).unwrap();

      if (result.tool_executed !== 'none' && result.interaction_state) {
        dispatch(updateInteractionFromTool({
          data: result.interaction_state as Record<string, unknown>,
          updatedFields: result.updated_fields,
        }));
      }
    } catch {
      // handled by slice
    }
  }, [input, isTyping, dispatch, interaction, editingInteractionId]);

  const handleClear = useCallback(() => {
    dispatch(clearChat());
  }, [dispatch]);

  const showLog = toolStatus === 'thinking' || toolStatus === 'executing' || (toolStatus === 'completed' && updatedFields.length > 0);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <ChatHeader onClear={handleClear} />
      <SuggestedPromptCard />
      {currentTool || toolStatus ? (
        <ToolExecutionBadge
          toolName={currentTool}
          status={toolStatus}
          updatedFields={updatedFields}
        />
      ) : null}
      {showLog && (
        <ToolExecutionLog
          toolName={currentTool}
          status={toolStatus}
          updatedFields={updatedFields}
        />
      )}
      <ChatMessages messages={messages} isTyping={isTyping} />
      {error && (
        <div style={{
          padding: '8px 16px',
          background: 'var(--color-error-light)',
          borderTop: '1px solid var(--color-error-light)',
          fontSize: 12,
          color: 'var(--color-error)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ flex: 1 }}>
            {error === 'Network error. Please check your connection.'
              ? 'Backend server is not reachable. Make sure FastAPI is running on port 8000.'
              : error.includes('GROQ_API_KEY')
              ? error
              : error.includes('LangGraph')
              ? error
              : `Error: ${error}`}
          </span>
        </div>
      )}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isTyping}
      />
    </div>
  );
};

export default AIAssistant;
