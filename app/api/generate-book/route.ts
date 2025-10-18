import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CONFIGURAÇÃO REALISTA PARA 4096 TOKENS MÁXIMO
const BOOK_SIZE_CONFIG = {
  pequeno: {
    label: "Pequeno",
    description: "Conto ou novela curta",
    pages: "20-30 páginas",
    chapters: 3,
    wordsPerChapter: "400-600 palavras",
    maxTokens: 2000, // SEGURO para 4K
    readingTime: "30-60 minutos"
  },
  medio: {
    label: "Médio", 
    description: "Romance curto",
    pages: "30-50 páginas",
    chapters: 4,
    wordsPerChapter: "500-800 palavras",
    maxTokens: 3000, // BOM para 4K
    readingTime: "1-2 horas"
  },
  grande: {
    label: "Grande",
    description: "Romance médio",
    pages: "40-60 páginas",
    chapters: 5,
    wordsPerChapter: "600-900 palavras", 
    maxTokens: 3500, // MÁXIMO SEGURO para 4K
    readingTime: "2-3 horas"
  }
};

// Função para testar modelo com limite REAL
async function testModelWithRealLimit(model: string): Promise<{available: boolean, maxTokens: number}> {
  console.log(`🔍 Testando modelo: ${model}`);
  
  try {
    // Teste com limite conservador primeiro
    const testCompletion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: "Responda 'OK'" }],
      max_tokens: 5,
    });
    
    console.log(`✅ ${model} disponível`);
    
    // DEFINIR LIMITE MÁXIMO REAL baseado no modelo
    let maxTokens;
    if (model.includes('16k') || model.includes('32k')) {
      maxTokens = 4096; // SEU PROJETO SÓ PERMITE 4K MESMO EM MODELOS 16K!
    } else if (model.includes('gpt-4')) {
      maxTokens = 4096; // GPT-4 também tem limite de 4K no seu projeto
    } else {
      maxTokens = 4096; // MÁXIMO ABSOLUTO para seu projeto
    }
    
    // Limitar ainda mais para segurança
    const safeMaxTokens = Math.min(maxTokens, 3500);
    
    console.log(`   • Limite real: ${maxTokens} tokens`);
    console.log(`   • Limite seguro: ${safeMaxTokens} tokens`);
    
    return { available: true, maxTokens: safeMaxTokens };
    
  } catch (error: any) {
    console.log(`❌ ${model} não disponível: ${error.message}`);
    return { available: false, maxTokens: 0 };
  }
}

// Função para descobrir modelo funcionando
async function findWorkingModel(): Promise<{model: string, maxTokens: number}> {
  console.log('🚀 Procurando modelo funcionando...');
  
  const modelsToTry = [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k", 
    "gpt-4",
    "gpt-4-turbo"
  ];
  
  for (const model of modelsToTry) {
    const result = await testModelWithRealLimit(model);
    if (result.available) {
      return { model, maxTokens: result.maxTokens };
    }
  }
  
  throw new Error('Nenhum modelo GPT está disponível. Verifique as permissões do projeto.');
}

export async function POST(request: NextRequest) {
  console.log('🎯 INICIANDO GERAÇÃO COM LIMITE REAL DE 4K TOKENS');
  
  try {
    const { description, size, genre, audience, chapterCount } = await request.json();
    
    // Encontrar modelo que funciona
    const { model, maxTokens } = await findWorkingModel();
    
    console.log(`✅ MODELO SELECIONADO: ${model}`);
    console.log(`🔐 LIMITE MÁXIMO: ${maxTokens} tokens`);
    
    const config = BOOK_SIZE_CONFIG[size as keyof typeof BOOK_SIZE_CONFIG] || BOOK_SIZE_CONFIG.medio;
    const finalChapterCount = Math.min(chapterCount || config.chapters, 5);
    
    console.log(`📊 CONFIG: ${config.pages} | ${finalChapterCount} capítulos | ${maxTokens} tokens`);
    
    // Prompt ULTRA OTIMIZADO para 4K tokens
    const ultraOptimizedPrompt = `
CRIE UM LIVRO baseado nesta descrição:
"${description.substring(0, 800)}"

CONFIGURAÇÃO:
- Capítulos: ${finalChapterCount}
- Gênero: ${genre || "Ficção"}
- Público: ${audience || "Adulto"}

INSTRUÇÕES (SEJA CONCISO MAS DETALHADO):
- Cada capítulo: 2-3 parágrafos substanciais
- Inclua diálogos breves mas significativos
- Desenvolva a trama progressivamente
- Mantenha coerência com a premissa

FORMATO (APENAS JSON):
{
  "title": "Título",
  "synopsis": "Sinopse curta de 1-2 parágrafos",
  "chapters": [
    {
      "title": "Título Capítulo 1", 
      "content": "Conteúdo com 2-3 parágrafos ricos em detalhes..."
    }
  ]
}

IMPORTANTE: Otimize o uso de tokens! Seja detalhado mas eficiente.
`;

    console.log('📝 Gerando livro otimizado...');
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "Você é um escritor que cria conteúdo rico dentro de limites rigorosos de tokens. Seja detalhado mas conciso."
        },
        {
          role: "user",
          content: ultraOptimizedPrompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    console.log('✅ Conteúdo recebido');
    
    // Processar resposta
    let bookData;
    try {
      bookData = JSON.parse(content);
    } catch (e) {
      console.log('⚠️ Criando estrutura fallback...');
      bookData = {
        title: "Livro Gerado",
        synopsis: `Baseado na premissa: ${description.substring(0, 100)}...`,
        chapters: Array.from({ length: finalChapterCount }, (_, i) => ({
          title: `Capítulo ${i + 1}`,
          content: `Desenvolvimento da narrativa no capítulo ${i + 1}. ${description.substring(0, 80)}...`
        }))
      };
    }

    // Estatísticas
    const totalContentLength = bookData.chapters?.reduce((sum: number, chapter: any) => 
      sum + (chapter.content?.length || 0), 0) || 0;

    console.log('📈 ESTATÍSTICAS FINAIS:');
    console.log(`   • Modelo: ${model}`);
    console.log(`   • Tokens usados: ${completion.usage?.total_tokens}`);
    console.log(`   • Capítulos: ${bookData.chapters?.length}`);
    console.log(`   • Caracteres: ${totalContentLength}`);
    console.log(`   • Páginas: ~${Math.ceil(totalContentLength / 1500)}`);

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('💥 ERRO:', error.message);
    
    if (error?.status === 400 && error?.message?.includes('max_tokens')) {
      return NextResponse.json(
        { 
          error: 'Limite de tokens excedido.',
          solution: 'Seu projeto OpenAI tem limite máximo de 4096 tokens. Use tamanhos "Pequeno" ou "Médio".'
        },
        { status: 400 }
      );
    }
    
    if (error?.status === 403) {
      return NextResponse.json(
        { 
          error: 'Acesso negado aos modelos GPT.',
          solution: 'Seu projeto está restrito. Crie uma nova API Key ou verifique permissões.'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erro na geração. Tente tamanho "Pequeno".' },
      { status: 500 }
    );
  }
}
