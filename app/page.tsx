import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          📚 Gerador de Livros com IA
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Crie livros completos em minutos usando inteligência artificial
        </p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link 
            href="/auth/login"
            className="block sm:inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium text-lg"
          >
            Entrar
          </Link>
          <Link 
            href="/auth/signup"
            className="block sm:inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition duration-200 font-medium text-lg"
          >
            Cadastrar
          </Link>
          <Link 
            href="/dashboard"
            className="block sm:inline-block bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition duration-200 font-medium text-lg"
          >
            Ver Demo
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="font-semibold text-lg mb-2">IA Avançada</h3>
            <p className="text-gray-600">Geramos livros completos usando GPT-4</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-4">📄</div>
            <h3 className="font-semibold text-lg mb-2">Exporte em PDF</h3>
            <p className="text-gray-600">Baixe seus livros em múltiplos formatos</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Rápido e Fácil</h3>
            <p className="text-gray-600">Crie um livro em menos de 5 minutos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
