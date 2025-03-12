# Configuração de Políticas de Segurança (RLS) no Supabase

Este guia irá ajudá-lo a configurar corretamente as políticas de segurança no nível de linha (Row-Level Security - RLS) no Supabase para permitir que os usuários possam adicionar, visualizar, atualizar e excluir suas próprias tarefas.

## O que é Row-Level Security (RLS)?

RLS é um recurso de segurança do PostgreSQL que permite controlar quais linhas de uma tabela podem ser acessadas por quais usuários. No Supabase, isso é usado para garantir que os usuários só possam acessar seus próprios dados.

## Erro Comum: "new row violates row-level security policy"

Este erro ocorre quando você tenta inserir uma nova linha em uma tabela que tem RLS habilitado, mas não há uma política que permita a inserção para o usuário atual.

## Como Configurar RLS para a Tabela `todos`

Siga estes passos no painel do Supabase:

1. Acesse o painel do Supabase e vá para a seção "Table Editor"
2. Selecione a tabela `todos`
3. Clique na aba "Policies"

### 1. Habilitar RLS na Tabela

Se ainda não estiver habilitado:

1. Clique no botão "Enable RLS"
2. Confirme a ação

### 2. Criar Política para Inserção (INSERT)

1. Clique em "Add Policy"
2. Selecione "Create a policy from scratch"
3. Configure:
   - Nome da política: "Usuários podem inserir suas próprias tarefas"
   - Operação: INSERT
   - Usando expressão: `auth.uid() = user_id`
   - Descrição: "Permite que usuários criem tarefas associadas ao seu ID"
4. Clique em "Save Policy"

### 3. Criar Política para Seleção (SELECT)

1. Clique em "Add Policy"
2. Selecione "Create a policy from scratch"
3. Configure:
   - Nome da política: "Usuários podem visualizar suas próprias tarefas"
   - Operação: SELECT
   - Usando expressão: `auth.uid() = user_id`
   - Descrição: "Permite que usuários vejam apenas suas próprias tarefas"
4. Clique em "Save Policy"

### 4. Criar Política para Atualização (UPDATE)

1. Clique em "Add Policy"
2. Selecione "Create a policy from scratch"
3. Configure:
   - Nome da política: "Usuários podem atualizar suas próprias tarefas"
   - Operação: UPDATE
   - Usando expressão: `auth.uid() = user_id`
   - Descrição: "Permite que usuários atualizem apenas suas próprias tarefas"
4. Clique em "Save Policy"

### 5. Criar Política para Exclusão (DELETE)

1. Clique em "Add Policy"
2. Selecione "Create a policy from scratch"
3. Configure:
   - Nome da política: "Usuários podem excluir suas próprias tarefas"
   - Operação: DELETE
   - Usando expressão: `auth.uid() = user_id`
   - Descrição: "Permite que usuários excluam apenas suas próprias tarefas"
4. Clique em "Save Policy"

## Verificar a Estrutura da Tabela

Certifique-se de que a tabela `todos` tenha a coluna `user_id` configurada corretamente:

1. Vá para a seção "Table Editor"
2. Selecione a tabela `todos`
3. Verifique se a coluna `user_id` existe e é do tipo UUID
4. Verifique se há uma restrição de chave estrangeira que referencia a tabela `auth.users`

Se a coluna não existir ou não estiver configurada corretamente, você pode alterá-la:

```sql
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) NOT NULL;
```

## Testar as Políticas

Após configurar as políticas, você deve ser capaz de:

1. Inserir novas tarefas
2. Visualizar suas próprias tarefas
3. Atualizar suas próprias tarefas
4. Excluir suas próprias tarefas

Se ainda houver problemas, verifique:

1. Se o usuário está autenticado
2. Se o valor de `user_id` está sendo definido corretamente ao inserir uma nova tarefa
3. Se as políticas estão usando a expressão correta

## Solução de Problemas Comuns

### Erro ao Inserir: "new row violates row-level security policy"

Causas possíveis:
- A política de INSERT não existe ou está incorreta
- O valor de `user_id` não está sendo definido ou está sendo definido incorretamente
- O usuário não está autenticado

### Erro ao Selecionar: "no rows returned by a query that expected to return at least one row"

Causas possíveis:
- A política de SELECT não existe ou está incorreta
- O usuário não tem tarefas associadas ao seu ID

### Erro ao Atualizar/Excluir: "update/delete on table violates row-level security policy"

Causas possíveis:
- A política de UPDATE/DELETE não existe ou está incorreta
- O usuário está tentando atualizar/excluir uma tarefa que não pertence a ele 
