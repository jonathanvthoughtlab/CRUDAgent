-- Função para adicionar uma tarefa contornando o RLS
CREATE OR REPLACE FUNCTION public.add_todo(
  p_title TEXT,
  p_user_id UUID,
  p_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função
AS $$
DECLARE
  v_todo_id UUID;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Inserir a tarefa
  INSERT INTO public.todos (
    title,
    completed,
    user_id,
    image_url,
    created_at
  ) VALUES (
    p_title,
    FALSE,
    p_user_id,
    p_image_url,
    NOW()
  ) RETURNING id INTO v_todo_id;

  RETURN v_todo_id;
END;
$$; 