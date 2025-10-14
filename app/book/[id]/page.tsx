'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { BookGenerationSpinner } from '@/components/LoadingSpinner'

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

interface EditError {
  type: 'save' | 'network' | 'validation' | 'unknown';
  message: string;
}

export default function EditBookPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<EditError | null>(null)
  const [success, setSuccess] = useState('')

  // Estados para edição
  const [editedBook, setEditedBook] = useState({
    title: '',
    synopsis: '',
    chapters: [] as Array<{ title: string; content: string }>
  })

  useEffect(() => {
    if (user && params.id) {
      loadBook(params.id as string)
    }
  }, [user, params.id])

  const loadBook = (bookId: string) => {
    try {
      setLoading(true)
      const userBooks = JSON.parse(localStorage.getItem(`books_${user?.uid}`) || '[]')
      const foundBook = userBooks.find((b: Book) => b.id === bookId)
      
      if (!foundBook) {
        setError({ type: 'validation', message: 'Livro não encontrado' })
        return
      }

      // Verificar se o livro pertence ao usuário
      if (foundBook.userId !== user?.uid) {
        setError({ type: 'validation', message: 'Você não tem permissão para editar este livro' })
        return
      }

      setBook(foundBook)
      setEditedBook({
        title: foundBook.content.title,
        synopsis: foundBook.content.synopsis,
        chapters: [...foundBook.content.chapters]
      })
    } catch (error) {
      console.error('Erro ao carregar livro:', error)
      setError({ type: 'unknown', message: 'Erro ao carregar livro' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!book || !user) return

    try {
      setSaving(true)
      setError(null)

      // Validar dados
      if (!editedBook.title.trim()) {
        setError({ type: 'validation', message: 'O título é obrigatório' })
        return
      }

      if (!editedBook.synopsis.trim()) {
        setError({ type: 'validation', message: 'A sinopse é obrigatória' })
        return
      }

      // Atualizar livro
      const updatedBook = {
        ...book,
        content: {
          title: editedBook.title,
          synopsis: editedBook.synopsis,
          chapters: editedBook.chapters
        },
        updatedAt: new Date().toISOString()
      }

      // Salvar no localStorage
      const userBooks = JSON.parse(localStorage.getItem(`books_${user.uid}`) || '[]')
      const updatedBooks = userBooks.map((b: Book) => 
        b.id === book.id ? updatedBook : b
      )
      localStorage.setItem(`books_${user.uid}`, JSON.stringify(updatedBooks))

      setSuccess('Livro salvo com sucesso!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('Erro ao salvar livro:', error)
      setError({ type: 'save', message: 'Erro ao salvar alterações' })
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateChapter = async (chapterIndex: number) => {
    if (!book || !user) return

    try {
      setRegenerating(true)
      setError(null)

      const response = await fetch('/api/generate-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Reescreva o capítulo "${editedBook.chapters[chapterIndex].title}" do livro "${editedBook.title}". 
                       Sinopse: ${editedBook.synopsis}
                       Gênero: ${book.config.genre}
                       Público: ${book.config.audience}
                       Mantenha o mesmo título e estilo, mas torne o conteúdo mais envolvente e bem escrito.`,
          size: 'small',
          genre: book.config.genre,
          audience: book.config.audience
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao regenerar capítulo')
      }

      // Atualizar capítulo específico
      const updatedChapters = [...editedBook.chapters]
      if (data.chapters && data.chapters[0]) {
        updatedChapters[chapterIndex] = {
          title: editedBook.chapters[chapterIndex].title, // Manter título original
          content: data.chapters[0].content
        }
        setEditedBook(prev => ({ ...prev, chapters: updatedChapters }))
        setSuccess(`Capítulo "${editedBook.chapters[chapterIndex].title}" regenerado!`)
        setTimeout(() => setSuccess(''), 3000)
      }

    } catch (error) {
      console.error('Erro ao regenerar capítulo:', error)
      setError({ type: 'unknown', message: 'Erro ao regenerar capítulo' })
    } finally {
      setRegenerating(false)
    }
  }

  const handleAddChapter = () => {
    const newChapter = {
      title: `Capítulo ${editedBook.chapters.length + 1}`,
      content: 'Escreva o conteúdo deste novo capítulo...'
    }
    setEditedBook(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }))
  }

  const handleRemoveChapter = (chapterIndex: number) => {
    if (editedBook.chapters.length <= 1) {
      setError({ type: 'validation', message: 'O livro deve ter pelo menos um capítulo' })
      return
    }

    if (confirm('Tem certeza que deseja remover este capítulo?')) {
      const updatedChapters = editedBook.chapters.filter((_, index) => index !== chapterIndex)
      setEditedBook(prev => ({ ...prev, chapters: updatedChapters }))
    }
  }

  const handleChapterTitleChange = (chapterIndex: number, newTitle: string) => {
    const updatedChapters = [...editedBook.chapters]
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      title: newTitle
    }
    setEditedBook(prev => ({ ...prev, chapters: updatedChapters }))
  }

  const handleChapterContentChange = (chapterIndex: number, newContent: string) => {
    const updatedChapters = [...editedBook.chapters]
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      content: newContent
    }
    setEditedBook(prev => ({ ...prev, chapters: updatedChapters }))
  }

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'save': return 'bg-red-100 border-red-400 text-red-700'
      case 'network': return 'bg-blue-100 border-blue-400 text-blue-700'
      case 'validation': return 'bg-yellow-100 border-yellow-400 text-yellow-700'
      default: return 'bg-red-100 border-red-400 text-red-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (error && !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">{error.message}</div>
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

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Livro não encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Editar Livro</h1>
            <p className="text-gray-600">
              Editando: <strong>{book.content.title}</strong>
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/book/${book.id}`)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-200 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                '💾 Salvar'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className={`border-l-4 p-4 mb-6 rounded ${getErrorColor(error.type)}`}>
            <div className="flex items-start">
              <span className="text-xl mr-3">❌</span>
              <div className="flex-1">
                <p className="font-medium">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <span className="text-xl mr-3">✅</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Formulário de Edição */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Livro *
            </label>
            <input
              type="text"
              value={editedBook.title}
              onChange={(e) => setEditedBook(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o título do livro..."
            />
          </div>

          {/* Sinopse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sinopse *
            </label>
            <textarea
              value={editedBook.synopsis}
              onChange={(e) => setEditedBook(prev => ({ ...prev, synopsis: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descreva a sinopse do livro..."
            />
          </div>

          {/* Capítulos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Capítulos ({editedBook.chapters.length})
              </label>
              <button
                onClick={handleAddChapter}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 text-sm"
              >
                + Adicionar Capítulo
              </button>
            </div>

            <div className="space-y-6">
              {editedBook.chapters.map((chapter, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => handleChapterTitleChange(index, e.target.value)}
                      className="text-lg font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1 mr-4"
                      placeholder="Título do capítulo..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRegenerateChapter(index)}
                        disabled={regenerating}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 disabled:opacity-50 transition duration-200 flex items-center"
                        title="Regenerar com IA"
                      >
                        {regenerating ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-1"></div>
                        ) : (
                          '🔄 IA'
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveChapter(index)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition duration-200"
                        title="Remover capítulo"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={chapter.content}
                    onChange={(e) => handleChapterContentChange(index, e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Conteúdo do capítulo..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Informações do Livro */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">📋 Informações do Livro</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Gênero:</span>
                <div className="font-medium">{book.config.genre}</div>
              </div>
              <div>
                <span className="text-gray-600">Público:</span>
                <div className="font-medium">{book.config.audience}</div>
              </div>
              <div>
                <span className="text-gray-600">Tamanho:</span>
                <div className="font-medium">
                  {book.config.size === 'small' ? 'Pequeno' : 
                   book.config.size === 'medium' ? 'Médio' : 'Grande'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Criado em:</span>
                <div className="font-medium">{new Date(book.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push(`/book/${book.id}`)}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-200 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                '💾 Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Spinner para regeneração */}
      {regenerating && <BookGenerationSpinner />}
    </div>
  )
}
