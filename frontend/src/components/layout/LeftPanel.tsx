import React from 'react';
import InteractionCard from '../interaction/InteractionCard';

const LeftPanel: React.FC = () => (
  <div
    style={{
      flex: 7,
      minWidth: 0,
      padding: '16px 0 16px 16px',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <InteractionCard />
  </div>
);

export default LeftPanel;
