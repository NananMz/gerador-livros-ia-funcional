'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface GenerationError {
  type: 'quota' | 'network' | 'api' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
}

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
  const [error, setError] = useState<GenerationError | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const getErrorConfig = (error: any): GenerationError => {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return {
        type: 'quota',
        message: '📊 Limite de uso excedido. Nossos servidores estão ocupados. Tente novamente em 5-10 minutos.',
        retryable: true
      };
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        type: 'network',
        message: '🌐 Erro de conexão. Verifique sua internet e tente novamente.',
        retryable: true
      };
    } else if (errorMessage.includes('API key') || errorMessage.includes('configuration')) {
      return {
        type: 'api',
        message: '⚙️ Erro de configuração do serviço. Estamos trabalhando para resolver.',
        retryable: false
      };
    } else if (errorMessage.includes('validation') || errorMessage.includes('curta')) {
      return {
        type: 'validation',
        message: '📝 Descrição muito curta. Forneça pelo menos 10 caracteres para uma boa história.',
        retryable: false
      };
    } else {
      return {
        type: 'unknown',
        message: '❌ Erro ao gerar livro. Tente novamente com uma descrição diferente ou mais detalhada.',
        retryable: true
      };
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError({
        type: 'validation',
        message: '🔐 Você precisa estar logado para criar um livro',
        retryable: false
      })
      return
    }

    if (formData.description.trim().length < 10) {
      setError({
        type: 'validation',
        message: '📝 Forneça pelo menos 10 caracteres para uma boa história',
        retryable: false
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🚀 Iniciando geração do livro...')

      const response = await fetch('/api/generate-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar livro')
      }

      console.log('✅ Livro gerado com sucesso:', data.title)

      // Criar objeto do livro
      const newBook = {
        id: Date.now().toString(),
        title: data.title,
        description: formData.description,
        config: formData,
        content: data,
        createdAt: new Date().toISOString(),
        userId: user.uid
      }

      // Salvar no localStorage
      const userBooks = JSON.parse(localStorage.getItem(`books_${user.uid}`) || '[]')
      userBooks.push(newBook)
      localStorage.setItem(`books_${user.uid}`, JSON.stringify(userBooks))

      // Resetar contador de tentativas
      setRetryCount(0)

      // Redirecionar para a página do livro
      router.push(`/book/${newBook.id}`)

    } catch (error: any) {
      console.error('❌ Erro na geração:', error)
      
      const errorConfig = getErrorConfig(error)
      setError(errorConfig)
      
      // Incrementar contador de tentativas
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleSubmit(new Event('submit') as any)
  }

  const handleClearError = () => {
    setError(null)
  }

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'quota': return '📊'
      case 'network': return '🌐'
      case 'api': return '⚙️'
      case 'validation': return '📝'
      default: return '❌'
    }
  }

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'quota': return 'bg-orange-100 border-orange-400 text-orange-700'
      case 'network': return 'bg-blue-100 border-blue-400 text-blue-700'
      case 'api': return 'bg-purple-100 border-purple-400 text-purple-700'
      case 'validation': return 'bg-yellow-100 border-yellow-400 text-yellow-700'
      default: return 'bg-red-100 border-red-400 text-red-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Criar Novo Livro</h1>
          <p className="text-gray-600">Descreva o livro que você quer criar</p>
        </div>

        {error && (
          <div className={`border-l-4 p-4 mb-6 rounded ${getErrorColor(error.type)}`}>
            <div className="flex items-start">
              <span className="text-xl mr-3">{getErrorIcon(error.type)}</span>
              <div className="flex-1">
                <p className="font-medium">{error.message}</p>
                {error.retryable && retryCount < 3 && (
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={handleRetry}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition duration-200"
                    >
                      Tentar Novamente
                    </button>
                    <button
                      onClick={handleClearError}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition duration-200"
                    >
                      Fechar
                    </button>
                  </div>
                )}
                {retryCount >= 3 && (
                  <p className="text-sm mt-2 opacity-75">
                    💡 Dica: Tente uma descrição mais curta ou espere alguns minutos.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Livro *
              <span className="text-xs text-gray-500 ml-2">
                {formData.description.length}/10 caracteres mínimos
              </span>
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ex: Crie uma história sobre um dragão que aprende a fazer amigos numa floresta encantada. Inclua personagens interessantes, desafios emocionantes e um final satisfatório..."
              required
              disabled={loading}
              minLength={10}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Mínimo 10 caracteres</span>
              <span className={formData.description.length < 10 ? 'text-red-500' : 'text-green-500'}>
                {formData.description.length} caracteres
              </span>
            </div>
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
            disabled={loading || formData.description.length < 10}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Gerando livro com IA...
              </>
            ) : (
              <>
                <span className="mr-2">🪄</span>
                Gerar Livro com IA
              </>
            )}
          </button>

          {/* Dicas de uso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Dicas para uma boa geração:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Seja específico nos detalhes da história</li>
              <li>• Inclua personagens, cenários e conflitos</li>
              <li>• Mencione o tom desejado (divertido, emocionante, misterioso)</li>
              <li>• Livros maiores podem levar mais tempo para gerar</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}
