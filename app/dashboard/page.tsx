'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { exportToTXT } from '@/lib/export'

interface Book {
  id: string
  title: string
  description: string
  config: {
    size: string
    genre: string
    audience: string
  }
  content: {
    title: string
    synopsis: string
    chapters: Array<{
      title: string
      content: string
    }>
  }
  createdAt: string
  userId: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportingId, setExportingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadUserBooks()
    }
  }, [user])

  const loadUserBooks = () => {
    try {
      setLoading(true)
      const userBooks = JSON.parse(localStorage.getItem(`books_${user!.uid}`) || '[]')
      // Ordenar por data de criação (mais recente primeiro)
      userBooks.sort((a: Book, b: Book) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setBooks(userBooks)
    } catch (error) {
      console.error('Erro ao carregar livros:', error)
      setError('Erro ao carregar livros')
    } finally {
      setLoading(false)
    }
  }

  const handleExportTXT = async (book: Book) => {
    try {
      setExportingId(book.id)
      setError('')
      await exportToTXT(book)
    } catch (error) {
      console.error('Erro ao exportar livro:', error)
      setError('Erro ao exportar livro')
    } finally {
      setExportingId(null)
    }
  }

  const handleDeleteBook = (bookId: string) => {
    if (confirm('Tem certeza que deseja excluir este livro?')) {
      try {
        const userBooks = JSON.parse(localStorage.getItem(`books_${user!.uid}`) || '[]')
        const updatedBooks = userBooks.filter((book: Book) => book.id !== bookId)
        localStorage.setItem(`books_${user!.uid}`, JSON.stringify(updatedBooks))
        setBooks(updatedBooks)
      } catch (error) {
        console.error('Erro ao excluir livro:', error)
        setError('Erro ao excluir livro')
      }
    }
  }

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Pequeno'
      case 'medium': return 'Médio'
      case 'large': return 'Grande'
      default: return size
    }
  }

  const getGenreLabel = (genre: string) => {
    const genres: { [key: string]: string } = {
      aventura: 'Aventura',
      fantasia: 'Fantasia',
      ficcao: 'Ficção Científica',
      romance: 'Romance',
      suspense: 'Suspense',
      infantil: 'Infantil'
    }
    return genres[genre] || genre
  }

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl text-gray-600">Redirecionando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Meus Livros</h1>
            <p className="text-gray-600">Bem-vindo de volta! 👋</p>
          </div>
          <Link 
            href="/create-book"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center"
          >
            <span className="text-lg mr-2">+</span>
            Criar Novo Livro
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Carregando seus livros...</div>
            </div>
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum livro criado ainda</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Comece criando seu primeiro livro com inteligência artificial! É rápido, fácil e divertido.
            </p>
            <Link 
              href="/create-book"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium inline-flex items-center"
            >
              <span className="text-lg mr-2">🪄</span>
              Criar Primeiro Livro
            </Link>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-sm text-gray-600">Rápido</p>
                <p className="text-xs text-gray-500">Gere em segundos</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">🎨</div>
                <p className="text-sm text-gray-600">Personalizado</p>
                <p className="text-xs text-gray-500">Escolha gênero e tamanho</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">📥</div>
                <p className="text-sm text-gray-600">Download</p>
                <p className="text-xs text-gray-500">Baixe em PDF/DOCX</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{books.length}</div>
                <div className="text-sm text-gray-600">Total de Livros</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {books.filter(book => book.config.size === 'large').length}
                </div>
                <div className="text-sm text-gray-600">Livros Grandes</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {new Set(books.map(book => book.config.genre)).size}
                </div>
                <div className="text-sm text-gray-600">Gêneros Diferentes</div>
              </div>
            </div>

            {/* Grid de Livros */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {books.map((book) => (
                <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 flex-1 mr-2">
                      {book.content.title}
                    </h3>
                    <button 
                      onClick={() => handleDeleteBook(book.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200 flex-shrink-0"
                      title="Excluir livro"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Descrição */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {book.description}
                  </p>

                  {/* Metadados */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      book.config.size === 'small' ? 'bg-green-100 text-green-800' :
                      book.config.size === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getSizeLabel(book.config.size)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {getGenreLabel(book.config.genre)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      {book.config.audience}
                    </span>
                  </div>

                  {/* Informações adicionais */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div className="flex justify-between">
                      <span>Criado em {new Date(book.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span>{book.content.chapters.length} capítulos</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex space-x-2">
                    <Link 
                      href={`/book/${book.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition duration-200 text-center flex items-center justify-center"
                    >
                      <span className="mr-1">👁️</span>
                      Ver
                    </Link>
                    <button 
                      onClick={() => handleExportTXT(book)}
                      disabled={exportingId === book.id}
                      className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-200 disabled:opacity-50 transition duration-200 flex items-center justify-center"
                    >
                      {exportingId === book.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-1"></div>
                          ...
                        </>
                      ) : (
                        <>
                          <span className="mr-1">📥</span>
                          TXT
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer do Dashboard */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                {books.length} {books.length === 1 ? 'livro' : 'livros'} criados • 
                Última atualização: {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
