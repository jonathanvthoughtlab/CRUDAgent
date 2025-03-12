# Configuração do Storage no Supabase

Este guia irá ajudá-lo a configurar corretamente o Storage no Supabase para armazenar avatares e imagens de tarefas.

## 1. Criar buckets no Storage

1. No painel do Supabase, vá para a seção "Storage"
2. Clique em "Create new bucket"
3. Crie dois buckets:
   - `avatars` - para armazenar avatares de usuários
   - `todo-images` - para armazenar imagens de tarefas
4. Para cada bucket, marque a opção "Public bucket" para permitir acesso público às imagens

## 2. Configurar políticas de segurança para o bucket `avatars`

### Política para leitura pública:

1. Vá para o bucket `avatars`
2. Clique na aba "Policies"
3. Clique em "Add Policy"
4. Selecione "Custom Policy"
5. Configure:
   - Nome da política: "Acesso de leitura público para avatares"
   - Permissão: SELECT
   - Usando expressão: `true`
   - Descrição: "Qualquer pessoa pode visualizar avatares"
6. Clique em "Save Policy"

### Política para upload de usuários autenticados:

1. Clique em "Add Policy"
2. Selecione "Custom Policy"
3. Configure:
   - Nome da política: "Usuários podem fazer upload de seus próprios avatares"
   - Permissão: INSERT
   - Usando expressão: `auth.uid() IS NOT NULL`
   - Descrição: "Usuários autenticados podem fazer upload de avatares"
4. Clique em "Save Policy"

### Política para atualização de usuários autenticados:


1. Clique em "Add Policy"
2. Selecione "Custom Policy"
3. Configure:
   - Nome da política: "Usuários podem atualizar seus próprios avatares"
   - Permissão: UPDATE
   - Usando expressão: `auth.uid() IS NOT NULL`
   - Descrição: "Usuários autenticados podem atualizar avatares"
4. Clique em "Save Policy"

### Política para exclusão de usuários autenticados:

1. Clique em "Add Policy"
2. Selecione "Custom Policy"
3. Configure:
   - Nome da política: "Usuários podem excluir seus próprios avatares"
   - Permissão: DELETE
   - Usando expressão: `auth.uid() IS NOT NULL`
   - Descrição: "Usuários autenticados podem excluir avatares"
4. Clique em "Save Policy"

## 3. Configurar políticas de segurança para o bucket `todo-images`

Repita o mesmo processo para o bucket `todo-images`, criando políticas semelhantes.

## 4. Verificar configurações de CORS

1. No painel do Supabase, vá para a seção "Storage"
2. Clique na aba "Policies"
3. Verifique se as configurações de CORS estão corretas:
   - Allowed Origins: `*` (ou o domínio do seu aplicativo)
   - Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`
   - Allowed Headers: `*`
   - Max Age: `86400` (ou outro valor adequado)

## 5. Testar o upload de imagens

1. Volte ao seu aplicativo
2. Tente fazer upload de uma imagem para o avatar
3. Verifique se a imagem é exibida corretamente após o upload

## Solução de problemas comuns

### A imagem não aparece após o upload

1. **Verifique as políticas de segurança**: Certifique-se de que as políticas de SELECT estão configuradas corretamente.
2. **Verifique o cache do navegador**: Às vezes, o navegador armazena em cache as imagens antigas. Tente limpar o cache ou adicionar um parâmetro de consulta à URL da imagem (como `?t=timestamp`).
3. **Verifique a URL da imagem**: Abra o console do navegador e verifique se há erros relacionados ao carregamento da imagem. A URL pode estar incorreta.
4. **Verifique o bucket público**: Certifique-se de que o bucket está configurado como público.

### Erro de permissão ao fazer upload

1. **Verifique as políticas de INSERT**: Certifique-se de que as políticas de INSERT estão configuradas corretamente.
2. **Verifique a autenticação**: Certifique-se de que o usuário está autenticado antes de tentar fazer upload.
3. **Verifique o tamanho do arquivo**: O Supabase tem limites de tamanho para arquivos. Certifique-se de que o arquivo não é muito grande.

### Erro de CORS

1. **Verifique as configurações de CORS**: Certifique-se de que as configurações de CORS permitem solicitações do seu domínio.
2. **Verifique o domínio**: Certifique-se de que está acessando o aplicativo a partir de um domínio permitido. 