import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isBefore,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isWithinInterval,
  parseISO,
  format,
  addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Todo } from './supabase';
import { DateFilter } from '@/components/TodoFilter';

// Função para filtrar tarefas com base no filtro de data
export function filterTodosByDate(todos: Todo[], filter: DateFilter): Todo[] {
  if (!todos || todos.length === 0) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (filter.type) {
    case 'all':
      return todos;
      
    case 'today': {
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      
      return todos.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate >= today && dueDate <= endOfToday;
      });
    }
    
    case 'week': {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      
      return todos.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate >= today && dueDate <= endOfWeek;
      });
    }
    
    case 'month': {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      return todos.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate >= today && dueDate <= endOfMonth;
      });
    }
    
    case 'overdue':
      return todos.filter(todo => {
        if (!todo.due_date || todo.completed) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate < today;
      });
      
    default:
      return todos;
  }
}

// Função para obter o texto do filtro atual
export function getFilterLabel(filter: DateFilter): string {
  switch (filter.type) {
    case 'all':
      return 'Todas as tarefas';
    case 'today':
      return 'Tarefas de hoje';
    case 'week':
      return 'Tarefas desta semana';
    case 'month':
      return 'Tarefas deste mês';
    case 'overdue':
      return 'Tarefas atrasadas';
    default:
      return 'Todas as tarefas';
  }
}

// Tipos para agrupamento de tarefas
export type DateGroup = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'future' | 'noDueDate' | 'completed';

export interface GroupedTodos {
  [key: string]: {
    title: string;
    todos: Todo[];
    order: number;
  }
}

// Função para agrupar tarefas por data de vencimento
export function groupTodosByDueDate(todos: Todo[]): GroupedTodos {
  const today = new Date();
  const groups: GroupedTodos = {
    'overdue': {
      title: 'Atrasadas',
      todos: [],
      order: 1
    },
    'today': {
      title: 'Hoje',
      todos: [],
      order: 2
    },
    'tomorrow': {
      title: 'Amanhã',
      todos: [],
      order: 3
    },
    'thisWeek': {
      title: 'Esta semana',
      todos: [],
      order: 4
    },
    'nextWeek': {
      title: 'Próxima semana',
      todos: [],
      order: 5
    },
    'thisMonth': {
      title: 'Este mês',
      todos: [],
      order: 6
    },
    'future': {
      title: 'Futuro',
      todos: [],
      order: 7
    },
    'noDueDate': {
      title: 'Sem data definida',
      todos: [],
      order: 8
    },
    'completed': {
      title: 'Concluídas',
      todos: [],
      order: 9
    }
  };

  todos.forEach(todo => {
    // Tarefas concluídas vão para a coluna de concluídas, independente da data
    if (todo.completed) {
      groups['completed'].todos.push(todo);
      return;
    }
    
    if (!todo.due_date) {
      groups['noDueDate'].todos.push(todo);
      return;
    }

    const dueDate = parseISO(todo.due_date);
    
    if (isBefore(dueDate, startOfDay(today))) {
      groups['overdue'].todos.push(todo);
    } else if (isToday(dueDate)) {
      groups['today'].todos.push(todo);
    } else if (isTomorrow(dueDate)) {
      groups['tomorrow'].todos.push(todo);
    } else if (isThisWeek(dueDate, { locale: ptBR })) {
      groups['thisWeek'].todos.push(todo);
    } else if (isWithinInterval(dueDate, {
      start: endOfWeek(today, { locale: ptBR }),
      end: endOfWeek(addDays(today, 7), { locale: ptBR })
    })) {
      groups['nextWeek'].todos.push(todo);
    } else if (isThisMonth(dueDate)) {
      groups['thisMonth'].todos.push(todo);
    } else {
      groups['future'].todos.push(todo);
    }
  });

  // Remover grupos vazios
  Object.keys(groups).forEach(key => {
    if (groups[key].todos.length === 0) {
      delete groups[key];
    }
  });

  return groups;
}

// Adicionar função para obter a cor de fundo e cabeçalho para cada grupo
export function getGroupColors(groupKey: string): { bgColor: string, headerColor: string, borderColor: string } {
  switch (groupKey) {
    case 'overdue':
      return { 
        bgColor: 'bg-red-50', 
        headerColor: 'bg-red-600',
        borderColor: 'border-red-300'
      };
    case 'today':
      return { 
        bgColor: 'bg-yellow-50', 
        headerColor: 'bg-yellow-600',
        borderColor: 'border-yellow-300'
      };
    case 'tomorrow':
      return { 
        bgColor: 'bg-blue-50', 
        headerColor: 'bg-blue-600',
        borderColor: 'border-blue-200'
      };
    case 'thisWeek':
      return { 
        bgColor: 'bg-indigo-50', 
        headerColor: 'bg-indigo-600',
        borderColor: 'border-indigo-200'
      };
    case 'nextWeek':
      return { 
        bgColor: 'bg-purple-50', 
        headerColor: 'bg-purple-600',
        borderColor: 'border-purple-200'
      };
    case 'thisMonth':
      return { 
        bgColor: 'bg-pink-50', 
        headerColor: 'bg-pink-600',
        borderColor: 'border-pink-200'
      };
    case 'future':
      return { 
        bgColor: 'bg-cyan-50', 
        headerColor: 'bg-cyan-600',
        borderColor: 'border-cyan-200'
      };
    case 'completed':
      return { 
        bgColor: 'bg-green-50', 
        headerColor: 'bg-green-600',
        borderColor: 'border-green-200'
      };
    case 'noDueDate':
    default:
      return { 
        bgColor: 'bg-gray-50', 
        headerColor: 'bg-gray-600',
        borderColor: 'border-gray-200'
      };
  }
}

// Função para formatar data em português
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
} 