'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function CreateBookPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    description: '',
    size: 'medium',
    genre: 'aventura',
    audience: 'jovens'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Você precisa estar logado para criar um livro')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/generate-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar livro')
      }

      const bookData = await response.json()
      
      // Salvar livro no localStorage temporariamente
      const newBook = {
        id: Date.now().toString(),
        title: bookData.title,
        description: formData.description,
        config: formData,
        content: bookData,
        createdAt: new Date().toISOString(),
        userId: user.uid
      }

      // Salvar no localStorage (depois migraremos para Firestore)
      const userBooks = JSON.parse(localStorage.getItem(`books_${user.uid}`) || '[]')
      userBooks.push(newBook)
      localStorage.setItem(`books_${user.uid}`, JSON.stringify(userBooks))

      // Redirecionar para a página do livro
      router.push(`/book/${newBook.id}`)

    } catch (error) {
      console.error('Erro:', error)
      setError('Erro ao gerar livro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Criar Novo Livro</h1>
        <p className="text-gray-600 mb-8">Descreva o livro que você quer criar</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Livro *
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Crie uma história sobre um dragão que aprende a fazer amigos numa floresta encantada. Inclua personagens interessantes e uma jornada emocionante..."
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho
              </label>
              <select 
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="small">Pequeno (3-4 capítulos)</option>
                <option value="medium">Médio (5-6 capítulos)</option>
                <option value="large">Grande (7-8 capítulos)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gênero
              </label>
              <select 
                value={formData.genre}
                onChange={(e) => setFormData({...formData, genre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="aventura">Aventura</option>
                <option value="fantasia">Fantasia</option>
                <option value="ficcao">Ficção Científica</option>
                <option value="romance">Romance</option>
                <option value="suspense">Suspense</option>
                <option value="infantil">Infantil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Público
              </label>
              <select 
                value={formData.audience}
                onChange={(e) => setFormData({...formData, audience: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="criancas">Crianças</option>
                <option value="jovens">Jovens</option>
                <option value="adultos">Adultos</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-200 font-medium text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Gerando livro com IA...
              </>
            ) : (
              '🪄 Gerar Livro com IA'
            )}
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Seja específico na descrição. Quanto mais detalhes você fornecer, melhor será o livro gerado!
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
