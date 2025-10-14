import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Função melhorada para parse do conteúdo
function parseBookContent(content: string) {
  console.log('📝 Conteúdo recebido da OpenAI:', content.substring(0, 200) + '...');

  // Tentar encontrar JSON no conteúdo
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parseado com sucesso');
      return parsed;
    } catch (e) {
      console.log('❌ JSON inválido, criando estrutura alternativa');
    }
  }
  
  // Se não encontrar JSON válido, criar estrutura com o conteúdo
  const chapters = content.split(/\n\n+/).filter(para => para.trim().length > 50);
  
  return {
    title: "Livro Gerado",
    synopsis: "Este livro foi criado por inteligência artificial com base na sua descrição única.",
    chapters: chapters.map((content, index) => ({
      title: `Capítulo ${index + 1}`,
      content: content.trim()
    })).slice(0, 8) // Limitar a 8 capítulos
  };
}

export async function POST(request: NextRequest) {
  try {
    const { description, size, genre, audience } = await request.json();

    console.log('📖 Iniciando geração de livro:', { size, genre, audience });

    // Validar dados
    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Descrição muito curta. Forneça pelo menos 10 caracteres.' },
        { status: 400 }
      );
    }

    // Configurar parâmetros baseados no tamanho
    const sizeConfig = {
      small: { 
        chapters: '3-4', 
        words: '800-1200',
        max_tokens: 2000
      },
      medium: { 
        chapters: '5-6', 
        words: '1500-2000',
        max_tokens: 3000
      },
      large: { 
        chapters: '7-8', 
        words: '2500-3500',
        max_tokens: 4000
      }
    };

    const config = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.medium;

    // Prompt otimizado para geração de livros
    const prompt = `
Você é um escritor profissional especializado em criar livros completos e envolventes.

CRIE UM LIVRO COMPLETO com as seguintes especificações:

DESCRIÇÃO DO LIVRO: ${description}

CONFIGURAÇÕES:
- Gênero: ${genre}
- Público-alvo: ${audience}
- Tamanho: ${size} (${config.chapters} capítulos, ${config.words} palavras)
- Idioma: Português do Brasil

ESTRUTURA OBRIGATÓRIA (responda APENAS em JSON):

{
  "title": "Título criativo e atraente aqui",
  "synopsis": "Sinopse envolvente de 2-3 parágrafos aqui...",
  "chapters": [
    {
      "title": "Título do Capítulo 1",
      "content": "Conteúdo completo do capítulo 1 aqui..."
    }
  ]
}

REGRAS IMPORTANTES:
1. Responda APENAS com o JSON válido
2. Mantenha a linguagem apropriada para ${audience}
3. Desenvolva uma narrativa coerente e envolvente
4. Cada capítulo deve ter começo, meio e fim
5. Use diálogos quando apropriado
6. Seja criativo e original
7. NÃO inclua nenhum texto além do JSON
`;

    console.log('🤖 Chamando OpenAI API...');

    // Chamar OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um escritor profissional. Responda APENAS com JSON válido, sem nenhum texto adicional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: config.max_tokens,
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    console.log('✅ Resposta da OpenAI recebida');

    // Parsear o conteúdo
    const bookData = parseBookContent(content);

    // Validar estrutura básica
    if (!bookData.title || !bookData.chapters || !Array.isArray(bookData.chapters)) {
      throw new Error('Estrutura do livro inválida');
    }

    console.log(`📚 Livro gerado: ${bookData.title} com ${bookData.chapters.length} capítulos`);

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('❌ Erro na geração do livro:', error);
    
    // Tratamento específico de erros
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Limite de uso excedido. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    } else if (error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Erro de configuração do serviço.' },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Erro ao gerar livro. Tente novamente com uma descrição diferente.' },
        { status: 500 }
      );
    }
  }
}
