'use client';

import { useState } from 'react';
import { Todo } from '@/lib/supabase';
import RichTextEditor from './RichTextEditor';
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import "react-datepicker/dist/react-datepicker.css";

// Registrar o locale pt-BR
registerLocale('pt-BR', ptBR);

interface TodoEditFormProps {
  todo: Todo;
  onSave: (id: string, title: string, description: string, dueDate: Date | null, imageFile?: File | null, keepExistingImage?: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function TodoEditForm({ todo, onSave, onCancel }: TodoEditFormProps) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(todo.due_date ? new Date(todo.due_date) : null);
  const [imageFile, setImageFile] = useState<File | undefined | null>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(todo.image_url || null);
  const [loading, setLoading] = useState(false);
  const [keepExistingImage, setKeepExistingImage] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    try {
      setLoading(true);
      // Se imageFile é undefined e keepExistingImage é true, mantém a imagem existente
      await onSave(todo.id, title, description, dueDate, imageFile, keepExistingImage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setImageFile(undefined);
      return;
    }

    const file = e.target.files[0];
    setImageFile(file);
    setKeepExistingImage(false);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null); // Explicitamente null para indicar remoção
    setImagePreview(null);
    setKeepExistingImage(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-blue-50 rounded-lg">
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-lg font-medium text-gray-800">Editar Tarefa</h3>
      </div>
      
      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
          Título da Tarefa
        </label>
        <input
          type="text"
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm bg-white text-black border border-gray-300 rounded-md p-3"
          placeholder="Digite sua tarefa aqui"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="edit-due-date" className="block text-sm font-medium text-gray-700 mb-1">
          Data de vencimento
        </label>
        <DatePicker
          id="edit-due-date"
          selected={dueDate}
          onChange={(date) => setDueDate(date)}
          locale="pt-BR"
          dateFormat="dd/MM/yyyy"
          placeholderText="Selecione uma data"
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 bg-white"
          disabled={loading}
          isClearable
        />
      </div>

      <div>
        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <RichTextEditor
          content={description}
          onChange={setDescription}
          placeholder="Adicione detalhes sobre esta tarefa..."
        />
      </div>

      <div>
        <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700 mb-1">
          Imagem (opcional)
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {imageFile ? 'Alterar Imagem' : 'Selecionar Imagem'}
            <input
              type="file"
              id="edit-image"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
          </label>
          
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-md border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors duration-200"
              >
                ×
              </button>
            </div>
          )}
        </div>
        {todo.image_url && imageFile === undefined && (
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            A imagem atual será mantida se você não selecionar uma nova.
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </button>
      </div>
    </form>
  );
} 