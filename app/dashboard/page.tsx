'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl text-gray-600">Carregando...</div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl text-gray-600">Redirecionando...</div>
    </div>
  )

  const books = [
    { id: 1, title: "Aventura na Floresta", date: "2024-01-15", status: "Concluído" },
    { id: 2, title: "O Mistério do Castelo", date: "2024-01-10", status: "Concluído" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meus Livros</h1>
            <p className="text-gray-600">Bem-vindo de volta! 👋</p>
          </div>
          <Link 
            href="/create-book"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            + Criar Novo Livro
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{book.title}</h3>
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>{book.date}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  book.status === 'Concluído' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {book.status}
                </span>
              </div>
              <div className="flex space-x-2">
                <Link 
                  href={`/book/${book.id}`}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition text-center"
                >
                  Ver
                </Link>
                <button className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-200 transition">
                  Exportar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
