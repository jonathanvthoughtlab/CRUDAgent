# CRUDIA - CRUD com Inteligência Artificial

Um aplicativo moderno de gerenciamento de tarefas com recursos de IA, construído com Next.js, Tailwind CSS e Supabase.

## Funcionalidades

- Autenticação de usuários (login, registro, recuperação de senha)
- Perfil de usuário com foto e informações pessoais
- Criação, edição e exclusão de tarefas
- Organização de tarefas por status (pendentes/concluídas)
- Recursos de IA para sugestão de tarefas e priorização
- Análise de sentimento em descrições de tarefas
- Resumo automático de tarefas longas
- Arrastar e soltar para mover tarefas entre colunas
- Editor de texto rico para descrições de tarefas
- Upload de imagens para tarefas e perfil
- Atualizações em tempo real

## Tecnologias

- [Next.js 14](https://nextjs.org/)
- [React 18](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/) (Autenticação, Banco de Dados e Storage)
- [TipTap](https://tiptap.dev/) (Editor de texto rico)
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) (Arrastar e soltar)
- [Date-fns](https://date-fns.org/) (Manipulação de datas)
- [React Hot Toast](https://react-hot-toast.com/) (Notificações)
- [OpenAI API](https://openai.com/) (Recursos de IA)

## Configuração do Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/jonathanvthoughtlab/CRUDIA.git
cd CRUDIA
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
OPENAI_API_KEY=sua-chave-da-api-openai
```

### 4. Executar o projeto em desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000).

### 5. Construir para produção

```bash
npm run build
npm start
```

## Configuração do Banco de Dados

### 1. Criar um projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/) e crie uma conta
2. Crie um novo projeto
3. Anote a URL e a chave anônima do projeto (serão usadas nas variáveis de ambiente)

### 2. Configurar as tabelas e políticas

Execute os seguintes scripts SQL no Editor SQL do Supabase:

#### Tabela de Tarefas

```sql
-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  ai_summary TEXT,
  ai_sentiment TEXT,
  ai_priority INTEGER
);

-- Criar políticas de segurança para a tabela de tarefas
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam suas próprias tarefas
CREATE POLICY "Usuários podem ver suas próprias tarefas"
  ON todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram suas próprias tarefas
CREATE POLICY "Usuários podem inserir suas próprias tarefas"
  ON todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias tarefas
CREATE POLICY "Usuários podem atualizar suas próprias tarefas"
  ON todos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam suas próprias tarefas
CREATE POLICY "Usuários podem excluir suas próprias tarefas"
  ON todos
  FOR DELETE
  USING (auth.uid() = user_id);
```

#### Configuração de Storage

Consulte o arquivo `SUPABASE_STORAGE_SETUP.md` para instruções detalhadas sobre como configurar o storage no Supabase para este projeto.

## Estrutura do Projeto

- `app/` - Páginas e rotas da aplicação (Next.js App Router)
- `components/` - Componentes reutilizáveis
- `lib/` - Funções utilitárias e configurações
- `public/` - Arquivos estáticos
- `supabase/` - Scripts SQL para configuração do banco de dados

## Licença

Este projeto está licenciado sob a licença MIT. 