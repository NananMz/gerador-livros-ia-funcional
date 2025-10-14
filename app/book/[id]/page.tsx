'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { exportToPDF, exportToDOCX, exportToTXT } from '@/lib/export'
import { ExportSpinner } from '@/components/LoadingSpinner'

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
  updatedAt?: string
}

export default function BookPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadBook()
    }
  }, [user])

  const loadBook = () => {
    try {
      setLoading(true)
      const userBooks = JSON.parse(localStorage.getItem(`books_${user?.uid}`) || '[]')
      const foundBook = userBooks.find((b: Book) => b.id === params.id)
      
      if (!foundBook) {
        setError('Livro não encontrado')
        return
      }

      // Verificar se o livro pertence ao usuário
      if (foundBook.userId !== user?.uid) {
        setError('Você não tem acesso a este livro')
        return
      }

      setBook(foundBook)
    } catch (error) {
      console.error('Erro ao carregar livro:', error)
      setError('Erro ao carregar livro')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!book) return

    try {
      setExporting(format)
      setError('')

      switch (format) {
        case 'pdf':
          await exportToPDF(book)
          break
        case 'docx':
          await exportToDOCX(book)
          break
        case 'txt':
          await exportToTXT(book)
          break
      }

      // Pequeno delay para visualização
      setTimeout(() => setExporting(''), 1000)
      
    } catch (error) {
      console.error(`Erro ao exportar ${format}:`, error)
      setError(`Erro ao exportar ${format.toUpperCase()}`)
    } finally {
      setExporting('')
    }
  }

  const handleEdit = () => {
    router.push(`/book/${book?.id}/edit`)
  }

  const handleDelete = () => {
    if (!book || !user) return

    if (confirm('Tem certeza que deseja excluir este livro? Esta ação não pode ser desfeita.')) {
      try {
        const userBooks = JSON.parse(localStorage.getItem(`books_${user.uid}`) || '[]')
        const updatedBooks = userBooks.filter((b: Book) => b.id !== book.id)
        localStorage.setItem(`books_${user.uid}`, JSON.stringify(updatedBooks))
        router.push('/dashboard')
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

  const getGenreIcon = (genre: string) => {
    const icons: { [key: string]: string } = {
      aventura: '🏔️',
      fantasia: '🐉',
      ficcao: '🚀',
      romance: '💕',
      suspense: '🕵️',
      infantil: '🐻'
    }
    return icons[genre] || '📚'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">{error || 'Livro não encontrado'}</div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header com opções */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{book.content.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>{getGenreIcon(book.config.genre)}</span>
                  <span>{getGenreLabel(book.config.genre)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>👥</span>
                  <span>{book.config.audience}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📖</span>
                  <span>{getSizeLabel(book.config.size)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📅</span>
                  <span>Criado em {new Date(book.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                {book.updatedAt && (
                  <div className="flex items-center space-x-1">
                    <span>✏️</span>
                    <span>Editado em {new Date(book.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Botão de Edição */}
              <button 
                onClick={handleEdit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
              >
                <span className="mr-2">✏️</span>
                Editar
              </button>
              
              {/* Botões de Exportação */}
              <button 
                onClick={() => handleExport('pdf')}
                disabled={!!exporting}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition duration-200 flex items-center"
              >
                {exporting === 'pdf' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ...
                  </>
                ) : (
                  '📄 PDF'
                )}
              </button>
              
              <button 
                onClick={() => handleExport('docx')}
                disabled={!!exporting}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition duration-200 flex items-center"
              >
                {exporting === 'docx' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ...
                  </>
                ) : (
                  '📝 DOCX'
                )}
              </button>
              
              <button 
                onClick={() => handleExport('txt')}
                disabled={!!exporting}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition duration-200 flex items-center"
              >
                {exporting === 'txt' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ...
                  </>
                ) : (
                  '📃 TXT'
                )}
              </button>

              {/* Botão de Exclusão */}
              <button 
                onClick={handleDelete}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 flex items-center"
                title="Excluir livro"
              >
                🗑️
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Conteúdo do livro */}
        <div id="book-content" className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          {/* Descrição original */}
          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">🎯 Descrição Original</h2>
            <p className="text-gray-700 italic">"{book.description}"</p>
          </div>

          {/* Sinopse */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Sinopse</h2>
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {book.content.synopsis}
              </p>
            </div>
          </div>

          {/* Capítulos */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📚 Capítulos</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {book.content.chapters.length} capítulo{book.content.chapters.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-8">
              {book.content.chapters.map((chapter, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {chapter.title}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Capítulo {index + 1}
                    </span>
                  </div>
                  
                  <div className="prose max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {chapter.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estatísticas do Livro */}
          <div className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Estatísticas do Livro</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600 mb-1">{book.content.chapters.length}</div>
                <div className="text-sm text-gray-600">Capítulos</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {book.content.chapters.reduce((total, chapter) => total + chapter.content.length, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Caracteres</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.ceil(book.content.chapters.reduce((total, chapter) => total + chapter.content.length, 0) / 1500)}
                </div>
                <div className="text-sm text-gray-600">Páginas Aprox.</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {getSizeLabel(book.config.size)}
                </div>
                <div className="text-sm text-gray-600">Tamanho</div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação no final */}
        <div className="flex justify-center space-x-4 mt-8">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            ← Voltar ao Dashboard
          </button>
          <button 
            onClick={handleEdit}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
          >
            <span className="mr-2">✏️</span>
            Editar Livro
          </button>
          <button 
            onClick={() => router.push('/create-book')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
          >
            <span className="mr-2">🪄</span>
            Criar Novo Livro
          </button>
        </div>
      </div>

      {/* Loading Spinner para exportação */}
      {exporting && <ExportSpinner format={exporting as 'PDF' | 'DOCX' | 'TXT'} />}
    </div>
  )
}
