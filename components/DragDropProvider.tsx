'use client';

import { useState, useEffect } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

// Wrapper para o Droppable que funciona com o StrictMode do React 18
export default function StrictModeDroppable({ children, ...props }: DroppableProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Pequeno hack para garantir que o react-beautiful-dnd funcione com o StrictMode
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
} 