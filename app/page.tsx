import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold mb-8">
          Bem-vindo ao CRUD com Next.js e Supabase
        </h1>
        <p className="text-xl mb-8">
          Uma aplicação completa com autenticação, armazenamento, banco de dados em tempo real e edge functions.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="bg-white hover:bg-gray-100 text-primary-600 border border-primary-600 font-bold py-2 px-4 rounded"
          >
            Registrar
          </Link>
        </div>
      </div>
    </main>
  );
}