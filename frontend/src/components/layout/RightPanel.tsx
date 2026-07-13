import React from 'react';
import AIAssistant from '../chat/AIAssistant';

const RightPanel: React.FC = () => (
  <div
    style={{
      flex: 3,
      minWidth: 280,
      maxWidth: 400,
      padding: '16px 16px 16px 8px',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <AIAssistant />
  </div>
);

export default RightPanel;
