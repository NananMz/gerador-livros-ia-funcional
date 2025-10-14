'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

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
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const userBooks = JSON.parse(localStorage.getItem(`books_${user.uid}`) || '[]')
      const foundBook = userBooks.find((b: Book) => b.id === params.id)
      setBook(foundBook || null)
      setLoading(false)
    }
  }, [user, params.id])

  const handleExportPDF = () => {
    alert('Funcionalidade de PDF em desenvolvimento!')
  }

  const handleExportDOCX = () => {
    alert('Funcionalidade de DOCX em desenvolvimento!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Livro não encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{book.content.title}</h1>
            <p className="text-gray-600">Criado em {new Date(book.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleExportPDF}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center"
            >
              📄 PDF
            </button>
            <button 
              onClick={handleExportDOCX}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center"
            >
              📝 DOCX
            </button>
          </div>
        </div>

        {/* Sinopse */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sinopse</h2>
          <div className="bg-gray-50 rounded-lg p-6">
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
    </div>
  )
}
