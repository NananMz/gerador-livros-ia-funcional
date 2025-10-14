'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { exportToPDF, exportToDOCX, exportToTXT } from '@/lib/export'

interface Book {
  id: string
  title: string
  description: string
  config: any
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
          await exportToPDF(book, 'book-content')
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
      <div className="max-w-4xl mx-auto">
        {/* Header com opções de exportação */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{book.content.title}</h1>
              <p className="text-gray-600">
                Criado em {new Date(book.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleExport('pdf')}
                disabled={!!exporting}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition duration-200 flex items-center"
              >
                {exporting === 'pdf' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
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
                    Gerando...
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
                    Gerando...
                  </>
                ) : (
                  '📃 TXT'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Conteúdo do livro (usado para PDF) */}
        <div id="book-content" className="bg-white rounded-xl shadow-sm p-8">
          {/* Descrição original */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Descrição Original</h2>
            <p className="text-gray-700">{book.description}</p>
          </div>

          {/* Sinopse */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sinopse</h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {book.content.synopsis}
              </p>
            </div>
          </div>

          {/* Capítulos */}
          <div className="space-y-8">
            {book.content.chapters.map((chapter, index) => (
              <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {chapter.title}
                </h2>
                <div className="prose max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {chapter.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de voltar */}
        <div className="text-center mt-8">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
