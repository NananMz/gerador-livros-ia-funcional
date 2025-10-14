import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import { Inter } from 'next/font/google'

// Configurar fonte Inter do Google Fonts
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: {
    default: 'Gerador de Livros com IA - Crie Livros Completos em Minutos',
    template: '%s | Gerador de Livros IA'
  },
  description: 'Gere livros completos e únicos usando inteligência artificial. Personalize gênero, tamanho e público-alvo. Exporte para PDF, DOCX e TXT gratuitamente.',
  keywords: [
    'gerador de livros',
    'inteligência artificial',
    'IA',
    'escrever livros',
    'criar livros',
    'PDF',
    'DOCX',
    'histórias',
    'contos',
    'escrita criativa',
    'OpenAI',
    'GPT-4'
  ].join(', '),
  authors: [{ name: 'Gerador de Livros IA' }],
  creator: 'Gerador de Livros IA',
  publisher: 'Gerador de Livros IA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://gerador-livros-ia-funcional.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://gerador-livros-ia-funcional.vercel.app',
    siteName: 'Gerador de Livros com IA',
    title: 'Gerador de Livros com IA - Crie Livros Completos em Minutos',
    description: 'Gere livros completos e únicos usando inteligência artificial. Personalize e exporte para PDF, DOCX e TXT.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gerador de Livros com IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gerador de Livros com IA',
    description: 'Crie livros completos em minutos usando IA',
    images: ['/og-image.png'],
    creator: '@geradorlivrosia',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preload para performance */}
        <link
          rel="preload"
          href="/api/generate-book"
          as="fetch"
          crossOrigin="anonymous"
        />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Gerador de Livros com IA",
              "description": "Ferramenta online para gerar livros completos usando inteligência artificial",
              "url": "https://gerador-livros-ia-funcional.vercel.app",
              "applicationCategory": "CreativeApplication",
              "operatingSystem": "All",
              "permissions": "browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL"
              },
              "author": {
                "@type": "Organization",
                "name": "Gerador de Livros IA"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-white min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer simples */}
          <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
            <div className="max-w-6xl mx-auto px-4 text-center">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800 mb-2">📚 Gerador de Livros IA</h3>
                  <p className="text-sm text-gray-600">
                    Criando histórias únicas com inteligência artificial
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                  <a href="/privacy" className="hover:text-blue-600 transition-colors">
                    Privacidade
                  </a>
                  <a href="/terms" className="hover:text-blue-600 transition-colors">
                    Termos
                  </a>
                  <a href="/contact" className="hover:text-blue-600 transition-colors">
                    Contato
                  </a>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} Gerador de Livros IA.<br />
                    Todos os direitos reservados.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  ✨ Desenvolvido com Next.js, Firebase e OpenAI GPT
                </p>
              </div>
            </div>
          </footer>
        </AuthProvider>
        
        {/* Analytics Script (opcional - descomente quando quiser adicionar) */}
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'YOUR_GA_ID');
            `,
          }}
        /> */}
      </body>
    </html>
  )
}
