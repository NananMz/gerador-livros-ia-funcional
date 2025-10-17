import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar OpenAI com a API Key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sistema de configuração detalhado para diferentes tamanhos de livro
const BOOK_SIZE_CONFIG = {
  pequeno: {
    label: "Pequeno",
    description: "Novela curta ou coletânea de contos",
    pages: "40-60 páginas",
    chapters: 4,
    wordsPerChapter: "800-1.200 palavras",
    estimatedWords: "3.000-5.000 palavras totais",
    maxTokens: 6000,
    model: "gpt-3.5-turbo",
    readingTime: "1-2 horas",
    target: "Leitura rápida e objetiva"
  },
  medio: {
    label: "Médio", 
    description: "Romance de extensão padrão",
    pages: "80-120 páginas",
    chapters: 8,
    wordsPerChapter: "1.500-2.500 palavras",
    estimatedWords: "12.000-20.000 palavras totais",
    maxTokens: 12000,
    model: "gpt-3.5-turbo-16k",
    readingTime: "3-4 horas",
    target: "Leitura com desenvolvimento moderado"
  },
  grande: {
    label: "Grande",
    description: "Romance extenso com tramas complexas",
    pages: "150-200 páginas",
    chapters: 12,
    wordsPerChapter: "2.000-3.500 palavras",
    estimatedWords: "24.000-42.000 palavras totais",
    maxTokens: 14000,
    model: "gpt-3.5-turbo-16k",
    readingTime: "5-7 horas",
    target: "Leitura imersiva e detalhada"
  },
  epico: {
    label: "Épico",
    description: "Saga completa com múltiplos arcos",
    pages: "200-300 páginas",
    chapters: 16,
    wordsPerChapter: "2.500-4.000 palavras",
    estimatedWords: "40.000-64.000 palavras totais",
    maxTokens: 16000,
    model: "gpt-3.5-turbo-16k",
    readingTime: "8-10 horas",
    target: "Experiência de leitura completa"
  }
};

// Função para verificar disponibilidade do modelo 16k
async function verifyModelAccess(requestedModel: string): Promise<{available: boolean, fallbackModel: string}> {
  console.log(`🔍 Verificando acesso ao modelo: ${requestedModel}`);
  
  // Se for o modelo padrão, assumir que está disponível
  if (requestedModel === "gpt-3.5-turbo") {
    return { available: true, fallbackModel: "gpt-3.5-turbo" };
  }
  
  try {
    // Teste simples para verificar se o modelo está acessível
    const testCompletion = await openai.chat.completions.create({
      model: requestedModel,
      messages: [
        { 
          role: "user", 
          content: "Responda apenas com a palavra 'DISPONIVEL'" 
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    });
    
    const response = testCompletion.choices[0]?.message?.content;
    
    if (response && response.includes("DISPONIVEL")) {
      console.log(`✅ Modelo ${requestedModel} confirmado como disponível`);
      return { available: true, fallbackModel: requestedModel };
    }
    
    throw new Error("Resposta de teste inválida");
    
  } catch (error: any) {
    console.log(`❌ Modelo ${requestedModel} não disponível:`, error.message);
    
    // Determinar fallback apropriado
    const fallbackModel = "gpt-3.5-turbo";
    console.log(`🔄 Usando fallback: ${fallbackModel}`);
    
    return { 
      available: false, 
      fallbackModel: fallbackModel 
    };
  }
}

// Função para calcular estimativas precisas
function calculateBookMetrics(config: any, chapterCount: number) {
  const minWordsPerChapter = parseInt(config.wordsPerChapter.split('-')[0].replace(/\D/g, ''));
  const maxWordsPerChapter = parseInt(config.wordsPerChapter.split('-')[1].replace(/\D/g, ''));
  
  const estimatedMinWords = minWordsPerChapter * chapterCount;
  const estimatedMaxWords = maxWordsPerChapter * chapterCount;
  const estimatedAvgWords = (estimatedMinWords + estimatedMaxWords) / 2;
  
  // Cálculo de páginas (considerando ~250 palavras por página)
  const estimatedMinPages = Math.ceil(estimatedMinWords / 250);
  const estimatedMaxPages = Math.ceil(estimatedMaxWords / 250);
  
  // Cálculo de tokens (considerando ~1.3 tokens por palavra)
  const estimatedTokens = Math.ceil(estimatedAvgWords * 1.3);
  
  return {
    estimatedMinWords,
    estimatedMaxWords,
    estimatedAvgWords,
    estimatedMinPages,
    estimatedMaxPages,
    estimatedTokens,
    wordsPerPage: 250,
    tokensPerWord: 1.3
  };
}

// Função para validar e sanitizar a descrição
function validateAndSanitizeDescription(description: string): {valid: boolean, sanitized: string, issues: string[]} {
  const issues: string[] = [];
  let sanitized = description.trim();
  
  // Verificar comprimento mínimo
  if (sanitized.length < 20) {
    issues.push("Descrição muito curta (mínimo 20 caracteres)");
  }
  
  // Verificar comprimento máximo (evitar overflow)
  if (sanitized.length > 10000) {
    issues.push("Descrição muito longa, truncando para 10.000 caracteres");
    sanitized = sanitized.substring(0, 10000);
  }
  
  // Verificar conteúdo válido
  const wordCount = sanitized.split(/\s+/).length;
  if (wordCount < 5) {
    issues.push("Descrição muito vaga (mínimo 5 palavras)");
  }
  
  return {
    valid: issues.length === 0,
    sanitized: sanitized,
    issues: issues
  };
}

// Função para criar prompt detalhado baseado no tamanho
function createDetailedPrompt(description: string, config: any, chapterCount: number, genre: string, audience: string) {
  const metrics = calculateBookMetrics(config, chapterCount);
  
  return `
# 🎭 CRIAÇÃO DE LIVRO PROFISSIONAL - ${config.label.toUpperCase()}

## 📋 METADADOS DA OBRA:
- **TÍTULO**: [CRIE UM TÍTULO ORIGINAL E ATRAENTE]
- **EXTENSÃO**: ${config.pages} (${metrics.estimatedMinPages}-${metrics.estimatedMaxPages} páginas)
- **CAPÍTULOS**: ${chapterCount} capítulos completos
- **PALAVRAS**: ${metrics.estimatedMinWords}-${metrics.estimatedMaxWords} palavras totais
- **GÊNERO**: ${genre || "Ficção Científica"}
- **PÚBLICO-ALVO**: ${audience || "Jovem Adulto"}
- **TEMPO DE LEITURA**: ${config.readingTime}

## 📖 PREMISSA ORIGINAL DO AUTOR:
"""
${description}
"""

## 🎯 OBJETIVO CRIATIVO:
Transformar esta premissa em uma **OBRA COMPLETA** com profundidade narrativa, desenvolvimento de personagens e arco emocional satisfatório.

## 📚 ESTRUTURA DE CADA CAPÍTULO:

### 1. ABERTURA (15% do capítulo)
- Cena inicial impactante que prende a atenção
- Apresentação do contexto imediato
- Estabelecimento do tom emocional

### 2. DESENVOLVIMENTO (60% do capítulo)
- Progressão natural da trama
- Diálogos realistas e significativos
- Desenvolvimento de personagens
- Conflitos e tensões
- Descrições sensoriais (visuais, auditivas, emocionais)

### 3. CLÍMAX (15% do capítulo) 
- Ponto de tensão máxima no capítulo
- Revelações importantes
- Viradas na trama

### 4. RESOLUÇÃO/GANCHO (10% do capítulo)
- Conclusão parcial dos eventos
- Preparação para o próximo capítulo
- Manutenção do interesse do leitor

## ✍️ DIRECTRIZES DE ESCRITA:

### PERSONAGENS:
- Desenvolva personagens tridimensionais com motivações claras
- Mostre evolução emocional ao longo da narrativa
- Crie diálogos que revelem personalidade e avançem a trama

### NARRATIVA:
- Mantenha coerência com a premissa original
- Use linguagem apropriada para o público-alvo
- Varie o ritmo conforme a necessidade dramática
- Inclua elementos específicos do gênero ${genre}

### DESCRIÇÕES:
- Seja vívido mas não excessivamente detalhado
- Engaje todos os sentidos do leitor
- Crie atmosfera e mood consistentes

## 📊 EXIGÊNCIAS TÉCNICAS POR CAPÍTULO:
- **Diálogos**: Mínimo 3-5 trocas conversacionais significativas
- **Descrições**: 2-3 parágrafos descritivos ricos em detalhes sensoriais
- **Ações**: Progressão clara de eventos e consequências
- **Emoções**: Desenvolvimento emocional dos personagens principais

## 🎪 EXEMPLO DE CAPÍTULO BEM ESTRUTURADO:

**Título:** "O Eco do Vazio"

**Conteúdo:**
"Caio sentiu o ar ficar pesado antes mesmo de os alarmes soarem. Suas mãos, normalmente firmes, tremiam levemente sobre os controles. 'Lis, você está vendo isso?' 

A voz dela veio distorcida pelo comunicador: 'Os sensores estão enlouquecendo, Caio. É como se... como se o próprio espaço estivesse se desfazendo.'

Ele olhou para as leituras, seus olhos se arregalando ao ver os números dançarem de forma impossível. 'Isso não é um mau funcionamento', sussurrou, o suor frio escorrendo por suas costas. 'É uma ruptura.'

De repente, as luzes piscaram violentamente. Quando se restabeleceram, a porta do corredor Leste havia simplesmente... desaparecido. No seu lugar, uma parede lisa e contínua, como se a abertura nunca tivesse existido.

'Meu Deus', Lis engoliu seco. 'Ele está se expandindo.'

Caio pegou seu diário, suas anotações agora parecendo frágeis diante da magnitude do que testemunhavam. 'Precisamos avisar os outros', disse, mas sabia que era inútil. Quem acreditaria em algo que desafiava as próprias leis da realidade?"

## 📄 FORMATO DE RESPOSTA EXATO (APENAS JSON VÁLIDO):

\`\`\`json
{
  "title": "Título Criativo e Relevante Aqui",
  "synopsis": "Sinopse detalhada de 3-4 parágrafos que captura a essência da obra, apresenta os personagens principais, estabelece o conflito central e cria expectativa no leitor. Deve ser envolvente e representar fielmente o conteúdo do livro.",
  "chapters": [
    {
      "title": "Título do Capítulo 1 - Criativo e Sugestivo",
      "content": "Conteúdo completo do capítulo 1 seguindo rigorosamente a estrutura definida: abertura impactante, desenvolvimento com diálogos e descrições, clímax emocionante e resolução com gancho. Mínimo 5-7 parágrafos ricos em detalhes narrativos."
    }
  ]
}
\`\`\`

## ⚠️ REGRAS FINAIS:
1. **NÃO** repita literalmente a descrição original - expanda-a criativamente
2. **MANTENHA** todos os elementos essenciais da premissa
3. **DESENVOLVA** conteúdo original e envolvente
4. **RESPEITE** o gênero e público-alvo especificados
5. **SIGA** a estrutura de capítulos definida
6. **USE** linguagem rica mas acessível

**IMPORTANTE:** Cada capítulo deve ser uma unidade narrativa completa e satisfatória por si só, enquanto contribui para o arco geral da obra.
`;
}

// Função para processar e validar a resposta da OpenAI
function processOpenAIResponse(content: string, expectedChapters: number) {
  console.log('🔧 Processando resposta da OpenAI...');
  
  if (!content) {
    throw new Error('Resposta vazia da OpenAI');
  }
  
  // Log para debug
  console.log(`📄 Conteúdo recebido (primeiros 500 chars): ${content.substring(0, 500)}...`);
  
  let parsedData;
  
  // Tentativa 1: Parse direto
  try {
    parsedData = JSON.parse(content);
    console.log('✅ Parse JSON direto bem-sucedido');
  } catch (directError) {
    console.log('⚠️ Parse direto falhou, tentando extração de JSON...');
    
    // Tentativa 2: Extrair JSON do conteúdo
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON extraído com sucesso');
      } catch (extractionError) {
        console.log('❌ Falha na extração de JSON');
        throw new Error('Não foi possível extrair JSON válido da resposta');
      }
    } else {
      throw new Error('Nenhum JSON encontrado na resposta');
    }
  }
  
  // Validação da estrutura básica
  if (!parsedData.title || typeof parsedData.title !== 'string') {
    console.log('⚠️ Título inválido ou ausente, aplicando correção...');
    parsedData.title = "Livro Gerado por IA";
  }
  
  if (!parsedData.synopsis || typeof parsedData.synopsis !== 'string') {
    console.log('⚠️ Sinopse inválida ou ausente, aplicando correção...');
    parsedData.synopsis = "Uma narrativa envolvente desenvolvida através de inteligência artificial.";
  }
  
  if (!parsedData.chapters || !Array.isArray(parsedData.chapters)) {
    console.log('⚠️ Estrutura de capítulos inválida, criando array vazio...');
    parsedData.chapters = [];
  }
  
  // Validar e corrigir cada capítulo
  parsedData.chapters = parsedData.chapters.map((chapter: any, index: number) => {
    if (!chapter || typeof chapter !== 'object') {
      return {
        title: `Capítulo ${index + 1}`,
        content: `Conteúdo do capítulo ${index + 1} em desenvolvimento.`
      };
    }
    
    return {
      title: chapter.title && typeof chapter.title === 'string' ? chapter.title : `Capítulo ${index + 1}`,
      content: chapter.content && typeof chapter.content === 'string' ? chapter.content : `Desenvolvimento narrativo do capítulo ${index + 1}.`
    };
  });
  
  // Garantir número mínimo de capítulos
  while (parsedData.chapters.length < expectedChapters) {
    parsedData.chapters.push({
      title: `Capítulo ${parsedData.chapters.length + 1}`,
      content: `Este capítulo expande a narrativa principal com desenvolvimento adicional da trama.`
    });
  }
  
  // Limitar ao número máximo esperado
  if (parsedData.chapters.length > expectedChapters) {
    parsedData.chapters = parsedData.chapters.slice(0, expectedChapters);
  }
  
  return parsedData;
}

// Função principal da API Route
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 === INICIANDO GERAÇÃO DE LIVRO PROFISSIONAL ===');
  
  try {
    // Parse e validação do request
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.log('❌ Erro no parse do JSON do request:', parseError);
      return NextResponse.json(
        { 
          error: 'Formato de requisição inválido',
          details: 'O corpo da requisição deve ser um JSON válido'
        },
        { status: 400 }
      );
    }
    
    const { description, size, genre, audience, chapterCount } = requestBody;
    
    // Log dos parâmetros recebidos
    console.log('📋 PARÂMETROS RECEBIDOS:');
    console.log(`   • Tamanho: ${size}`);
    console.log(`   • Gênero: ${genre}`);
    console.log(`   • Público: ${audience}`);
    console.log(`   • Capítulos solicitados: ${chapterCount}`);
    console.log(`   • Comprimento da descrição: ${description?.length} caracteres`);
    
    // Validações iniciais
    if (!description) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      );
    }
    
    const validation = validateAndSanitizeDescription(description);
    if (!validation.valid) {
      console.log('❌ Problemas na validação:', validation.issues);
      return NextResponse.json(
        { 
          error: 'Descrição inválida',
          issues: validation.issues
        },
        { status: 400 }
      );
    }
    
    if (!size || !BOOK_SIZE_CONFIG[size as keyof typeof BOOK_SIZE_CONFIG]) {
      return NextResponse.json(
        { 
          error: 'Tamanho inválido',
          validSizes: Object.keys(BOOK_SIZE_CONFIG)
        },
        { status: 400 }
      );
    }
    
    // Configuração base
    let config = BOOK_SIZE_CONFIG[size as keyof typeof BOOK_SIZE_CONFIG];
    const finalChapterCount = chapterCount || config.chapters;
    
    console.log(`🎯 CONFIGURAÇÃO INICIAL: ${config.label}`);
    console.log(`   • Páginas: ${config.pages}`);
    console.log(`   • Capítulos: ${finalChapterCount}`);
    console.log(`   • Modelo: ${config.model}`);
    console.log(`   • Tokens: ${config.maxTokens}`);
    
    // Verificar acesso ao modelo
    const modelAccess = await verifyModelAccess(config.model);
    if (!modelAccess.available) {
      console.log(`🔄 Ajustando configuração para usar ${modelAccess.fallbackModel}`);
      config = {
        ...config,
        model: modelAccess.fallbackModel,
        maxTokens: Math.min(config.maxTokens, 3500),
        pages: `~${Math.ceil(parseInt(config.pages.split('-')[0]) / 1.5)} páginas`
      };
    }
    
    // Cálculos de estimativa
    const metrics = calculateBookMetrics(config, finalChapterCount);
    console.log('📊 ESTIMATIVAS DETALHADAS:');
    console.log(`   • Palavras totais: ${metrics.estimatedMinWords}-${metrics.estimatedMaxWords}`);
    console.log(`   • Páginas: ${metrics.estimatedMinPages}-${metrics.estimatedMaxPages}`);
    console.log(`   • Tokens estimados: ${metrics.estimatedTokens}`);
    console.log(`   • Tokens configurados: ${config.maxTokens}`);
    
    // Criar prompt detalhado
    const detailedPrompt = createDetailedPrompt(
      validation.sanitized, 
      config, 
      finalChapterCount, 
      genre || "Ficção", 
      audience || "Adulto"
    );
    
    console.log('🤖 SOLICITANDO GERAÇÃO À OPENAI...');
    console.log(`   • Modelo: ${config.model}`);
    console.log(`   • Tokens: ${config.maxTokens}`);
    console.log(`   • Capítulos: ${finalChapterCount}`);
    
    // Chamada para OpenAI
    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: `Você é um escritor profissional e editor experiente. 
          Sua especialidade é criar obras literárias completas, bem estruturadas e envolventes.
          Você sempre segue rigorosamente as diretrizes fornecidas e formata sua resposta em JSON válido.
          Sua missão é criar livros que sejam satisfatórios tanto em conteúdo quanto em estrutura.`
        },
        {
          role: "user",
          content: detailedPrompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0.75,
      top_p: 0.9,
    });
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ RESPOSTA DA OPENAI RECEBIDA em ${generationTime}ms`);
    console.log(`   • Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);
    console.log(`   • Tokens de prompt: ${completion.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   • Tokens de completion: ${completion.usage?.completion_tokens || 'N/A'}`);
    
    // Processar resposta
    const content = completion.choices[0]?.message?.content;
    const bookData = processOpenAIResponse(content, finalChapterCount);
    
    // Cálculo de estatísticas finais
    const totalContentLength = bookData.chapters.reduce((sum: number, chapter: any) => 
      sum + (chapter.content?.length || 0), 0);
    
    const avgChapterLength = totalContentLength / bookData.chapters.length;
    const estimatedPages = Math.ceil(totalContentLength / 1800); // ~1800 chars por página
    const estimatedReadingTime = Math.ceil(estimatedPages / 3); // ~3 páginas por minuto
    
    console.log('📈 ESTATÍSTICAS FINAIS DO LIVRO:');
    console.log(`   • Título: ${bookData.title}`);
    console.log(`   • Capítulos gerados: ${bookData.chapters.length}`);
    console.log(`   • Total de caracteres: ${totalContentLength}`);
    console.log(`   • Páginas estimadas: ${estimatedPages}`);
    console.log(`   • Média por capítulo: ${Math.ceil(avgChapterLength)} caracteres`);
    console.log(`   • Tempo de leitura: ~${estimatedReadingTime} minutos`);
    console.log(`   • Modelo utilizado: ${config.model}`);
    
    // Metadados completos
    bookData.metadata = {
      generation: {
        model: config.model,
        tokensUsed: completion.usage?.total_tokens,
        generationTime: generationTime,
        timestamp: new Date().toISOString()
      },
      bookInfo: {
        size: config.label,
        estimatedPages: estimatedPages,
        estimatedReadingTime: `${estimatedReadingTime} minutos`,
        totalChapters: bookData.chapters.length,
        totalCharacters: totalContentLength,
        genre: genre || "Ficção",
        audience: audience || "Adulto"
      },
      technical: {
        has16kAccess: modelAccess.available,
        maxTokensConfig: config.maxTokens,
        finalModel: config.model
      }
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 === GERAÇÃO CONCLUÍDA COM SUCESSO em ${totalTime}ms ===`);
    
    return NextResponse.json(bookData);
    
  } catch (error: any) {
    const errorTime = Date.now() - startTime;
    console.error(`💥 === ERRO NA GERAÇÃO em ${errorTime}ms ===`);
    console.error('Detalhes do erro:', error);
    
    // Análise detalhada do erro
    const errorAnalysis = {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    console.log('🔍 ANÁLISE DO ERRO:', errorAnalysis);
    
    // Tratamento específico de erros da OpenAI
    if (error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: 'Chave da API inválida',
          solution: 'Verifique a OPENAI_API_KEY no Vercel'
        },
        { status: 401 }
      );
    } else if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'Cota insuficiente',
          solution: 'Verifique seu saldo em platform.openai.com/usage'
        },
        { status: 429 }
      );
    } else if (error?.code === 'model_not_found') {
      return NextResponse.json(
        { 
          error: 'Modelo não disponível',
          solution: 'Verifique se tem acesso ao modelo solicitado'
        },
        { status: 400 }
      );
    } else if (error?.status === 429) {
      return NextResponse.json(
        { 
          error: 'Limite de taxa excedido',
          solution: 'Aguarde alguns minutos e tente novamente'
        },
        { status: 429 }
      );
    } else if (error?.message?.includes('JSON')) {
      return NextResponse.json(
        { 
          error: 'Problema no formato da resposta',
          solution: 'Tente com uma descrição mais clara ou menos complexa'
        },
        { status: 500 }
      );
    }
    
    // Erro genérico
    return NextResponse.json(
      { 
        error: 'Erro interno na geração do livro',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Entre em contato com o suporte'
      },
      { status: 500 }
    );
  }
}
