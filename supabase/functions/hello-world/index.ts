// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/deploy/docs/projects

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar um cliente Supabase para acessar o banco de dados
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default when deployed to Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exposed by default when deployed to Supabase
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Obter o usuário atual
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    // Verificar se o usuário está autenticado
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Obter as tarefas do usuário
    const { data: todos, error } = await supabaseClient
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Retornar as tarefas
    return new Response(
      JSON.stringify({ 
        message: 'Olá do Supabase Edge Functions!',
        user: user.email,
        todos_count: todos.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 