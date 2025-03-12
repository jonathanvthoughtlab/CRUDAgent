'use client';

import { Todo } from '@/lib/supabase';
import { useState } from 'react';
import TodoEditForm from './TodoEditForm';
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, title: string, description: string, dueDate: Date | null, imageFile?: File | null, keepExistingImage?: boolean) => Promise<void>;
  borderColor?: string;
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit, borderColor }: TodoItemProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      await onToggle(todo.id, !todo.completed);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        setLoading(true);
        await onDelete(todo.id);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (id: string, title: string, description: string, dueDate: Date | null, imageFile?: File | null, keepExistingImage?: boolean) => {
    try {
      await onEdit(id, title, description, dueDate, imageFile, keepExistingImage);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao editar tarefa:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getDueDateStatus = () => {
    if (!todo.due_date) return null;
    
    const dueDate = new Date(todo.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    
    if (todo.completed) {
      return { text: 'Concluída', color: 'bg-green-100 text-green-800' };
    } else if (isBefore(dueDate, today)) {
      return { text: 'Atrasada', color: 'bg-red-100 text-red-800' };
    } else if (isToday(dueDate)) {
      return { text: 'Hoje', color: 'bg-yellow-100 text-yellow-800' };
    } else if (isBefore(dueDate, tomorrow)) {
      return { text: 'Amanhã', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: format(dueDate, 'dd/MM/yyyy', { locale: ptBR }), color: 'bg-gray-100 text-gray-800' };
    }
  };

  const dueDateStatus = todo.due_date ? getDueDateStatus() : null;

  const cardBorderColor = borderColor || 
                         (todo.completed ? 'border-green-200' : 
                          todo.due_date && isPast(parseISO(todo.due_date)) && !isToday(parseISO(todo.due_date)) ? 'border-red-200' :
                          todo.due_date && isToday(parseISO(todo.due_date)) ? 'border-yellow-200' :
                          'border-gray-200');

  if (isEditing) {
    return (
      <li className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md card-shadow">
        <TodoEditForm 
          todo={todo} 
          onSave={handleEdit} 
          onCancel={() => setIsEditing(false)} 
        />
      </li>
    );
  }

  return (
    <li className={`bg-white border-l-4 ${cardBorderColor} rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md card-shadow group cursor-grab active:cursor-grabbing`}>
      <div className="p-4 relative">
        {/* Indicador de arraste */}
        <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
        
        {todo.image_url && (
          <div className="mb-3">
            <img
              src={todo.image_url}
              alt={todo.title}
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}
        
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={handleToggle}
              disabled={loading}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
            />
          </div>
          
          <div className="flex-1 min-w-0 ml-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm font-medium text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                {todo.title}
              </p>
              
              {dueDateStatus && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${dueDateStatus.color}`}>
                  {dueDateStatus.text}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(todo.created_at)}
              </span>
              
              {todo.description && (
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                </button>
              )}
            </div>
            
            {showDetails && todo.description && (
              <div className="mt-3 prose prose-sm max-w-none bg-gray-50 p-3 rounded-md" dangerouslySetInnerHTML={{ __html: todo.description }} />
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-3 space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            title="Editar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            title="Excluir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
} 