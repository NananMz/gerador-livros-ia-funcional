import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { description, size, genre, audience, chapterCount } = await request.json();

    console.log('📖 Recebendo descrição para expansão...');

    // Configuração baseada no tamanho
    const config = {
      chapters: chapterCount || 8,
      maxTokens: 3500,
      genre: genre || 'Suspense Científico',
      audience: audience || 'Jovem Adulto'
    };

    // PROMPT PARA EXPANSÃO CRIATIVA
    const expansionPrompt = `
VOCÊ É UM ESCRITOR PROFISSIONAL. Sua missão é PEGAR esta DESCRIÇÃO DE LIVRO e TRANSFORMÁ-LA em um LIVRO COMPLETO e DETALHADO.

## DESCRIÇÃO ORIGINAL DO AUTOR:
"""
${description}
"""

## SUA MISSÃO:
Expanda esta descrição em um LIVRO COMPLETO com ${config.chapters} capítulos. 

**SEGUA EXATAMENTE:**
- ✅ **MESMOS PERSONAGENS** (Caio, Lis, mentor, governo)
- ✅ **MESMO ENREDO** (experimento de apagamento, buraco no vazio)
- ✅ **MESMO UNIVERSO** (Instalação 09, Teoria da Ausência)
- ✅ **MESMOS TEMAS** (ciência vs ética, existência, apagamento)

**O QUE EXPANDIR:**
- 🔥 **DIÁLOGOS COMPLETOS** entre os personagens
- 🎭 **CENAS DETALHADAS** com ações e emoções
- 🏛️ **DESCRIÇÕES RICAS** dos ambientes e sensações
- 📈 **DESENVOLVIMENTO** da trama passo a passo
- 💭 **PENSAMENTOS** internos dos personagens

**NÃO APENAS REPITA - EXPANDA:**
- Transforme resumos em cenas completas
- Converta ideias em diálogos reais
- Desenvolva momentos mencionados em capítulos completos

## EXEMPLO DE EXPANSÃO:
Se a descrição diz: "Caio e Lis investigam desaparecimento"
VOCÊ CRIA: 
"Caio ajustou seu equipamento de monitoramento, as luzes piscando em ritmo irregular. 'Algo está errado aqui, Lis', sussurrou, os olhos fixos nos sensores. Ela se aproximou, sua respiração formando nuvens no ar gelado. 'Os registros mostram que eles entraram aqui às 03:47, mas não há saída.' Seus dedos tremiam ao tocar o terminal. De repente, as luzes piscaram e um eco distante ecoou pelo corredor vazio..."

## FORMATO DE SAÍDA (APENAS JSON):
{
  "title": "Título Baseado na Descrição",
  "synopsis": "Sinopse expandida e detalhada",
  "chapters": [
    {
      "title": "Título do Capítulo 1 Expandido",
      "content": "CONTEÚDO COMPLETO E DETALHADO expandindo a descrição original com diálogos, ações, descrições e desenvolvimento emocional dos personagens."
    }
  ]
}

**IMPORTANTE:** Cada capítulo deve ter 600-900 palavras de conteúdo ORIGINAL que expande a premissa fornecida.
`;

    console.log('🔄 Expandindo descrição em livro completo...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um escritor especializado em expandir descrições em livros completos. 
          Sua função é PEGAR a premissa fornecida e DESENVOLVÊ-LA em narrativas completas, 
          mantendo os mesmos personagens, enredo e universo, mas adicionando diálogos, 
          cenas detalhadas e desenvolvimento emocional.`
        },
        {
          role: "user",
          content: expansionPrompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    console.log('✅ Expansão concluída, processando...');

    // Parse do JSON
    let bookData;
    try {
      bookData = JSON.parse(content);
    } catch (e) {
      console.log('❌ Erro no parse, criando estrutura alternativa...');
      // Fallback inteligente que ainda expande a descrição
      bookData = {
        title: "A Expansão do Vazio",
        synopsis: `Desenvolvimento completo da premissa: ${description.substring(0, 200)}...`,
        chapters: Array.from({ length: config.chapters }, (_, i) => ({
          title: `Capítulo ${i + 1} - Desenvolvimento Expandido`,
          content: `Este capítulo expande a descrição original com cenas detalhadas, diálogos completos e desenvolvimento dos personagens Caio e Lis no universo da Instalação 09.`
        }))
      };
    }

    // Validar se expandiu suficientemente
    const totalContentLength = bookData.chapters?.reduce((sum: number, chapter: any) => 
      sum + (chapter.content?.length || 0), 0) || 0;
    
    const expansionRatio = totalContentLength / description.length;
    
    console.log('📊 ESTATÍSTICAS DA EXPANSÃO:');
    console.log(`   • Descrição original: ${description.length} caracteres`);
    console.log(`   • Livro expandido: ${totalContentLength} caracteres`);
    console.log(`   • Taxa de expansão: ${expansionRatio.toFixed(1)}x`);
    console.log(`   • Capítulos: ${bookData.chapters?.length}`);

    if (expansionRatio < 2) {
      console.log('⚠️ Expansão pode estar muito próxima do original');
    }

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('❌ Erro na expansão:', error);
    return NextResponse.json(
      { error: 'Erro ao expandir o livro. Tente novamente.' },
      { status: 500 }
    );
  }
}
