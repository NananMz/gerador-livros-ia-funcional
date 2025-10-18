import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sistema para descobrir modelos disponíveis
const AVAILABLE_MODELS = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k", 
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4-32k"
];

// Configuração base independente do modelo
const BOOK_SIZE_CONFIG = {
  pequeno: {
    label: "Pequeno",
    pages: "20-40 páginas",
    chapters: 3,
    wordsPerChapter: "500-800 palavras",
    readingTime: "1-2 horas"
  },
  medio: {
    label: "Médio", 
    pages: "40-70 páginas",
    chapters: 5,
    wordsPerChapter: "700-1.000 palavras",
    readingTime: "2-3 horas"
  },
  grande: {
    label: "Grande",
    pages: "60-90 páginas",
    chapters: 6,
    wordsPerChapter: "800-1.200 palavras",
    readingTime: "3-4 horas"
  }
};

// Função para descobrir qual modelo está disponível
async function discoverAvailableModel(): Promise<{model: string, maxTokens: number}> {
  console.log('🔍 Descobrindo modelos disponíveis...');
  
  for (const model of AVAILABLE_MODELS) {
    try {
      console.log(`   Testando modelo: ${model}`);
      
      const testCompletion = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: "Responda 'OK'" }],
        max_tokens: 5,
      });
      
      // Determinar max_tokens baseado no modelo
      let maxTokens = 2000; // padrão conservador
      
      if (model.includes('16k') || model.includes('32k')) {
        maxTokens = 8000;
      } else if (model.includes('gpt-4')) {
        maxTokens = 4000;
      } else if (model.includes('gpt-3.5-turbo')) {
        maxTokens = 3500; // Máximo seguro para 4K
      }
      
      console.log(`✅ Modelo disponível: ${model} (${maxTokens} tokens)`);
      return { model, maxTokens };
      
    } catch (error: any) {
      console.log(`❌ ${model} não disponível: ${error.message}`);
      continue;
    }
  }
  
  // Se nenhum modelo GPT funcionar, tentar usar davinci como fallback
  try {
    console.log('🔄 Tentando modelos completion como fallback...');
    const completion = await openai.completions.create({
      model: "text-davinci-003",
      prompt: "Test",
      max_tokens: 5,
    });
    
    console.log('✅ Usando text-davinci-003 como fallback');
    return { model: "text-davinci-003", maxTokens: 2000 };
    
  } catch (error) {
    throw new Error('NENHUM modelo da OpenAI está disponível para este projeto');
  }
}

// Função para gerar livro com o modelo disponível
async function generateWithAvailableModel(prompt: string, model: string, maxTokens: number) {
  console.log(`🚀 Gerando com ${model} (${maxTokens} tokens)...`);
  
  if (model.startsWith('text-')) {
    // Para modelos de completion (antigos)
    const completion = await openai.completions.create({
      model: model,
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    
    return completion.choices[0]?.text || '';
  } else {
    // Para modelos chat
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "Você é um escritor profissional. Responda APENAS com JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    
    return completion.choices[0]?.message?.content || '';
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 INICIANDO GERAÇÃO COM MODELO AUTODETECTADO');
  
  try {
    const { description, size, genre, audience, chapterCount } = await request.json();
    
    // Descobrir modelo disponível
    const { model, maxTokens } = await discoverAvailableModel();
    
    console.log(`🎯 MODELO SELECIONADO: ${model}`);
    console.log(`   • Tokens disponíveis: ${maxTokens}`);
    console.log(`   • Tamanho solicitado: ${size}`);
    
    const config = BOOK_SIZE_CONFIG[size as keyof typeof BOOK_SIZE_CONFIG] || BOOK_SIZE_CONFIG.medio;
    const finalChapterCount = Math.min(chapterCount || config.chapters, 6);
    
    // Ajustar configuração baseado nos tokens disponíveis
    let adjustedConfig = { ...config };
    if (maxTokens < 3000) {
      // Tokens muito limitados
      adjustedConfig.chapters = Math.min(config.chapters, 4);
      adjustedConfig.wordsPerChapter = "400-600 palavras";
      adjustedConfig.pages = `~${parseInt(config.pages.split('-')[0]) / 2} páginas`;
    }
    
    console.log(`📊 CONFIGURAÇÃO AJUSTADA: ${adjustedConfig.pages} | ${finalChapterCount} capítulos`);
    
    // Prompt otimizado para o modelo disponível
    const optimizedPrompt = model.startsWith('text-') 
      ? // Prompt para modelos de completion
        `Crie um livro baseado em: "${description.substring(0, 1000)}"
        
        Gênero: ${genre}
        Capítulos: ${finalChapterCount}
        
        Estruture em JSON:
        {
          "title": "Título",
          "synopsis": "Sinopse", 
          "chapters": [
            {"title": "Capítulo 1", "content": "Texto"}
          ]
        }`
      : // Prompt para modelos chat
        `Crie um livro completo baseado nesta descrição: "${description.substring(0, 1500)}"
        
        ESPECIFICAÇÕES:
        - Gênero: ${genre || "Ficção"}
        - Capítulos: ${finalChapterCount}
        - Público: ${audience || "Adulto"}
        
        Desenvolva cada capítulo com:
        - Diálogos realistas
        - Descrições detalhadas  
        - Progressão narrativa
        - Desenvolvimento de personagens
        
        FORMATO DE RESPOSTA (APENAS JSON):
        {
          "title": "Título do Livro",
          "synopsis": "Sinopse completa aqui",
          "chapters": [
            {
              "title": "Título do Capítulo 1",
              "content": "Conteúdo completo e detalhado do capítulo 1..."
            }
          ]
        }`;

    console.log('📝 Gerando conteúdo...');
    
    const content = await generateWithAvailableModel(optimizedPrompt, model, maxTokens);
    
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }
    
    console.log('✅ Conteúdo recebido, processando...');
    
    // Processar resposta
    let bookData;
    try {
      bookData = JSON.parse(content);
    } catch (e) {
      console.log('❌ Erro no parse JSON, criando estrutura manual...');
      
      // Se não é JSON válido, criar estrutura básica
      const chapters = [];
      for (let i = 0; i < finalChapterCount; i++) {
        chapters.push({
          title: `Capítulo ${i + 1}`,
          content: `Conteúdo do capítulo ${i + 1} baseado na descrição: ${description.substring(0, 100)}...`
        });
      }
      
      bookData = {
        title: "Livro Gerado",
        synopsis: `Baseado na premissa: ${description.substring(0, 200)}...`,
        chapters: chapters
      };
    }
    
    // Estatísticas
    const totalContentLength = bookData.chapters?.reduce((sum: number, chapter: any) => 
      sum + (chapter.content?.length || 0), 0) || 0;
    
    console.log('📈 ESTATÍSTICAS:');
    console.log(`   • Modelo usado: ${model}`);
    console.log(`   • Capítulos: ${bookData.chapters?.length}`);
    console.log(`   • Caracteres: ${totalContentLength}`);
    console.log(`   • Páginas estimadas: ~${Math.ceil(totalContentLength / 1800)}`);
    
    // Metadados
    bookData.metadata = {
      model: model,
      maxTokens: maxTokens,
      size: adjustedConfig.label,
      estimatedPages: Math.ceil(totalContentLength / 1800),
      generation: "auto-detected-model"
    };
    
    return NextResponse.json(bookData);
    
  } catch (error: any) {
    console.error('💥 ERRO CRÍTICO:', error.message);
    
    if (error.message.includes('NENHUM modelo')) {
      return NextResponse.json(
        { 
          error: 'Projeto sem acesso a modelos GPT',
          solution: 'Verifique as permissões do projeto na OpenAI ou use uma API Key diferente'
        },
        { status: 403 }
      );
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Limite de requisições excedido' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erro na geração',
        details: error.message
      },
      { status: 500 }
    );
  }
}
