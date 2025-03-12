'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          throw new Error('Usuário não encontrado');
        }
        
        setUser(userData.user);
        
        // Buscar avatar do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userData.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        if (profileData?.avatar_url) {
          console.log('Avatar URL do banco:', profileData.avatar_url);
          // Adicionar timestamp para evitar cache
          const url = `${profileData.avatar_url}?t=${new Date().getTime()}`;
          console.log('Avatar URL com timestamp:', url);
          setAvatarUrl(url);
        } else {
          console.log('Nenhum avatar encontrado no perfil');
          setAvatarUrl(null);
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error);
        toast.error(`Erro ao carregar perfil: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [refreshKey]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para fazer upload.');
      }
      
      const file = event.target.files[0];
      console.log('Arquivo selecionado:', file.name, file.type, file.size);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('Caminho do arquivo:', filePath);
      
      // Upload do arquivo para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '0' 
        });
      
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload bem-sucedido:', uploadData);
      
      // Obter a URL pública do avatar
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const newAvatarUrl = data.publicUrl;
      console.log('Nova URL do avatar:', newAvatarUrl);
      
      // Atualizar o perfil do usuário com a URL do avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        });
      
      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw updateError;
      }
      
      console.log('Perfil atualizado com sucesso');
      
      // Atualizar a URL do avatar com um timestamp para evitar cache
      const urlWithTimestamp = `${newAvatarUrl}?t=${new Date().getTime()}`;
      console.log('URL com timestamp:', urlWithTimestamp);
      setAvatarUrl(urlWithTimestamp);
      
      // Forçar a atualização do componente
      setRefreshKey(prev => prev + 1);
      
      toast.success('Avatar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast.error(`Erro ao fazer upload do avatar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Função para verificar manualmente a URL da imagem
  const checkImageUrl = () => {
    if (avatarUrl) {
      fetch(avatarUrl)
        .then(response => {
          console.log('Resposta da verificação da imagem:', response.status, response.statusText);
          if (!response.ok) {
            toast.error(`Erro ao carregar imagem: ${response.status} ${response.statusText}`);
          } else {
            toast.success('URL da imagem está acessível!');
          }
        })
        .catch(error => {
          console.error('Erro ao verificar URL da imagem:', error);
          toast.error(`Erro ao verificar URL da imagem: ${error.message}`);
        });
    }
  };

  // Função para recarregar a imagem
  const reloadImage = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Recarregando imagem...');
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1 p-2 bg-white text-black border border-gray-300 rounded-md">
            {user?.email}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Avatar</label>
          <div className="mt-1 flex items-center space-x-4">
            <Avatar url={avatarUrl} email={user?.email || ''} size={80} />
            
            <div className="flex flex-col space-y-2">
              <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                {uploading ? 'Enviando...' : 'Alterar Avatar'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </label>
              
              {avatarUrl && (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={reloadImage}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      Recarregar
                    </button>
                    <button
                      onClick={checkImageUrl}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      Verificar URL
                    </button>
                  </div>
                  
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500">Mostrar URL da imagem</summary>
                    <p className="mt-1 text-gray-500 break-all">
                      {avatarUrl}
                    </p>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900">Informações da Conta</h2>
          <p className="mt-1 text-sm text-gray-500">
            ID: <span className="text-black">{user?.id}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Criado em: <span className="text-black">{new Date(user?.created_at).toLocaleDateString('pt-BR')}</span>
          </p>
        </div>
      </div>
    </div>
  );
} 