-- Script para adicionar colunas faltantes à tabela profiles

-- Verificar e adicionar a coluna 'name' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT;
        RAISE NOTICE 'Coluna name adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna name já existe';
    END IF;
END $$;

-- Verificar e adicionar a coluna 'bio' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
        RAISE NOTICE 'Coluna bio adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna bio já existe';
    END IF;
END $$;

-- Verificar e adicionar a coluna 'website' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
        RAISE NOTICE 'Coluna website adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna website já existe';
    END IF;
END $$;

-- Verificar e adicionar a coluna 'avatar_url' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Coluna avatar_url adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna avatar_url já existe';
    END IF;
END $$;

-- Verificar e adicionar a coluna 'updated_at' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        RAISE NOTICE 'Coluna updated_at adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;
END $$;

-- Verificar se o bucket de avatares existe e criar se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    -- Criar bucket para avatares
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
    RAISE NOTICE 'Bucket avatars criado com sucesso';
  ELSE
    RAISE NOTICE 'Bucket avatars já existe';
  END IF;
END $$;

-- Verificar e criar políticas para o bucket de avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Acesso público para avatares'
  ) THEN
    -- Permitir acesso público para leitura
    CREATE POLICY "Acesso público para avatares"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
    RAISE NOTICE 'Política de acesso público para avatares criada com sucesso';
  ELSE
    RAISE NOTICE 'Política de acesso público para avatares já existe';
  END IF;
END $$;

-- Verificar e criar política para upload de avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Usuários podem fazer upload de seus próprios avatares'
  ) THEN
    -- Permitir que usuários façam upload de seus próprios avatares
    CREATE POLICY "Usuários podem fazer upload de seus próprios avatares"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    RAISE NOTICE 'Política de upload de avatares criada com sucesso';
  ELSE
    RAISE NOTICE 'Política de upload de avatares já existe';
  END IF;
END $$;

-- Verificar e criar política para atualização de avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Usuários podem atualizar seus próprios avatares'
  ) THEN
    -- Permitir que usuários atualizem seus próprios avatares
    CREATE POLICY "Usuários podem atualizar seus próprios avatares"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    RAISE NOTICE 'Política de atualização de avatares criada com sucesso';
  ELSE
    RAISE NOTICE 'Política de atualização de avatares já existe';
  END IF;
END $$;

-- Verificar e criar política para exclusão de avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Usuários podem excluir seus próprios avatares'
  ) THEN
    -- Permitir que usuários excluam seus próprios avatares
    CREATE POLICY "Usuários podem excluir seus próprios avatares"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    RAISE NOTICE 'Política de exclusão de avatares criada com sucesso';
  ELSE
    RAISE NOTICE 'Política de exclusão de avatares já existe';
  END IF;
END $$; 