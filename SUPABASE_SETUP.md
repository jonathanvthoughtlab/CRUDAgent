# Guia de Configuração do Supabase

Este guia irá ajudá-lo a configurar o Supabase para este projeto CRUD.

## 1. Criar uma conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e clique em "Start your project"
2. Faça login com GitHub ou Google, ou crie uma nova conta
3. Após o login, clique em "New Project"

## 2. Criar um novo projeto

1. Escolha uma organização (ou crie uma nova)
2. Dê um nome ao seu projeto
3. Defina uma senha para o banco de dados (guarde-a em um local seguro)
4. Escolha a região mais próxima de você
5. Clique em "Create new project"
6. Aguarde a criação do projeto (pode levar alguns minutos)

## 3. Configurar o banco de dados

1. No painel do Supabase, vá para a seção "SQL Editor"
2. Clique em "New Query"
3. Copie e cole o conteúdo do arquivo `supabase/schema.sql` deste projeto
4. Clique em "Run" para executar o script SQL

## 4. Configurar autenticação

1. No painel do Supabase, vá para a seção "Authentication" > "Providers"
2. Verifique se o "Email" está habilitado
3. Opcionalmente, você pode configurar outros provedores como Google, GitHub, etc.
4. Em "Authentication" > "URL Configuration", configure as URLs do seu aplicativo:
   - Site URL: `http://localhost:3000` (para desenvolvimento)
   - Redirect URLs: `http://localhost:3000/dashboard`

## 5. Configurar Storage

1. No painel do Supabase, vá para a seção "Storage"
2. Clique em "Create new bucket"
3. Crie dois buckets:
   - `avatars` - para armazenar avatares de usuários
   - `todo-images` - para armazenar imagens de tarefas
4. Para cada bucket, vá para a aba "Policies" e adicione as seguintes políticas:

### Para o bucket `avatars`:

**Política para leitura pública:**
- Nome: "Acesso de leitura público para avatares"
- Tipo de política: SELECT
- Definição: `true`
- Descrição: "Qualquer pessoa pode visualizar avatares"

**Política para upload de usuários autenticados:**
- Nome: "Usuários podem fazer upload de seus próprios avatares"
- Tipo de política: INSERT
- Definição: `(bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid)`
- Descrição: "Usuários só podem fazer upload em sua própria pasta"

**Política para atualização de usuários autenticados:**
- Nome: "Usuários podem atualizar seus próprios avatares"
- Tipo de política: UPDATE
- Definição: `(bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid)`
- Descrição: "Usuários só podem atualizar arquivos em sua própria pasta"

### Para o bucket `todo-images`:

Configure políticas semelhantes às do bucket `avatars`.

## 6. Configurar Edge Functions

1. Instale a CLI do Supabase:
   ```bash
   npm install -g supabase
   ```

2. Faça login na CLI:
   ```bash
   supabase login
   ```

3. Inicialize o Supabase no seu projeto:
   ```bash
   supabase init
   ```

4. Vincule seu projeto local ao projeto do Supabase:
   ```bash
   supabase link --project-ref SEU_ID_DO_PROJETO
   ```
   (Substitua SEU_ID_DO_PROJETO pelo ID do seu projeto no Supabase)

5. Implante a função Edge:
   ```bash
   supabase functions deploy hello-world
   ```

## 7. Obter as credenciais do Supabase

1. No painel do Supabase, vá para a seção "Project Settings" > "API"
2. Copie a "URL" e a "anon key"
3. Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
   ```
   (Substitua pelos valores copiados)

## 8. Habilitar Realtime

1. No painel do Supabase, vá para a seção "Database" > "Replication"
2. Na aba "Realtime", habilite a publicação "supabase_realtime"
3. Certifique-se de que a tabela "todos" está selecionada

## Pronto!

Seu projeto Supabase está configurado e pronto para ser usado com a aplicação Next.js. 