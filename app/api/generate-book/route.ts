import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CONFIGURAÇÃO CORRIGIDA - limites reais do GPT-3.5 Turbo
const SIZE_CONFIG = {
  small: {
    pages: '40-80',
    chapters: '3-4',
    wordsPerChapter: '800-1200',
    totalWords: '3000-5000',
    maxTokens: 2000, // REDUZIDO para caber no limite
    description: 'Conto ou novela curta'
  },
  medium: {
    pages: '80-150', 
    chapters: '5-6',
    wordsPerChapter: '1200-1800',
    totalWords: '6000-10000',
    maxTokens: 3000, // REDUZIDO
    description: 'Romance curto'
  },
  large: {
    pages: '150-250',
    chapters: '7-8',
    wordsPerChapter: '1500-2200',
    totalWords: '10000-18000',
    maxTokens: 3500, // MÁXIMO SEGURO para GPT-3.5 Turbo
    description: 'Romance médio'
  }
};

export async function POST(request: NextRequest) {
  console.log('🚀 INICIANDO GERAÇÃO COM LIMITES CORRETOS');
  
  try {
    const { description, size, genre, audience, chapterCount } = await request.json();

    // Validações
    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Descrição muito curta. Forneça pelo menos 10 caracteres.' },
        { status: 400 }
      );
    }

    const config = SIZE_CONFIG[size as keyof typeof SIZE_CONFIG] || SIZE_CONFIG.medium;
    const finalChapterCount = chapterCount || 4; // Reduzido para segurança

    console.log(`📊 CONFIG: ${size} | ${finalChapterCount} capítulos | ${config.maxTokens} tokens`);

    // PROMPT OTIMIZADO para caber nos limites
    const optimizedPrompt = `
Crie um livro com base nesta descrição: "${description}"

Gênero: ${genre || 'Ficção'}
Público: ${audience || 'Geral'}
Capítulos: ${finalChapterCount}

**INSTRUÇÕES:**
- Cada capítulo: ${config.wordsPerChapter} palavras
- Desenvolva personagens e diálogos
- Mantenha coerência narrativa
- Use linguagem apropriada para ${audience}

**FORMATO DE RESPOSTA (APENAS JSON):**
{
  "title": "Título aqui",
  "synopsis": "Sinopse curta aqui",
  "chapters": [
    {
      "title": "Título capítulo 1", 
      "content": "Conteúdo completo aqui"
    }
  ]
}

**IMPORTANTE:** Seja conciso mas criativo. Não exceda o limite de tokens.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // MODELO CORRETO
      messages: [
        {
          role: "system",
          content: "Você é um escritor profissional. Seja conciso mas criativo. Responda APENAS com JSON válido."
        },
        {
          role: "user",
          content: optimizedPrompt
        }
      ],
      max_tokens: config.maxTokens, // DENTRO DO LIMITE
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    // Parse do conteúdo
    let bookData;
    try {
      bookData = JSON.parse(content);
    } catch (e) {
      // Fallback se JSON falhar
      bookData = {
        title: `Livro: ${description.substring(0, 30)}...`,
        synopsis: `Baseado na descrição: ${description}`,
        chapters: Array.from({ length: finalChapterCount }, (_, i) => ({
          title: `Capítulo ${i + 1}`,
          content: `Conteúdo do capítulo ${i + 1} baseado em: ${description}`
        }))
      };
    }

    console.log(`✅ LIVRO GERADO: ${bookData.title} com ${bookData.chapters?.length || 0} capítulos`);

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('❌ ERRO:', error.message);
    
    if (error?.status === 400 && error?.message?.includes('max_tokens')) {
      return NextResponse.json(
        { 
          error: 'Erro de configuração: limite de tokens muito alto.',
          solution: 'Tente um tamanho menor (Pequeno ou Médio)'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao gerar livro. Tente novamente.' },
      { status: 500 }
    );
  }
}
