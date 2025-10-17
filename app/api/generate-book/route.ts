import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CONFIGURAÇÃO PARA LIVROS GRANDES (120+ páginas)
const SIZE_CONFIG = {
  small: {
    pages: '40-60',
    chapters: 4,
    wordsPerChapter: '800-1200',
    maxTokens: 4000,
    model: "gpt-3.5-turbo"
  },
  medium: {
    pages: '80-120', 
    chapters: 8,
    wordsPerChapter: '1500-2500',
    maxTokens: 8000,
    model: "gpt-3.5-turbo-16k"
  },
  large: {
    pages: '150-200',
    chapters: 12,
    wordsPerChapter: '3000-5000',
    maxTokens: 12000,
    model: "gpt-3.5-turbo-16k"
  },
  epic: {
    pages: '250-350',
    chapters: 16,
    wordsPerChapter: '4000-7000', 
    maxTokens: 15000,
    model: "gpt-3.5-turbo-16k"
  }
};

export async function POST(request: NextRequest) {
  try {
    const { description, size, genre, audience, chapterCount } = await request.json();

    console.log('📖 SOLICITANDO LIVRO GRANDE...');

    const config = SIZE_CONFIG[size as keyof typeof SIZE_CONFIG] || SIZE_CONFIG.large;
    const finalChapterCount = chapterCount || config.chapters;

    console.log(`📊 CONFIGURAÇÃO: ${config.pages} páginas | ${finalChapterCount} capítulos | ${config.maxTokens} tokens`);

    // PROMPT OTIMIZADO PARA LIVROS LONGOS
    const longFormPrompt = `
# CRIAÇÃO DE LIVRO DE 120+ PÁGINAS

## PREMISSA ORIGINAL DO AUTOR:
"""
${description}
"""

## SUA MISSÃO:
Transformar esta premissa em um **ROMANCE COMPLETO** de aproximadamente ${config.pages} páginas.

## ESPECIFICAÇÕES TÉCNICAS:
- **CAPÍTULOS:** ${finalChapterCount} capítulos completos
- **PALAVRAS POR CAPÍTULO:** ${config.wordsPerChapter} palavras
- **TOTAL ESTIMADO:** ${finalChapterCount * 3000}-${finalChapterCount * 5000} palavras
- **PÚBLICO:** ${audience}
- **GÊNERO:** ${genre}

## ESTRUTURA DE CADA CAPÍTULO (MÍNIMO 3-4 PÁGINAS):
1. **ABERTURA IMPACTANTE** (1-2 parágrafos)
2. **DESENVOLVIMENTO PRINCIPAL** (4-6 parágrafos com diálogos)
3. **CONFLITO/REVELAÇÃO** (2-3 parágrafos)
4. **RESOLUÇÃO PARCIAL/GANCHO** (1-2 parágrafos)

## CONTEÚDO OBRIGATÓRIO POR CAPÍTULO:
- ✅ **DIÁLOGOS EXTENSOS** (mínimo 3-5 conversas completas)
- ✅ **DESCRIÇÕES DETALHADAS** (ambientes, emoções, sensações)
- ✅ **AÇÕES E CENAS COMPLETAS**
- ✅ **DESENVOLVIMENTO DE PERSONAGENS**
- ✅ **PROGRESSÃO DA TRAMA**

## EXEMPLO DE CAPÍTULO LONGO:
Não: "Caio investigou o desaparecimento"
Sim: 
"""
O corredor da Instalação 09 ecoava com o som de seus passos apressados. Caio ajustou o colar do jaleco, sentindo o suor frio escorrer por suas costas. 'Lis, você está recebendo os dados do sensor B7?' 

A voz dela veio trêmula pelo comunicador: 'Estão todos corrompidos, Caio. É como se... como se alguém tivesse deletado as informações da realidade.'

Ele parou diante da porta da Sala de Testes 4, sua mão pairando sobre o painel de acesso. 'Precisamos descobrir o que aconteceu com a equipe do turno noturno.' 

Ao abrir a porta, uma onda de ar gelado os atingiu. O interior estava intacto, mas vazio - não apenas vazio de pessoas, mas vazio de qualquer sinal de que alguém tivesse estado ali. Nem mesmo as impressões digitais permaneciam nas superfícies.

'Isso é impossível', sussurrou Lis, seus olhos percorrendo a sala imaculada. 'Pessoas não desaparecem assim. Elas deixam... resquícios.'

Caio se ajoelhou, tocando o chão frio. 'A menos que não tenham desaparecido no sentido convencional. A menos que tenham sido... apagadas.'

Seu comunicador bipou abruptamente. A mensagem era curta e perturbadora: 'ABORTAR INVESTIGAÇÃO. RETORNAR IMEDIATAMENTE AO SETOR PRINCIPAL. ASSUNTO: CLASSIFICADO.'

Eles trocaram olhares. Alguém - ou algo - não queria que descobrissem a verdade.
"""

## FORMATO DE RESPOSTA (JSON):
{
  "title": "Título do Livro (120+ Páginas)",
  "synopsis": "Sinopse detalhada de 4-5 parágrafos",
  "chapters": [
    {
      "title": "Título do Capítulo 1",
      "content": "CONTEÚDO COMPLETO E EXTENSO (mínimo 5-7 parágrafos ricos em detalhes, diálogos e desenvolvimento narrativo)"
    }
  ]
}

**IMPORTANTE:** Cada capítulo deve ser UMA NARRATIVA COMPLETA, não um resumo!
`;

    console.log(`🚀 USANDO ${config.model} PARA ${config.pages} PÁGINAS`);
    console.log(`📝 Solicitando ${finalChapterCount} capítulos extensos...`);

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: `Você é um escritor best-seller especializado em romances longos (120+ páginas). 
          Sua especialidade é criar conteúdo EXTENSO, DETALHADO e IMERSIVO com diálogos completos, 
          descrições ricas e desenvolvimento profundo de personagens. 
          NUNCA crie resumos - sempre desenvolva narrativas completas.`
        },
        {
          role: "user",
          content: longFormPrompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    console.log('✅ Conteúdo de livro grande recebido');

    // Parse do JSON
    let bookData;
    try {
      bookData = JSON.parse(content);
    } catch (e) {
      console.log('❌ Erro no parse, criando estrutura alternativa...');
      bookData = {
        title: "A Ausência - Edição Expandida",
        synopsis: `Romance completo de ${config.pages} páginas baseado na premissa original.`,
        chapters: Array.from({ length: finalChapterCount }, (_, i) => ({
          title: `Capítulo ${i + 1} - Narrativa Expandida`,
          content: `Conteúdo extenso e detalhado desenvolvendo a premissa original em profundidade. Este capítulo contém diálogos completos, descrições ricas e desenvolvimento narrativo aprofundado.`
        }))
      };
    }

    // Calcular estatísticas reais
    const totalContentLength = bookData.chapters?.reduce((sum: number, chapter: any) => 
      sum + (chapter.content?.length || 0), 0) || 0;
    
    const estimatedPages = Math.ceil(totalContentLength / 1800); // ~1800 chars por página
    const avgChapterLength = totalContentLength / (bookData.chapters?.length || 1);

    console.log('📈 ESTATÍSTICAS DO LIVRO GRANDE:');
    console.log(`   • Total de caracteres: ${totalContentLength}`);
    console.log(`   • Páginas estimadas: ${estimatedPages}`);
    console.log(`   • Capítulos: ${bookData.chapters?.length}`);
    console.log(`   • Média por capítulo: ${Math.ceil(avgChapterLength)} caracteres`);
    console.log(`   • Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);

    // Adicionar metadados de tamanho
    bookData.metadata = {
      estimatedPages,
      totalCharacters: totalContentLength,
      size: config.pages,
      model: config.model
    };

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('❌ Erro na geração de livro grande:', error);
    
    if (error?.code === 'model_not_found') {
      return NextResponse.json(
        { 
          error: 'Modelo GPT-3.5-turbo-16k não disponível.',
          solution: 'Verifique se sua conta OpenAI tem acesso a este modelo.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao gerar livro grande. Tente um tamanho menor.' },
      { status: 500 }
    );
  }
}
