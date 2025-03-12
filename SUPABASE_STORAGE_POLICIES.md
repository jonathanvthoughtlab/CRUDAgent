# Configuração de Políticas de Storage no Supabase

Este guia contém instruções específicas para configurar corretamente as políticas de Storage no Supabase, permitindo o upload de imagens para tarefas.

## Problema: Erro ao fazer upload de imagens

Se você está enfrentando erros ao tentar adicionar uma tarefa com imagem, provavelmente há um problema com as políticas de segurança do bucket `todo-images` no Supabase Storage.

## Solução: Configurar o Bucket e Políticas Corretamente

### 1. Criar o Bucket (se ainda não existir)

1. Acesse o painel do Supabase e vá para a seção "Storage"
2. Clique em "New Bucket"
3. Configure:
   - Nome: `todo-images`
   - Tipo: Public (marque a opção "Public bucket")
   - Descrição: "Armazenamento de imagens para tarefas"
4. Clique em "Create bucket"

### 2. Configurar Políticas de Acesso para o Bucket

#### Política para Leitura Pública

1. Vá para o bucket `todo-images`
2. Clique na aba "Policies"
3. Clique em "Add Policy"
4. Selecione "Custom Policy"
5. Configure:
   - Nome da política: "Acesso de leitura público para imagens de tarefas"
   - Permissão: SELECT
   - Usando expressão: `true`
   - Descrição: "Qualquer pessoa pode visualizar imagens de tarefas"
6. Clique em "Save Policy"

#### Política para Upload (mais permissiva)

1. Clique em "Add Policy"
2. Selecione "Custom Policy"
3. Configure:
   - Nome da política: "Permitir upload de imagens para usuários autenticados"
   - Permissão: INSERT
   - Usando expressão: `auth.role() = 'authenticated'`
   - Descrição: "Usuários autenticados podem fazer upload de imagens"
4. Clique em "Save Policy"

#### Política para Atualização

1. Clique em "Add Policy"
2. Selecione "Custom Policy"
3. Configure:
   - Nome da política: "Permitir atualização de imagens para usuários autenticados"
   - Permissão: UPDATE
   - Usando expressão: `auth.role() = 'authenticated'`
   - Descrição: "Usuários autenticados podem atualizar imagens"
4. Clique em "Save Policy"

#### Política para Exclusão

1. Clique em "Add Policy"
2. Selecione "Custom Policy"
3. Configure:
   - Nome da política: "Permitir exclusão de imagens para usuários autenticados"
   - Permissão: DELETE
   - Usando expressão: `auth.role() = 'authenticated'`
   - Descrição: "Usuários autenticados podem excluir imagens"
4. Clique em "Save Policy"

### 3. Configurar Políticas Mais Específicas (Opcional)

Se você quiser restringir o acesso para que os usuários só possam gerenciar suas próprias imagens, use estas expressões:

#### Para Upload
```sql
auth.uid() = (storage.foldername(name))[1]::uuid
```

#### Para Atualização/Exclusão
```sql
auth.uid() = (storage.foldername(name))[1]::uuid
```

### 4. Executar SQL Direto para Configurar Políticas

Se as etapas acima não resolverem, execute o seguinte SQL no Editor SQL do Supabase:

```sql
-- Remover políticas existentes para o bucket todo-images
BEGIN;

-- Criar política para leitura pública
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Acesso de leitura público para imagens de tarefas',
  'todo-images',
  'true',
  'SELECT',
  'authenticated'
) ON CONFLICT (name, bucket_id, action) DO UPDATE SET definition = 'true';

-- Criar política para upload
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Permitir upload de imagens para usuários autenticados',
  'todo-images',
  'auth.role() = ''authenticated''',
  'INSERT',
  'authenticated'
) ON CONFLICT (name, bucket_id, action) DO UPDATE SET definition = 'auth.role() = ''authenticated''';

-- Criar política para atualização
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Permitir atualização de imagens para usuários autenticados',
  'todo-images',
  'auth.role() = ''authenticated''',
  'UPDATE',
  'authenticated'
) ON CONFLICT (name, bucket_id, action) DO UPDATE SET definition = 'auth.role() = ''authenticated''';

-- Criar política para exclusão
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Permitir exclusão de imagens para usuários autenticados',
  'todo-images',
  'auth.role() = ''authenticated''',
  'DELETE',
  'authenticated'
) ON CONFLICT (name, bucket_id, action) DO UPDATE SET definition = 'auth.role() = ''authenticated''';

COMMIT;
```

## Verificação

Após configurar as políticas:

1. Tente adicionar uma tarefa com imagem
2. Verifique o console do navegador para ver se há erros relacionados ao Storage
3. Verifique se a imagem foi carregada no bucket `todo-images` no painel do Supabase

## Solução de Problemas Comuns

### Erro 400: "The resource already exists"

Este erro ocorre quando você tenta fazer upload de um arquivo com um nome que já existe. Certifique-se de que o nome do arquivo seja único, por exemplo, adicionando um timestamp.

### Erro 403: "Unauthorized"

Este erro ocorre quando as políticas de segurança não permitem o upload. Verifique:
- Se o usuário está autenticado
- Se as políticas de INSERT estão configuradas corretamente
- Se o token de autenticação está sendo enviado corretamente

### Erro 404: "The specified bucket does not exist"

Este erro ocorre quando o bucket `todo-images` não existe. Crie o bucket conforme as instruções acima.

### Erro 500: Internal Server Error

Este erro pode ocorrer por diversos motivos. Verifique os logs do Supabase para mais detalhes. 