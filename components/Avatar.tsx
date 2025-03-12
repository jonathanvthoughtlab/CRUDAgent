'use client';

import { useState, useEffect } from 'react';

interface AvatarProps {
  url: string | null;
  email: string;
  size?: number;
}

export default function Avatar({ url, email, size = 20 }: AvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(url);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Atualizar a URL quando a prop mudar
  useEffect(() => {
    setImageUrl(url);
    setError(false);
    setLoading(true);
  }, [url]);

  // Função para tentar novamente carregar a imagem
  const retryLoading = () => {
    if (url) {
      setError(false);
      setLoading(true);
      // Adicionar um timestamp para evitar cache
      setImageUrl(`${url}?retry=${Date.now()}`);
    }
  };

  return (
    <div 
      className={`w-${size} h-${size} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {imageUrl && !error ? (
        <>
          <img
            src={imageUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={() => {
              console.error('Erro ao carregar avatar:', imageUrl);
              setError(true);
              setLoading(false);
            }}
            onLoad={() => {
              console.log('Avatar carregado com sucesso:', imageUrl);
              setLoading(false);
            }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {error ? (
            <button 
              onClick={retryLoading}
              className="text-xs text-red-500 hover:text-red-700"
              title="Clique para tentar novamente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          ) : (
            <span className="text-xl text-gray-400">
              {email?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
      )}
    </div>
  );
} 