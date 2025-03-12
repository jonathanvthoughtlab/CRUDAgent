# CRUD - Aplicação de Gerenciamento de Tarefas

Uma aplicação moderna de gerenciamento de tarefas (to-do list) que permite criar, ler, atualizar e excluir tarefas, construída com Next.js e Supabase.

## Funcionalidades

- Autenticação de usuários
- Criação de novas tarefas
- Visualização de tarefas existentes
- Atualização de tarefas
- Exclusão de tarefas
- Marcação de tarefas como concluídas

## Tecnologias Utilizadas

- **Frontend e Backend**: Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS

## Como Executar o Projeto Localmente

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Conta no Supabase
- Git

### Passos para Execução

1. **Clone o repositório**

```bash
git clone https://github.com/jonathanvthoughtlab/CRUDAgent.git
cd CRUDAgent
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

4. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
# ou
yarn dev
```

5. **Acesse a aplicação**

Abra seu navegador e acesse `http://localhost:3000`

## Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com/)
2. Crie um novo projeto
3. Copie a URL e a chave anônima do projeto para as variáveis de ambiente
4. Configure a tabela de tarefas no SQL Editor:

```sql
-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver suas próprias tarefas"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias tarefas"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias tarefas"
  ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias tarefas"
  ON tasks
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Estrutura do Projeto

```
CRUDAgent/
├── app/                # Páginas e rotas da aplicação (Next.js App Router)
├── components/         # Componentes reutilizáveis
├── lib/                # Funções utilitárias e configurações
│   └── supabase.js     # Cliente Supabase
├── public/             # Arquivos estáticos
├── styles/             # Estilos globais
├── .env.local          # Variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo Git
├── next.config.js      # Configuração do Next.js
├── package.json        # Dependências e scripts
├── tailwind.config.js  # Configuração do Tailwind CSS
└── README.md           # Documentação do projeto
```

## Comandos Úteis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm start` - Inicia o servidor em modo de produção
- `npm lint` - Executa o linter para verificar erros de código

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. 