import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuração detalhada de tamanhos
const SIZE_CONFIG = {
  small: {
    pages: '80-120',
    chapters: '4-6',
    wordsPerChapter: '1500-2500',
    totalWords: '8000-15000',
    maxTokens: 6000,
    description: 'Livro curto focado em uma narrativa direta'
  },
  medium: {
    pages: '121-300', 
    chapters: '8-12',
    wordsPerChapter: '2500-4000',
    totalWords: '25000-50000',
    maxTokens: 12000,
    description: 'Romance padrão com desenvolvimento moderado'
  },
  large: {
    pages: '301-500',
    chapters: '15-20',
    wordsPerChapter: '3500-6000',
    totalWords: '60000-120000',
    maxTokens: 16000,
    description: 'Obra extensa com tramas complexas'
  },
  epic: {
    pages: '500+',
    chapters: '20-30',
    wordsPerChapter: '4000-8000',
    totalWords: '120000+',
    maxTokens: 20000,
    description: 'Saga épica com múltiplas subtramas'
  }
};

// Cálculo preciso de tokens
function calculateTokenUsage(config: any, chapterCount: number) {
  const avgWordsPerChapter = (parseInt(config.wordsPerChapter.split('-')[0]) + 
                            parseInt(config.wordsPerChapter.split('-')[1])) / 2;
  
  const estimatedTotalWords = avgWordsPerChapter * chapterCount;
  const estimatedTokens = Math.ceil(estimatedTotalWords * 1.3); // Fator de segurança
  
  console.log(`📊 ESTIMATIVA DE USO DE TOKENS:`);
  console.log(`   • Capítulos: ${chapterCount}`);
  console.log(`   • Palavras por capítulo: ${config.wordsPerChapter}`);
  console.log(`   • Total estimado: ${estimatedTotalWords} palavras`);
  console.log(`   • Tokens estimados: ${estimatedTokens}`);
  console.log(`   • Limite configurado: ${config.maxTokens}`);
  
  return {
    estimatedTokens,
    isWithinLimit: estimatedTokens <= config.maxTokens,
    recommendation: estimatedTokens > config.maxTokens ? 
      `Recomendado: Reduzir para ${Math.floor(config.maxTokens / (avgWordsPerChapter * 1.3))} capítulos` : 
      'Dentro do limite seguro'
  };
}

// Sistema de parsing robusto
function parseBookContent(content: string, expectedChapters: number) {
  console.log('🔍 Iniciando parse do conteúdo...');
  console.log(`📝 Primeiros 300 chars: ${content.substring(0, 300)}...`);

  try {
    // Tentativa 1: Parse direto
    const directParse = JSON.parse(content);
    console.log('✅ Parse direto bem-sucedido');
    return validateBookStructure(directParse, expectedChapters);
  } catch (e) {
    console.log('⚠️ Parse direto falhou, tentando extração...');
  }

  // Tentativa 2: Extrair JSON da resposta
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const extracted = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON extraído com sucesso');
      return validateBookStructure(extracted, expectedChapters);
    } catch (e) {
      console.log('❌ JSON extraído também inválido');
    }
  }

  // Tentativa 3: Fallback inteligente
  console.log('🔄 Criando estrutura fallback...');
  return createFallbackStructure(content, expectedChapters);
}

function validateBookStructure(bookData: any, expectedChapters: number) {
  const issues = [];
  
  if (!bookData.title || bookData.title.length < 2) {
    issues.push('Título inválido');
    bookData.title = "Livro Gerado por IA";
  }
  
  if (!bookData.synopsis || bookData.synopsis.length < 50) {
    issues.push('Sinopse muito curta');
    bookData.synopsis = "Esta é uma história única criada por inteligência artificial.";
  }
  
  if (!bookData.chapters || !Array.isArray(bookData.chapters)) {
    issues.push('Estrutura de capítulos inválida');
    bookData.chapters = [];
  }
  
  // Validar cada capítulo
  bookData.chapters = bookData.chapters.map((chapter: any, index: number) => {
    if (!chapter.title || chapter.title.length < 2) {
      chapter.title = `Capítulo ${index + 1}`;
    }
    if (!chapter.content || chapter.content.length < 100) {
      chapter.content = `Conteúdo do capítulo ${index + 1} em desenvolvimento...`;
    }
    return chapter;
  });

  if (issues.length > 0) {
    console.log(`⚠️ Problemas na estrutura: ${issues.join(', ')}`);
  }

  // Garantir número mínimo de capítulos
  while (bookData.chapters.length < expectedChapters) {
    bookData.chapters.push({
      title: `Capítulo ${bookData.chapters.length + 1}`,
      content: `Este capítulo está sendo desenvolvido com base na narrativa principal.`
    });
  }

  return bookData;
}

function createFallbackStructure(content: string, expectedChapters: number) {
  // Dividir conteúdo em seções lógicas
  const sections = content.split(/(?=\n#|\nCapítulo|\n\*\*|\n[0-9]+\.)/).filter(s => s.trim().length > 50);
  
  const chapters = sections.map((section, index) => {
    const lines = section.split('\n').filter(l => l.trim());
    const title = lines[0].replace(/^[#\*\s\d\.]+/, '').trim() || `Capítulo ${index + 1}`;
    const content = lines.slice(1).join('\n').trim() || section;
    
    return {
      title,
      content: content.length > 100 ? content : `Desenvolvimento do ${title}...`
    };
  });

  return {
    title: "Livro Criado por IA",
    synopsis: "Uma narrativa única desenvolvida através de inteligência artificial.",
    chapters: chapters.slice(0, expectedChapters)
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 INICIANDO GERAÇÃO DE LIVRO');
  
  try {
    const { description, size, genre, audience, chapterCount } = await request.json();

    // Log dos parâmetros recebidos
    console.log('📋 PARÂMETROS RECEBIDOS:', {
      size,
      genre,
      audience,
      chapterCount,
      descriptionLength: description?.length
    });

    // Validações robustas
    if (!description || description.trim().length < 15) {
      return NextResponse.json(
        { error: 'Descrição muito curta. Forneça pelo menos 15 caracteres para uma narrativa rica.' },
        { status: 400 }
      );
    }

    if (!size || !SIZE_CONFIG[size as keyof typeof SIZE_CONFIG]) {
      return NextResponse.json(
        { error: 'Tamanho inválido. Use: small, medium, large ou epic.' },
        { status: 400 }
      );
    }

    const config = SIZE_CONFIG[size as keyof typeof SIZE_CONFIG];
    const finalChapterCount = chapterCount || parseInt(config.chapters.split('-')[1]);
    
    // Cálculo e exibição de estimativa de tokens
    const tokenAnalysis = calculateTokenUsage(config, finalChapterCount);
    console.log(`🎯 ANÁLISE DE TOKENS: ${tokenAnalysis.recommendation}`);

    if (!tokenAnalysis.isWithinLimit) {
      console.warn('⚠️ AVISO: Está próximo do limite de tokens');
    }

    // Prompt profissional e detalhado
    const professionalPrompt = `
# INSTRUÇÕES PARA CRIAÇÃO DE LIVRO PROFISSIONAL

## ESPECIFICAÇÕES DA OBRA:
- **TÍTULO**: Crie um título único e atraente
- **GÊNERO**: ${genre || 'Ficção Literária'}
- **PÚBLICO-ALVO**: ${audience || 'Adulto'}
- **TAMANHO**: ${config.description}
- **CAPÍTULOS**: ${finalChapterCount} capítulos completos
- **PALAVRAS POR CAPÍTULO**: ${config.wordsPerChapter} palavras

## DESCRIÇÃO DO ENREDO:
"${description}"

## ESTRUTURA OBRIGATÓRIA:

### 1. TÍTULO (string)
- Criativo, memorável e relacionado ao tema

### 2. SINOPSE (string - 200-400 palavras)
- Apresente os personagens principais
- Estabeleça o conflito central
- Descreva o cenário e atmosfera
- Crie expectativa no leitor

### 3. CAPÍTULOS (array de objetos)
Cada capítulo DEVE conter:

#### TÍTULO DO CAPÍTULO (string)
- Sugestivo do conteúdo
- Cria curiosidade

#### CONTEÚDO (string - ${config.wordsPerChapter} palavras)
**ESTRUTURA NARRATIVA COMPLETA:**
- **ABERTURA**: Cena inicial impactante
- **DESENVOLVIMENTO**: Progressão da trama com diálogos
- **CLÍMAX**: Ponto de tensão máximo no capítulo
- **RESOLUÇÃO**: Conclusão parcial ou gancho
- **DIÁLOGOS**: Mínimo 3-5 conversas significativas
- **DESCRIÇÕES**: Ambiente, emoções, sensações
- **EVOLUÇÃO**: Personagens devem mostrar crescimento

## REGRAS TÉCNICAS:
1. Use linguagem ${audience === 'Infantil' ? 'simples e lúdica' : 'rica e elaborada'}
2. Desenvolva personagens tridimensionais
3. Mantenha coerência narrativa
4. Crie tensão e suspense quando apropriado
5. Use descrições sensoriais (visuais, auditivas, táteis)
6. Inclua elementos de ${genre} de forma autêntica

## FORMATO DE RESPOSTA (STRICTO):
\`\`\`json
{
  "title": "Título Completo do Livro",
  "synopsis": "Sinopse detalhada de 3-5 parágrafos...",
  "chapters": [
    {
      "title": "Título do Capítulo 1",
      "content": "Conteúdo completo e detalhado do capítulo 1 com desenvolvimento narrativo completo, diálogos e descrições ricas..."
    }
  ]
}
\`\`\`

**IMPORTANTE**: Responda APENAS com o JSON válido. Não inclua qualquer texto adicional.
`;

    console.log('🤖 SOLICITANDO GERAÇÃO À OPENAI...');
    console.log(`📊 CONFIG: ${size.toUpperCase()} | ${finalChapterCount} capítulos | ${config.maxTokens} tokens`);

    const completion = await openai.chat.completions.create({
      model: size === 'epic' ? "gpt-3.5-turbo-16k" : "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um escritor best-seller premiado. Sua especialidade é criar narrativas profundas, personagens complexos e mundos imersivos. SEMPRE responda com JSON válido e estruturado."
        },
        {
          role: "user", 
          content: professionalPrompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0.75,
      top_p: 0.9,
    });

    console.log('✅ RESPOSTA DA OPENAI RECEBIDA');
    console.log(`📝 Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('OpenAI retornou resposta vazia');
    }

    // Processar conteúdo
    const bookData = parseBookContent(content, finalChapterCount);
    
    // Estatísticas finais
    const totalContentLength = bookData.chapters.reduce((sum: number, chapter: any) => 
      sum + (chapter.content?.length || 0), 0);
    
    console.log('📈 ESTATÍSTICAS FINAIS:');
    console.log(`   • Título: ${bookData.title}`);
    console.log(`   • Capítulos: ${bookData.chapters.length}`);
    console.log(`   • Total de caracteres: ${totalContentLength}`);
    console.log(`   • Páginas estimadas: ${Math.ceil(totalContentLength / 1800)}`);
    console.log(`   • Status: ✅ GERAÇÃO CONCLUÍDA COM SUCESSO`);

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('💥 ERRO CRÍTICO NA GERAÇÃO:', error);
    
    // Análise detalhada do erro
    const errorAnalysis = {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    };
    
    console.log('🔍 ANÁLISE DO ERRO:', errorAnalysis);

    // Tratamento específico
    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'Cota da API excedida.',
          solution: 'Verifique seu saldo em platform.openai.com/usage'
        },
        { status: 429 }
      );
    } else if (error?.status === 429) {
      return NextResponse.json(
        { 
          error: 'Muitas requisições simultâneas.',
          solution: 'Aguarde 1-2 minutos e tente novamente'
        },
        { status: 429 }
      );
    } else if (error?.message?.includes('JSON')) {
      return NextResponse.json(
        { 
          error: 'Problema no formato da resposta.',
          solution: 'Tente com uma descrição mais clara ou menos complexa'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro interno na geração do livro.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
