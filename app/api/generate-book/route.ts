import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { description, size, genre, audience } = await request.json();

    // Validar dados
    if (!description) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      );
    }

    // Configurar parâmetros baseados no tamanho
    const sizeConfig = {
      small: { chapters: '3-4', words: '800-1200' },
      medium: { chapters: '5-6', words: '1500-2000' },
      large: { chapters: '7-8', words: '2500-3500' }
    };

    const config = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.medium;

    // Prompt otimizado para geração de livros
    const prompt = `
Crie um livro COMPLETO com as seguintes especificações:

DESCRIÇÃO DO LIVRO: ${description}

CONFIGURAÇÕES:
- Gênero: ${genre}
- Público-alvo: ${audience}
- Tamanho: ${size} (${config.chapters} capítulos, ${config.words} palavras)
- Idioma: Português do Brasil

ESTRUTURA DO LIVRO:
1. TÍTULO: Crie um título criativo e atraente
2. SINOPSE: Escreva uma sinopse envolvente (2-3 parágrafos)
3. CAPÍTULOS: Desenvolva ${config.chapters} capítulos completos

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título do livro",
  "synopsis": "Sinopse completa aqui...",
  "chapters": [
    {
      "title": "Título do Capítulo 1",
      "content": "Conteúdo completo do capítulo 1..."
    }
  ]
}

INSTRUÇÕES:
- Mantenha a linguagem apropriada para ${audience}
- Desenvolva uma narrativa coerente e envolvente
- Cada capítulo deve ter começo, meio e fim
- Use diálogos quando apropriado
- Seja criativo e original
`;

    // Chamar OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um escritor profissional especializado em criar livros completos e envolventes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    // Tentar parsear JSON da resposta
    try {
      const bookData = JSON.parse(content);
      return NextResponse.json(bookData);
    } catch (parseError) {
      // Se não for JSON válido, retornar como texto simples
      return NextResponse.json({
        title: "Livro Gerado",
        synopsis: "Sinopse gerada pela IA",
        chapters: [
          {
            title: "Capítulo 1",
            content: content
          }
        ]
      });
    }

  } catch (error) {
    console.error('Erro na geração do livro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar livro' },
      { status: 500 }
    );
  }
}
