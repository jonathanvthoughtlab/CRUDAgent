'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/lib/supabase';
import TodoItem from '@/components/TodoItem';
import TodoForm from '@/components/TodoForm';
import toast from 'react-hot-toast';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import StrictModeDroppable from '@/components/DragDropProvider';
import TodoFilter, { DateFilter } from '@/components/TodoFilter';
import { filterTodosByDate, getFilterLabel, groupTodosByDueDate, GroupedTodos, getGroupColors } from '@/lib/dateUtils';
import { addDays, startOfDay } from 'date-fns';
import Header from '@/components/Header';

// Tipo de visualização
type ViewType = 'status' | 'dueDate';

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<ViewType>('status');

  // Aplicar filtros às tarefas
  const filteredTodos = filterTodosByDate(todos, dateFilter)
    .filter(todo => 
      searchTerm ? 
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase())) 
      : true
    );

  // Agrupar tarefas por status
  const pendingTodos = filteredTodos.filter(todo => !todo.completed);
  const completedTodos = filteredTodos.filter(todo => todo.completed);

  // Agrupar tarefas por data de vencimento
  const groupedByDueDate: GroupedTodos = groupTodosByDueDate(filteredTodos);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          console.log('Usuário autenticado:', data.user.id);
          setUser(data.user);
          fetchTodos(data.user.id);
        } else {
          console.error('Usuário não autenticado');
          toast.error('Você precisa estar autenticado para ver suas tarefas.');
        }
      } catch (error: any) {
        console.error('Erro ao obter usuário:', error);
        toast.error(`Erro ao obter usuário: ${error.message}`);
      }
    };

    fetchUser();

    // Configurar a assinatura em tempo real
    const subscription = supabase
      .channel('todos')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'todos' 
      }, (payload) => {
        console.log('Mudança em tempo real recebida:', payload);
        if (payload.eventType === 'INSERT') {
          setTodos(prev => [...prev, payload.new as Todo]);
        } else if (payload.eventType === 'UPDATE') {
          setTodos(prev => prev.map(todo => 
            todo.id === payload.new.id ? payload.new as Todo : todo
          ));
        } else if (payload.eventType === 'DELETE') {
          setTodos(prev => prev.filter(todo => todo.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Recarregar tarefas quando o filtro de data mudar
  useEffect(() => {
    if (user) {
      fetchTodos(user.id);
    }
  }, [dateFilter.type, dateFilter.startDate, dateFilter.endDate]);

  const fetchTodos = async (userId: string) => {
    try {
      setLoading(true);
      console.log('Buscando tarefas para o usuário:', userId);
      
      let query = supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId);
      
      // Aplicar filtros de data no servidor quando possível
      if (dateFilter.type === 'today') {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        
        // Filtrar tarefas com data de vencimento hoje
        query = query.gte('due_date', startOfToday).lte('due_date', endOfToday);
      } else if (dateFilter.type === 'overdue') {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        
        // Filtrar tarefas atrasadas (data de vencimento anterior a hoje e não concluídas)
        query = query.lt('due_date', startOfToday).eq('completed', false);
      }
      
      // Ordenar por data de vencimento e depois por data de criação
      query = query.order('due_date', { ascending: true })
                   .order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
        throw error;
      }

      console.log('Tarefas encontradas:', data?.length || 0);
      setTodos(data || []);
    } catch (error: any) {
      console.error('Erro completo ao carregar tarefas:', error);
      toast.error(`Erro ao carregar tarefas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com o fim do drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Se não houver destino (solto fora de uma área válida) ou se o destino for o mesmo que a origem, não faz nada
    if (!destination || 
        (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }
    
    // Obtém o ID da tarefa arrastada
    const todoId = draggableId;
    
    try {
      if (viewType === 'status') {
        // Visualização por status: atualiza o status de conclusão
        const newCompleted = destination.droppableId === 'completed';
        
        // Atualiza o estado localmente para feedback imediato
        setTodos(prevTodos => 
          prevTodos.map(todo => 
            todo.id === todoId ? { ...todo, completed: newCompleted } : todo
          )
        );
        
        // Atualiza no banco de dados
        await toggleTodo(todoId, newCompleted);
        
        toast.success(`Tarefa ${newCompleted ? 'concluída' : 'reaberta'} com sucesso!`);
      } else {
        // Visualização por data: atualiza a data de vencimento
        const targetGroup = destination.droppableId;
        const todo = todos.find(t => t.id === todoId);
        
        if (!todo) return;
        
        let newDueDate: Date | null = null;
        const today = new Date();
        
        // Determina a nova data de vencimento com base no grupo de destino
        switch (targetGroup) {
          case 'today':
            newDueDate = startOfDay(today);
            break;
          case 'tomorrow':
            newDueDate = startOfDay(addDays(today, 1));
            break;
          case 'thisWeek':
            // Define para o próximo dia útil desta semana (excluindo hoje e amanhã)
            newDueDate = startOfDay(addDays(today, 2)); // Começa com depois de amanhã
            break;
          case 'nextWeek':
            // Define para o início da próxima semana
            newDueDate = startOfDay(addDays(today, 7));
            break;
          case 'thisMonth':
            // Define para a próxima semana
            newDueDate = startOfDay(addDays(today, 14));
            break;
          case 'future':
            // Define para o próximo mês
            newDueDate = startOfDay(addDays(today, 30));
            break;
          case 'noDueDate':
            newDueDate = null;
            break;
          case 'completed':
            // Marca como concluída e mantém a data
            await toggleTodo(todoId, true);
            toast.success('Tarefa concluída com sucesso!');
            return;
          case 'overdue':
            // Não faz sentido arrastar para "atrasadas", então mantém a data atual
            return;
        }
        
        // Atualiza o estado localmente para feedback imediato
        setTodos(prevTodos => 
          prevTodos.map(t => {
            if (t.id === todoId) {
              return {
                ...t,
                due_date: newDueDate ? newDueDate.toISOString() : null
              } as Todo; // Forçar o tipo como Todo
            }
            return t;
          })
        );
        
        // Atualiza no banco de dados
        await updateTodoDueDate(todoId, newDueDate);
        
        toast.success(`Data da tarefa atualizada para ${targetGroup === 'noDueDate' ? 'sem data' : groupedByDueDate[targetGroup].title.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      toast.error('Erro ao mover tarefa. Tente novamente.');
      
      // Reverte a alteração local em caso de erro
      if (user) {
        fetchTodos(user.id);
      }
    }
  };

  // Função para atualizar a data de vencimento de uma tarefa
  const updateTodoDueDate = async (id: string, dueDate: Date | null) => {
    try {
      console.log('Atualizando data da tarefa:', id, 'Nova data:', dueDate);
      const { error } = await supabase
        .from('todos')
        .update({ due_date: dueDate ? dueDate.toISOString() : null })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar data da tarefa:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Erro completo ao atualizar data da tarefa:', error);
      throw error;
    }
  };

  const addTodo = async (title: string, description: string, dueDate: Date | null, imageFile?: File) => {
    try {
      // Verificar a sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Erro de sessão:', sessionError || 'Sem sessão ativa');
        toast.error('Você não está autenticado. Faça login novamente.');
        return;
      }
      
      const userId = sessionData.session.user.id;
      console.log('Sessão ativa:', userId);
      
      if (!userId) {
        toast.error('Não foi possível identificar o usuário. Faça login novamente.');
        return;
      }

      console.log('Adicionando tarefa para o usuário:', userId);
      let imageUrl = undefined;

      // Upload da imagem para o Storage, se fornecida
      if (imageFile) {
        try {
          console.log('Fazendo upload da imagem:', imageFile.name, imageFile.type, imageFile.size);
          
          // Verificar se o bucket existe e criar se não existir
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(b => b.name === 'todo-images');

          if (!bucketExists) {
            console.log('Bucket todo-images não existe, tentando criar...');
            try {
              const { data, error } = await supabase.storage.createBucket('todo-images', {
                public: true
              });
              
              if (error) {
                console.error('Erro ao criar bucket:', error);
              } else {
                console.log('Bucket criado com sucesso:', data);
              }
            } catch (createError) {
              console.error('Erro ao criar bucket:', createError);
            }
          }
          
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `todo-${Date.now()}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;

          console.log('Caminho do arquivo:', filePath);
          
          // Primeiro, tente criar a pasta do usuário se ela não existir
          try {
            await supabase.storage
              .from('todo-images')
              .upload(`${userId}/.folder`, new Blob([''], { type: 'text/plain' }), {
                upsert: true
              });
            console.log('Pasta do usuário criada ou já existe');
          } catch (folderError) {
            console.log('Erro ao criar pasta (pode ser ignorado):', folderError);
          }
          
          // Agora faça o upload do arquivo
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('todo-images')
            .upload(filePath, imageFile, {
              cacheControl: '0',
              upsert: true
            });

          if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            
            // Verificar políticas de storage
            console.log('Verificando políticas de storage...');
            
            // Tentar upload sem pasta de usuário
            const simpleFileName = `todo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            console.log('Tentando upload com nome simples:', simpleFileName);
            
            const { data: simpleUploadData, error: simpleUploadError } = await supabase.storage
              .from('todo-images')
              .upload(simpleFileName, imageFile, {
                cacheControl: '0',
                upsert: true
              });
              
            if (simpleUploadError) {
              console.error('Erro no upload simples:', simpleUploadError);
              throw new Error(`Erro ao fazer upload da imagem: ${simpleUploadError.message}`);
            }
            
            // Se o upload simples funcionou, use essa URL
            const { data: simpleUrlData } = supabase.storage
              .from('todo-images')
              .getPublicUrl(simpleFileName);
              
            imageUrl = simpleUrlData.publicUrl;
            console.log('URL da imagem (upload simples):', imageUrl);
          } else {
            // Upload normal funcionou
            const { data: urlData } = supabase.storage
              .from('todo-images')
              .getPublicUrl(filePath);

            imageUrl = urlData.publicUrl;
            console.log('URL da imagem (upload normal):', imageUrl);
          }
        } catch (imageError: any) {
          console.error('Erro completo no processamento da imagem:', imageError);
          toast.error(`Erro ao processar imagem: ${imageError.message}`);
          // Continue sem a imagem
          imageUrl = undefined;
        }
      }

      // Adicionar a tarefa ao banco de dados
      console.log('Adicionando tarefa' + (imageUrl ? ' com imagem' : ' sem imagem'));
      
      // Primeiro, tente o método direto
      const newTodo = {
        title,
        description,
        due_date: dueDate ? dueDate.toISOString() : null,
        completed: false,
        user_id: userId,
        image_url: imageUrl
      };
      
      console.log('Dados da nova tarefa:', newTodo);
      
      // Tente inserir diretamente
      const { data, error } = await supabase
        .from('todos')
        .insert(newTodo)
        .select();

      if (error) {
        console.error('Erro ao inserir tarefa (método direto):', error);
        
        // Se falhar, tente sem a imagem
        if (imageUrl) {
          console.log('Tentando adicionar tarefa sem imagem...');
          const todoWithoutImage = {
            title,
            description,
            due_date: dueDate ? dueDate.toISOString() : null,
            completed: false,
            user_id: userId
          };
          
          const { data: dataWithoutImage, error: errorWithoutImage } = await supabase
            .from('todos')
            .insert(todoWithoutImage)
            .select();
            
          if (errorWithoutImage) {
            console.error('Erro ao inserir tarefa sem imagem:', errorWithoutImage);
            throw errorWithoutImage;
          }
          
          console.log('Tarefa adicionada com sucesso (sem imagem):', dataWithoutImage);
          toast.success('Tarefa adicionada com sucesso, mas sem a imagem.');
          fetchTodos(userId);
          return;
        }
        
        throw error;
      }

      console.log('Tarefa adicionada com sucesso:', data);
      toast.success('Tarefa adicionada com sucesso!');
      
    } catch (error: any) {
      console.error('Erro completo ao adicionar tarefa:', error);
      toast.error(`Erro ao adicionar tarefa: ${error.message}`);
    }
  };

  const editTodo = async (id: string, title: string, description: string, dueDate: Date | null, imageFile?: File | null, keepExistingImage: boolean = true) => {
    try {
      console.log('Editando tarefa:', id, 'Novo título:', title, 'Manter imagem existente:', keepExistingImage);
      
      // Verificar a sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Erro de sessão:', sessionError || 'Sem sessão ativa');
        toast.error('Você não está autenticado. Faça login novamente.');
        return;
      }
      
      const userId = sessionData.session.user.id;
      
      // Buscar a tarefa atual para verificar se pertence ao usuário
      const { data: todoData, error: todoError } = await supabase
        .from('todos')
        .select('*')
        .eq('id', id)
        .single();
        
      if (todoError) {
        console.error('Erro ao buscar tarefa:', todoError);
        throw todoError;
      }
      
      if (todoData.user_id !== userId) {
        throw new Error('Você não tem permissão para editar esta tarefa');
      }
      
      // Preparar os dados para atualização
      const updateData: any = { 
        title,
        description,
        due_date: dueDate ? dueDate.toISOString() : null
      };
      
      // Se tiver uma nova imagem, fazer upload
      if (imageFile) {
        try {
          console.log('Fazendo upload da nova imagem:', imageFile.name);
          
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `todo-edit-${Date.now()}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('todo-images')
            .upload(filePath, imageFile, {
              cacheControl: '0',
              upsert: true
            });
            
          if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            throw uploadError;
          }
          
          const { data: urlData } = supabase.storage
            .from('todo-images')
            .getPublicUrl(filePath);
            
          updateData.image_url = urlData.publicUrl;
          console.log('Nova URL da imagem:', updateData.image_url);
          
          // Se a tarefa já tinha uma imagem, excluir a antiga
          if (todoData.image_url) {
            try {
              // Extrair o caminho do arquivo da URL
              const oldPath = todoData.image_url.split('/').slice(-2).join('/');
              console.log('Tentando excluir imagem antiga:', oldPath);
              
              await supabase.storage
                .from('todo-images')
                .remove([oldPath]);
                
              console.log('Imagem antiga excluída com sucesso');
            } catch (removeError) {
              console.error('Erro ao excluir imagem antiga (não crítico):', removeError);
            }
          }
        } catch (imageError: any) {
          console.error('Erro no processamento da imagem:', imageError);
          toast.error(`Erro ao processar imagem: ${imageError.message}`);
          // Continue sem atualizar a imagem
        }
      } else if (imageFile === null) {
        // Se imageFile for null explicitamente, remover a imagem
        updateData.image_url = null;
        
        // Se a tarefa tinha uma imagem, excluir
        if (todoData.image_url) {
          try {
            const oldPath = todoData.image_url.split('/').slice(-2).join('/');
            console.log('Removendo imagem:', oldPath);
            
            await supabase.storage
              .from('todo-images')
              .remove([oldPath]);
              
            console.log('Imagem excluída com sucesso');
          } catch (removeError) {
            console.error('Erro ao excluir imagem (não crítico):', removeError);
          }
        }
      } else if (imageFile === undefined && !keepExistingImage) {
        // Se imageFile for undefined mas keepExistingImage for false, remover a imagem
        updateData.image_url = null;
        
        // Se a tarefa tinha uma imagem, excluir
        if (todoData.image_url) {
          try {
            const oldPath = todoData.image_url.split('/').slice(-2).join('/');
            console.log('Removendo imagem:', oldPath);
            
            await supabase.storage
              .from('todo-images')
              .remove([oldPath]);
              
            console.log('Imagem excluída com sucesso');
          } catch (removeError) {
            console.error('Erro ao excluir imagem (não crítico):', removeError);
          }
        }
      } else {
        // Se imageFile for undefined e keepExistingImage for true, não alterar a imagem
        console.log('Mantendo a imagem existente');
        // Não incluir image_url no updateData para manter o valor atual
      }
      
      // Atualizar a tarefa
      const { error: updateError } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id);
        
      if (updateError) {
        console.error('Erro ao atualizar tarefa:', updateError);
        throw updateError;
      }
      
      console.log('Tarefa atualizada com sucesso');
      toast.success('Tarefa atualizada com sucesso!');
      
      // Atualizar a lista de tarefas
      fetchTodos(userId);
    } catch (error: any) {
      console.error('Erro completo ao editar tarefa:', error);
      toast.error(`Erro ao editar tarefa: ${error.message}`);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      console.log('Atualizando tarefa:', id, 'Completada:', completed);
      const { error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        throw error;
      }

      // Não exibimos toast aqui quando chamado pelo drag and drop
      // para evitar múltiplas notificações
    } catch (error: any) {
      console.error('Erro completo ao atualizar tarefa:', error);
      throw error; // Propaga o erro para ser tratado pelo chamador
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      console.log('Excluindo tarefa:', id);
      
      // Buscar a tarefa para obter a URL da imagem, se houver
      const { data: todoData, error: todoError } = await supabase
        .from('todos')
        .select('*')
        .eq('id', id)
        .single();
        
      if (todoError) {
        console.error('Erro ao buscar tarefa para exclusão:', todoError);
      } else if (todoData.image_url) {
        // Se a tarefa tem uma imagem, tentar excluí-la
        try {
          // Extrair o caminho do arquivo da URL
          const imagePath = todoData.image_url.split('/').slice(-2).join('/');
          console.log('Tentando excluir imagem:', imagePath);
          
          await supabase.storage
            .from('todo-images')
            .remove([imagePath]);
            
          console.log('Imagem excluída com sucesso');
        } catch (removeError) {
          console.error('Erro ao excluir imagem (não crítico):', removeError);
        }
      }
      
      // Excluir a tarefa
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        throw error;
      }

      toast.success('Tarefa removida com sucesso!');
    } catch (error: any) {
      console.error('Erro completo ao excluir tarefa:', error);
      toast.error(`Erro ao remover tarefa: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quadro de Tarefas</h1>
          <p className="text-gray-600">Gerencie suas tarefas de forma eficiente</p>
        </div>
        
        <div className="mb-8">
          <TodoForm onAddTodo={addTodo} />
        </div>
        
        <div className="mb-8">
          <TodoFilter 
            onFilterChange={setDateFilter}
            onSearchChange={setSearchTerm}
            onDateFilterChange={setDateFilter}
            dateFilter={dateFilter}
          />
        </div>
        
        {/* Botões para alternar entre visualizações */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewType('status')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewType === 'status'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Por Status
            </button>
            <button
              type="button"
              onClick={() => setViewType('dueDate')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewType === 'dueDate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Por Data
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            {viewType === 'status' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl shadow-sm overflow-hidden card-shadow">
                  <div className="bg-blue-600 text-white p-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pendentes ({pendingTodos.length})
                    </h2>
                  </div>
                  <StrictModeDroppable droppableId="pending">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-4 min-h-[200px]"
                      >
                        {pendingTodos.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="font-medium">Nenhuma tarefa pendente</p>
                            <p className="text-sm mt-1">Adicione uma nova tarefa acima</p>
                          </div>
                        ) : (
                          <ul className="space-y-3">
                            {pendingTodos.map((todo, index) => (
                              <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.8 : 1
                                    }}
                                  >
                                    <TodoItem
                                      todo={todo}
                                      onToggle={toggleTodo}
                                      onDelete={deleteTodo}
                                      onEdit={editTodo}
                                      borderColor="border-blue-200"
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </ul>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </StrictModeDroppable>
                </div>
                
                <div className="bg-green-50 rounded-xl shadow-sm overflow-hidden card-shadow">
                  <div className="bg-green-600 text-white p-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Concluídas ({completedTodos.length})
                    </h2>
                  </div>
                  <StrictModeDroppable droppableId="completed">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-4 min-h-[200px]"
                      >
                        {completedTodos.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">Nenhuma tarefa concluída</p>
                            <p className="text-sm mt-1">Arraste tarefas pendentes para cá quando concluí-las</p>
                          </div>
                        ) : (
                          <ul className="space-y-3">
                            {completedTodos.map((todo, index) => (
                              <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.8 : 1
                                    }}
                                  >
                                    <TodoItem
                                      todo={todo}
                                      onToggle={toggleTodo}
                                      onDelete={deleteTodo}
                                      onEdit={editTodo}
                                      borderColor="border-green-200"
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </ul>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </StrictModeDroppable>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(groupedByDueDate)
                  .sort((a, b) => groupedByDueDate[a].order - groupedByDueDate[b].order)
                  .map((groupKey) => {
                    const group = groupedByDueDate[groupKey];
                    const { bgColor, headerColor, borderColor } = getGroupColors(groupKey);
                    
                    const colSpan = 
                      (groupKey === 'today' || groupKey === 'overdue') && Object.keys(groupedByDueDate).length > 2
                        ? 'md:col-span-2 lg:col-span-1' 
                        : '';
                    
                    return (
                      <div 
                        key={groupKey} 
                        className={`rounded-xl shadow-sm overflow-hidden border card-shadow h-full flex flex-col ${colSpan}`}
                        style={{
                          backgroundColor: groupKey === 'overdue' ? '#fef2f2' : 
                                          groupKey === 'today' ? '#fefce8' : 
                                          groupKey === 'tomorrow' ? '#eff6ff' : 
                                          groupKey === 'thisWeek' ? '#eef2ff' : 
                                          groupKey === 'nextWeek' ? '#f5f3ff' : 
                                          groupKey === 'thisMonth' ? '#fdf2f8' : 
                                          groupKey === 'future' ? '#ecfeff' : 
                                          groupKey === 'completed' ? '#f0fdf4' : '#f9fafb',
                          borderColor: groupKey === 'overdue' ? '#fca5a5' : 
                                      groupKey === 'today' ? '#fde68a' : 
                                      groupKey === 'tomorrow' ? '#bfdbfe' : 
                                      groupKey === 'thisWeek' ? '#c7d2fe' : 
                                      groupKey === 'nextWeek' ? '#ddd6fe' : 
                                      groupKey === 'thisMonth' ? '#fbcfe8' : 
                                      groupKey === 'future' ? '#a5f3fc' : 
                                      groupKey === 'completed' ? '#bbf7d0' : '#e5e7eb'
                        }}
                      >
                        <div 
                          className="p-4"
                          style={{
                            backgroundColor: groupKey === 'overdue' ? '#dc2626' : 
                                            groupKey === 'today' ? '#ca8a04' : 
                                            groupKey === 'tomorrow' ? '#2563eb' : 
                                            groupKey === 'thisWeek' ? '#4f46e5' : 
                                            groupKey === 'nextWeek' ? '#7c3aed' : 
                                            groupKey === 'thisMonth' ? '#db2777' : 
                                            groupKey === 'future' ? '#0891b2' : 
                                            groupKey === 'completed' ? '#16a34a' : '#4b5563'
                          }}
                        >
                          <h2 className="text-lg font-semibold flex items-center text-white">
                            {groupKey === 'overdue' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            {groupKey === 'today' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            )}
                            {groupKey === 'tomorrow' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            )}
                            {groupKey === 'completed' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            {group.title} ({group.todos.length})
                          </h2>
                        </div>
                        <StrictModeDroppable droppableId={groupKey}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="p-4 flex-grow overflow-y-auto" 
                              style={{ maxHeight: 'calc(100vh - 300px)' }}
                            >
                              {group.todos.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  <p className="font-medium">Nenhuma tarefa neste período</p>
                                  <p className="text-sm mt-1">Arraste tarefas para cá para definir a data</p>
                                </div>
                              ) : (
                                <ul className="space-y-3">
                                  {group.todos.map((todo, index) => (
                                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            opacity: snapshot.isDragging ? 0.8 : 1
                                          }}
                                        >
                                          <TodoItem
                                            todo={todo}
                                            onToggle={toggleTodo}
                                            onDelete={deleteTodo}
                                            onEdit={editTodo}
                                            borderColor={
                                              groupKey === 'overdue' ? 'border-red-200' : 
                                              groupKey === 'today' ? 'border-yellow-200' : 
                                              groupKey === 'tomorrow' ? 'border-blue-200' : 
                                              groupKey === 'thisWeek' ? 'border-indigo-200' : 
                                              groupKey === 'nextWeek' ? 'border-purple-200' : 
                                              groupKey === 'thisMonth' ? 'border-pink-200' : 
                                              groupKey === 'future' ? 'border-cyan-200' : 
                                              groupKey === 'completed' ? 'border-green-200' : 
                                              'border-gray-200'
                                            }
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                </ul>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </StrictModeDroppable>
                      </div>
                    );
                  })}
              </div>
            )}
          </DragDropContext>
        )}
      </div>
    </div>
  );
} 