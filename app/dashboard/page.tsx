import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meus Livros</h1>
            <p className="text-gray-600">Gerencie e crie novos livros</p>
          </div>
          <Link 
            href="/create-book"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            + Criar Novo Livro
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Nenhum livro criado ainda.</p>
        </div>
      </div>
    </div>
  )
}
