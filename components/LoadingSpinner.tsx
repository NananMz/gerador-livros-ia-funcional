'use client'

import { useEffect, useState } from 'react'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red'
  text?: string
  overlay?: boolean
  fullScreen?: boolean
  className?: string
}

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  text,
  overlay = false,
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const [show, setShow] = useState(false)

  // Delay para evitar flash rápido de loading
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  const sizeClasses = {
    xs: 'h-3 w-3 border-2',
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-400',
    green: 'border-green-600',
    red: 'border-red-600'
  }

  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 border-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}></div>
  )

  // Spinner com texto
  const spinnerWithText = text ? (
    <div className="flex flex-col items-center justify-center space-y-3">
      {spinner}
      <p className={`text-sm ${
        color === 'white' ? 'text-white' : 
        color === 'gray' ? 'text-gray-600' : 
        `text-${color}-600`
      }`}>
        {text}
      </p>
    </div>
  ) : spinner

  // Overlay version
  if (overlay) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        fullScreen ? 'min-h-screen' : ''
      }`}>
        <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center space-y-3 min-w-[120px]">
          {spinner}
          {text && <p className="text-gray-700 text-sm">{text}</p>}
        </div>
      </div>
    )
  }

  // Full screen version
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          {spinner}
          {text && <p className="text-gray-600 mt-3">{text}</p>}
        </div>
      </div>
    )
  }

  return spinnerWithText
}

// Spinner específico para geração de livros
export function BookGenerationSpinner() {
  const [currentTip, setCurrentTip] = useState(0)
  
  const tips = [
    "Preparando a criatividade da IA...",
    "Criando personagens cativantes...",
    "Desenvolvendo a trama principal...",
    "Escrevendo diálogos emocionantes...",
    "Revisando os capítulos...",
    "Preparando o livro final..."
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-4">
        {/* Logo/Ícone animado */}
        <div className="relative mb-6">
          <div className="animate-bounce text-4xl mb-2">📚</div>
          <div className="absolute -inset-4 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        </div>
        
        {/* Spinner principal */}
        <div className="flex justify-center mb-4">
          <LoadingSpinner size="lg" color="blue" />
        </div>
        
        {/* Texto dinâmico */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Gerando seu livro...</h3>
          <p className="text-gray-600 text-sm min-h-[40px] flex items-center justify-center">
            {tips[currentTip]}
          </p>
        </div>
        
        {/* Barra de progresso simulada */}
        <div className="mt-6 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${((currentTip + 1) / tips.length) * 100}%`
            }}
          ></div>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          Isso pode levar de 15 a 30 segundos
        </p>
      </div>
    </div>
  )
}

// Spinner para exportação
export function ExportSpinner({ format }: { format: 'PDF' | 'DOCX' | 'TXT' }) {
  const formatIcons = {
    PDF: '📄',
    DOCX: '📝', 
    TXT: '📃'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg text-center min-w-[140px]">
        <div className="text-3xl mb-2 animate-bounce">
          {formatIcons[format]}
        </div>
        <LoadingSpinner size="md" color="blue" />
        <p className="text-gray-700 mt-3 font-medium">
          Gerando {format}...
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Preparando download
        </p>
      </div>
    </div>
  )
}

// Spinner para dashboard
export function DashboardSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <LoadingSpinner size="lg" color="blue" />
      <div className="text-center">
        <p className="text-gray-600 font-medium">Carregando seus livros</p>
        <p className="text-sm text-gray-500 mt-1">Buscando suas histórias...</p>
      </div>
    </div>
  )
}

// Spinner inline para botões
export function ButtonSpinner({ 
  size = 'sm',
  color = 'white'
}: {
  size?: 'xs' | 'sm' | 'md'
  color?: 'white' | 'blue' | 'gray'
}) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} color={color} />
      <span>Processando...</span>
    </div>
  )
}
