'use client';

import { useState, useEffect } from 'react';
import { format, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DateFilter = {
  type: 'all' | 'today' | 'week' | 'month' | 'overdue';
  startDate?: Date;
  endDate?: Date;
};

export type TodoFilterProps = {
  onFilterChange: (filter: DateFilter) => void;
  onSearchChange: (term: string) => void;
  onDateFilterChange: (filter: DateFilter) => void;
  dateFilter: DateFilter;
};

export default function TodoFilter({ onFilterChange, onSearchChange, onDateFilterChange, dateFilter }: TodoFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState<DateFilter>(dateFilter || { type: 'all' });

  // Inicializar o estado com o filtro atual
  useEffect(() => {
    if (dateFilter) {
      setCurrentFilter(dateFilter);
    }
  }, [dateFilter]);

  const handleFilterChange = (type: DateFilter['type']) => {
    const newFilter: DateFilter = { type };
    setCurrentFilter(newFilter);
    onDateFilterChange(newFilter);
    onFilterChange(newFilter);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar tarefas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentFilter.type === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleFilterChange('today')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentFilter.type === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => handleFilterChange('week')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentFilter.type === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => handleFilterChange('month')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentFilter.type === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => handleFilterChange('overdue')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentFilter.type === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Atrasadas
          </button>
        </div>
      </div>
    </div>
  );
} 