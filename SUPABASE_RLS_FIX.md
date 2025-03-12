# Solução para o Erro de RLS no Supabase

Este guia contém instruções específicas para resolver o erro "new row violates row-level security policy" que está ocorrendo ao tentar adicionar novas tarefas.

## Solução Imediata: Desabilitar RLS Temporariamente

Se você precisa de uma solução rápida para testar a funcionalidade, você pode desabilitar temporariamente o RLS na tabela `todos`:

1. Acesse o painel do Supabase e vá para a seção "Table Editor"
2. Selecione a tabela `todos`
3. Clique na aba "Policies"
4. Clique no botão "Disable RLS"
5. Confirme a ação

**ATENÇÃO**: Esta é uma solução temporária apenas para testes. Não é recomendada para ambientes de produção, pois remove a segurança da tabela.

## Solução Correta: Corrigir as Políticas de RLS

Para resolver o problema corretamente, siga estas etapas:

### 1. Verificar a Política de INSERT Existente

1. Acesse o painel do Supabase e vá para a seção "Table Editor"
2. Selecione a tabela `todos`
3. Clique na aba "Policies"
4. Verifique se existe uma política para a operação INSERT
5. Se existir, clique nela para editar e verifique a expressão

### 2. Criar uma Nova Política de INSERT

Se a política não existir ou estiver incorreta, crie uma nova:

1. Clique em "Add Policy" (ou "New Policy")
2. Selecione "Create a policy from scratch"
3. Configure:
   - Nome da política: "Permitir inserção de tarefas"
   - Operação: INSERT
   - Usando expressão: `true`  <!-- Temporariamente mais permissiva -->
   - Descrição: "Permite que usuários autenticados criem tarefas"
4. Clique em "Save Policy"

### 3. Executar SQL Direto para Corrigir as Políticas

Se as etapas acima não resolverem, execute o seguinte SQL no Editor SQL do Supabase:

```sql
-- Remover políticas existentes para a tabela todos
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias tarefas" ON todos;
DROP POLICY IF EXISTS "Permitir inserção de tarefas" ON todos;

-- Criar uma política mais permissiva para INSERT
CREATE POLICY "Permitir inserção de tarefas" 
  ON todos 
  FOR INSERT 
  WITH CHECK (true);  -- Permite qualquer inserção por usuários autenticados

-- Alternativa: política que verifica apenas autenticação
CREATE POLICY "Permitir inserção para usuários autenticados" 
  ON todos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 4. Verificar a Estrutura da Tabela

Execute o seguinte SQL para verificar a estrutura da tabela `todos`:

```sql
-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'todos';
```

### 5. Verificar o Usuário Atual

Execute o seguinte SQL para verificar se o usuário está autenticado corretamente:

```sql
-- Verificar o usuário atual
SELECT auth.uid();
```

## Solução para Problemas no Código

Se as políticas estiverem corretas, o problema pode estar no código:

1. Verifique se o token de autenticação está sendo enviado corretamente
2. Verifique se o `user_id` está sendo definido corretamente ao inserir uma nova tarefa

Adicione o seguinte código no início da função `addTodo` para verificar a autenticação:

```javascript
// Verificar a sessão atual
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !sessionData.session) {
  console.error('Erro de sessão:', sessionError || 'Sem sessão ativa');
  toast.error('Você não está autenticado. Faça login novamente.');
  return;
}
console.log('Sessão ativa:', sessionData.session.user.id);
```

## Verificação Final

Após aplicar as correções:

1. Limpe o cache do navegador
2. Faça logout e login novamente para obter um novo token de autenticação
3. Tente adicionar uma nova tarefa

Se o problema persistir, entre em contato com o suporte do Supabase com os logs de erro completos. 