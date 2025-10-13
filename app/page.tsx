import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          📚 Gerador de Livros com IA
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Crie livros completos em minutos
        </p>
        <div className="space-x-4">
          <Link 
            href="/dashboard"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium text-lg"
          >
            Começar
          </Link>
        </div>
      </div>
    </div>
  )
}
