import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CONFIGURAÇÃO REALISTA PARA GPT-3.5-TURBO PADRÃO (4K TOKENS)
const BOOK_SIZE_CONFIG = {
  pequeno: {
    label: "Pequeno",
    description: "Novela curta",
    pages: "30-50 páginas",
    chapters: 3,
    wordsPerChapter: "600-900 palavras",
    estimatedWords: "2.000-3.000 palavras totais",
    maxTokens: 2500, // SEGURO para 4K
    model: "gpt-3.5-turbo",
    readingTime: "1-2 horas",
    target: "Leitura rápida"
  },
  medio: {
    label: "Médio", 
    description: "Romance padrão",
    pages: "50-80 páginas",
    chapters: 5,
    wordsPerChapter: "800-1.200 palavras",
    estimatedWords: "4.000-6.000 palavras totais",
    maxTokens: 3500, // MÁXIMO SEGURO para 4K
    model: "gpt-3.5-turbo",
    readingTime: "2-3 horas",
    target: "Leitura com desenvolvimento"
  },
  grande: {
    label: "Grande",
    description: "Romance extenso",
    pages: "70-100 páginas", // REDUZIDO para realidade
    chapters: 6,
    wordsPerChapter: "1.000-1.500 palavras",
    estimatedWords: "6.000-9.000 palavras totais",
    maxTokens: 3800, // NO LIMITE do seguro
    model: "gpt-3.5-turbo",
    readingTime: "3-4 horas",
    target: "Leitura detalhada"
  }
};

// Função para gerar livro em partes (para tamanho grande)
async function generateBookInParts(description: string, config: any, openai: OpenAI) {
  console.log(`📚 Gerando livro grande em ${config.chapters} partes...`);
  
  const chapters = [];
  const descriptionSummary = description.substring(0, 1500); // Resumo para caber nos tokens
  
  for (let i = 0; i < config.chapters; i++) {
    console.log(`🔄 Gerando capítulo ${i + 1} de ${config.chapters}...`);
    
    const chapterPrompt = `
## GERAÇÃO DE CAPÍTULO ${i + 1} para LIVRO LONGO

**PREMISSA COMPLETA:**
${descriptionSummary}

**CAPÍTULO ${i + 1} de ${config.chapters}**

Desenvolva APENAS este capítulo com:
- 800-1200 palavras
- Diálogos realistas
- Descrições detalhadas
- Progressão da trama

**FOCO DESTE CAPÍTULO:**
${getChapterFocus(i, config.chapters)}

**INSTRUÇÕES:**
- Seja detalhado mas eficiente em tokens
- Desenvolva personagens e conflitos
- Mantenha coerência com a premissa

**FORMATO (APENAS JSON):**
{
  "title": "Título do Capítulo ${i + 1}",
  "content": "Conteúdo completo aqui..."
}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um escritor especializado em criar capítulos individuais ricos em detalhes."
          },
          {
            role: "user",
            content: chapterPrompt
          }
        ],
        max_tokens: 1200, // Por capítulo
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (content) {
        try {
          const chapterData = JSON.parse(content);
          chapters.push(chapterData);
          console.log(`✅ Capítulo ${i + 1} gerado: ${chapterData.title}`);
        } catch (e) {
          // Fallback se JSON falhar
          chapters.push({
            title: `Capítulo ${i + 1}`,
            content: content
          });
        }
      }
      
      // Pequena pausa entre capítulos
      if (i < config.chapters - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Erro no capítulo ${i + 1}:`, error);
      chapters.push({
        title: `Capítulo ${i + 1}`,
        content: `Conteúdo do capítulo ${i + 1} em desenvolvimento.`
      });
    }
  }
  
  return chapters;
}

function getChapterFocus(chapterIndex: number, totalChapters: number): string {
  const focuses = [
    "Introdução dos personagens e conflito inicial",
    "Desenvolvimento das relações e primeiros desafios", 
    "Aumento da tensão e revelações importantes",
    "Ponto de virada e conflito central",
    "Desenvolvimento do clímax",
    "Resolução e conclusões finais"
  ];
  
  return focuses[chapterIndex] || "Desenvolvimento da narrativa principal";
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 INICIANDO GERAÇÃO COM GPT-3.5-TURBO PADRÃO');
  
  try {
    const { description, size, genre, audience, chapterCount } = await request.json();
    
    console.log('📋 PARÂMETROS:');
    console.log(`   • Tamanho: ${size}`);
    console.log(`   • Gênero: ${genre}`);
    console.log(`   • Capítulos: ${chapterCount}`);

    // Validações
    if (!description || description.length < 20) {
      return NextResponse.json(
        { error: 'Descrição muito curta (mínimo 20 caracteres)' },
        { status: 400 }
      );
    }

    const config = BOOK_SIZE_CONFIG[size as keyof typeof BOOK_SIZE_CONFIG] || BOOK_SIZE_CONFIG.medio;
    const finalChapterCount = chapterCount || config.chapters;

    console.log(`🎯 CONFIGURAÇÃO: ${config.pages} | ${finalChapterCount} capítulos | ${config.maxTokens} tokens`);

    // Para livros grandes, usar geração em partes
    if (size === 'grande' && finalChapterCount > 4) {
      console.log('🔄 Usando geração em partes para otimizar tokens...');
      
      const chapters = await generateBookInParts(description, {
        chapters: finalChapterCount,
        maxTokens: config.maxTokens
      }, openai);

      const bookData = {
        title: "Livro Gerado - Edição Completa",
        synopsis: `Obra completa desenvolvida em ${finalChapterCount} capítulos, baseada na premissa original.`,
        chapters: chapters,
        metadata: {
          estimatedPages: config.pages,
          totalChapters: chapters.length,
          generation: "multi-part-optimized",
          model: "gpt-3.5-turbo",
          maxTokens: config.maxTokens
        }
      };

      console.log(`✅ LIVRO COMPLETO GERADO: ${chapters.length} capítulos`);
      return NextResponse.json(bookData);
    }

    // Para livros pequenos/médios, geração única otimizada
    const optimizedPrompt = `
# CRIAÇÃO DE LIVRO OTIMIZADO (LIMITE 4K TOKENS)

## PREMISSA ORIGINAL:
${description.substring(0, 1200)}

## CONFIGURAÇÃO:
- CAPÍTULOS: ${finalChapterCount}
- PÁGINAS: ${config.pages}
- TOKENS DISPONÍVEIS: ${config.maxTokens}

## INSTRUÇÕES:
Desenvolva cada capítulo sendo:
- ✅ DETALHADO: Com diálogos e descrições
- ✅ EFICIENTE: Otimizado para limite de tokens  
- ✅ COERENTE: Seguindo a premissa original
- ✅ COMPLETO: Narrativa satisfatória

**DICA:** Use descrições ricas mas concisas. Desenvolva diálogos significativos.

FORMATO (APENAS JSON):
{
  "title": "Título Criativo",
  "synopsis": "Sinopse envolvente de 2-3 parágrafos",
  "chapters": [
    {
      "title": "Título Capítulo 1",
      "content": "Conteúdo rico em detalhes mas eficiente em uso de tokens..."
    }
  ]
}
`;

    console.log('🚀 Gerando livro em chamada única otimizada...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um escritor que cria conteúdo rico e detalhado dentro de limites de tokens. Seja criativo mas eficiente."
        },
        {
          role: "user",
          content: optimizedPrompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    let bookData;
    try {
      bookData = JSON.parse(content);
    } catch (e) {
      console.log('❌ Erro no parse JSON, criando estrutura alternativa...');
      bookData = {
        title: "Livro Gerado - " + description.substring(0, 30),
        synopsis: `Narrativa completa baseada na premissa original.`,
        chapters: Array.from({ length: finalChapterCount }, (_, i) => ({
          title: `Capítulo ${i + 1}`,
          content: `Conteúdo desenvolvido para o capítulo ${i + 1}, expandindo a premissa original.`
        }))
      };
    }

    // Estatísticas
    const totalContentLength = bookData.chapters?.reduce((sum: number, chapter: any) => 
      sum + (chapter.content?.length || 0), 0) || 0;

    const estimatedPages = Math.ceil(totalContentLength / 1800);

    console.log('📈 ESTATÍSTICAS:');
    console.log(`   • Título: ${bookData.title}`);
    console.log(`   • Páginas: ~${estimatedPages}`);
    console.log(`   • Capítulos: ${bookData.chapters?.length}`);
    console.log(`   • Caracteres: ${totalContentLength}`);
    console.log(`   • Tokens usados: ${completion.usage?.total_tokens}`);

    // Metadados
    bookData.metadata = {
      model: "gpt-3.5-turbo",
      estimatedPages: estimatedPages,
      totalChapters: bookData.chapters?.length,
      size: config.label,
      tokensUsed: completion.usage?.total_tokens,
      maxTokensConfig: config.maxTokens
    };

    const totalTime = Date.now() - startTime;
    console.log(`🎉 GERAÇÃO CONCLUÍDA em ${totalTime}ms`);

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('💥 ERRO:', error.message);
    
    if (error?.status === 400 && error?.message?.includes('max_tokens')) {
      return NextResponse.json(
        { 
          error: 'Limite de tokens excedido.',
          solution: 'Use tamanho "Pequeno" ou "Médio" para melhor resultado.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro na geração. Tente novamente.' },
      { status: 500 }
    );
  }
}
