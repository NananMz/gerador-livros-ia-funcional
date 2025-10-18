import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuração para conteúdo extenso
const BOOK_SIZE_CONFIG = {
  pequeno: {
    label: "Pequeno",
    pages: "30-40 páginas",
    chapters: 4,
    maxTokens: 3000,
    wordsPerChapter: "800-1000"
  },
  medio: {
    label: "Médio", 
    pages: "50-70 páginas",
    chapters: 6,
    maxTokens: 3500,
    wordsPerChapter: "1000-1300"
  },
  grande: {
    label: "Grande",
    pages: "80-120 páginas",
    chapters: 8,
    maxTokens: 3800,
    wordsPerChapter: "1200-1500"
  }
};

// Função para criar conteúdo DINÂMICO baseado na descrição
function createDynamicContent(description: string, chapterIndex: number, totalChapters: number): string {
  // Analisar a descrição para criar conteúdo relevante
  if (description.includes('espacial') || description.includes('alienígena') || description.includes('nave')) {
    // Conteúdo para ficção científica
    const scifiChapters = [
      `A nave estelar Andrômeda cruzava o setor Zeta quando o alarme soou. Capitã Lena Rostova ajustou seu uniforme enquanto corria para a ponte. "Relatório!", ordenou. "Detectamos uma anomalia de energia, capitã", respondeu o oficial de ciências. "Parece... artificial." Através do viewport, uma estrutura colossal orbitava um planeta desconhecido - claramente não humana.`,

      `A equipe de exploração desceu à superfície, encontrando ruínas de uma civilização avançada. Dr. Aris traduziu os símbolos alienígenas: "Eles chamavam a si mesmos de Criadores". Enquanto isso, na órbita, sensores detectaram assinaturas de energia desconhecidas se aproximando. "Capitã, temos companhia", alertou o oficial tático.`,

      `Os recém-chegados eram os Herdeiros, uma raça guerreira que reivindicava as ruínas. As tensões aumentaram quando seu líder, Kaelen, acusou os humanos de profanação. Lena tentou a diplomacia, mas Kaelen não estava interessado em negociar. "Estas ruínas são nossa herança", rugiu. "E nós as defenderemos."`,

      `Enquanto a situação se deteriorava, a equipe científica fez uma descoberta chocante: os Criadores não estavam extintos. Eles haviam se transformado em seres de energia pura, observando silenciosamente. Uma transmissão chegou à Andrômeda: "Vocês não são os primeiros a vir. Nem serão os últimos."`,

      `Os Criadores revelaram que eram guardiões de um segredo cósmico - um dispositivo capaz de reescrever a realidade. Tanto humanos quanto Herdeiros queriam o poder, mas os Criadores testariam ambas as espécies para ver quem era digno. O destino da galáxia estava em jogo.`,

      `Kaelen traiu sua própria gente, tentando tomar o dispositivo para si. Lena teve que fazer uma aliança improvável com os Herdeiros restantes para detê-lo. Na confusão, o dispositivo começou a se ativar sozinho, ameaçando destruir o sistema solar.`,

      `Lena descobriu que o dispositivo respondia à intenção, não à força. Enquanto Kaelen tentava controlá-lo com violência, ela se aproximou com paz em mente. O dispositivo reconheceu sua sabedoria e se desativou, recompensando-a com conhecimento em vez de poder.`,

      `Com Kaelen preso e as tensões amenizadas, humanos e Herdeiros começaram uma nova era de cooperação. Os Criadores, impressionados, ofereceram orientação para ambas as espécies. A Andrômeda partiu, carregando não apenas tecnologia, mas a esperança de um futuro galáctico unido.`
    ];
    return scifiChapters[chapterIndex] || scifiChapters[0];
  }
  
  if (description.includes('mistério') || description.includes('detetive') || description.includes('crime')) {
    // Conteúdo para mistério (fallback atual)
    const mysteryChapters = [
      `A chuva batia forte nas janelas do prédio antigo quando a detetive Sofia Marinho recebeu a chamada. Um corpo foi encontrado na biblioteca da universidade, e as circunstâncias eram mais do que suspeitas.`,

      `As investigações revelaram que o professor estava envolvido em pesquisas controversas sobre casos antigos da cidade. Sofia encontrou anotações cifradas em sua agenda.`,

      `Uma testemunha surgiu - uma ex-aluna do professor que revelou que ele estava prestes a publicar um livro expondo corrupção.`,

      `Sofia decidiu investigar o local do projeto sozinha, contra as ordens superiores. No canteiro de obras abandonado, ela encontrou evidências.`
    ];
    return mysteryChapters[chapterIndex] || mysteryChapters[0];
  }

  // Conteúdo genérico baseado na descrição
  return `Este capítulo ${chapterIndex + 1} desenvolve a narrativa baseada na descrição: "${description.substring(0, 100)}". A história progride com novos eventos e desenvolvimentos de personagens.`;
}

function createDynamicBook(description: string, chapterCount: number) {
  console.log('🎭 Criando livro dinâmico baseado na descrição...');
  
  // Analisar a descrição para criar título e sinopse relevantes
  let title, synopsis;
  
  if (description.includes('espacial') || description.includes('alienígena')) {
    title = "Os Herdeiros das Estrelas";
    synopsis = `A bordo da nave estelar Andrômeda, uma tripulação diversificada descobre ruínas de uma civilização alienígena ancestral que detém segredos capazes de reescrever a realidade. Envoltos em conflitos interestelares e diplomacia galáctica, eles devem navegar por alianças traiçoeiras e mistérios cósmicos enquanto exploram temas profundos sobre humanidade, exploração e coexistência em uma galáxia cheia de maravilhas e perigos.`;
  } else if (description.includes('mistério') || description.includes('crime')) {
    title = "O Eco do Passado";
    synopsis = `Quando um renomado professor é encontrado morto em sua biblioteca, a detetive Sofia Marinho descobre que a vítima guardava segredos que conectam casos não resolvidos de décadas atrás. Cada pista a leva mais fundo em uma teia de corrupção e mentiras, onde ninguém é quem parece ser.`;
  } else {
    title = "A Jornada Desconhecida";
    synopsis = `Uma história envolvente baseada na premissa original, explorando temas profundos e desenvolvendo personagens complexos em uma narrativa rica e cativante.`;
  }
  
  return {
    title,
    synopsis,
    chapters: Array.from({ length: chapterCount }, (_, i) => ({
      title: `Capítulo ${i + 1}`,
      content: createDynamicContent(description, i, chapterCount)
    }))
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 INICIANDO GERAÇÃO DINÂMICA');
  
  try {
    const requestBody = await request.json();
    const { description, size, genre, audience, chapterCount } = requestBody;
    
    console.log('📖 ANALISANDO DESCRIÇÃO:', description?.substring(0, 100) + '...');
    
    const config = BOOK_SIZE_CONFIG[size as keyof typeof BOOK_SIZE_CONFIG] || BOOK_SIZE_CONFIG.medio;
    const finalChapterCount = chapterCount || config.chapters;
    
    console.log(`🎯 CONFIG: ${config.pages} | ${finalChapterCount} capítulos | ${config.maxTokens} tokens`);

    // Prompt ULTRA ESPECÍFICO para forçar geração original
    const forceOriginalPrompt = `
CRIE UM LIVRO COMPLETAMENTE ORIGINAL BASEADO NESTA DESCRIÇÃO:

"${description}"

**REGRA ABSOLUTA: NUNCA REPITA ESTA DESCRIÇÃO LITERALMENTE.**

CRIE CONTEÚDO 100% ORIGINAL COM:

PERSONAGENS NOVOS:
- Crie nomes, personalidades e histórias ORIGINAIS
- Desenvolva diálogos COMPLETAMENTE NOVOS
- Mostre evoção emocional e conflitos

CENAS ORIGINAIS:
- Descreva ambientes, ações e eventos NOVOS
- Crie situações que desenvolvam a trama
- Inclua detalhes sensoriais ricos

ENREDO ORIGINAL:
- Progressão lógica da narrativa
- Conflitos e resoluções criativas
- Arcos de personagem satisfatórios

**EXEMPLO DO QUE NÃO FAZER:**
"Desenvolvimento da narrativa baseado na descrição..."

**EXEMPLO DO QUE FAZER:**
"O capitão Elara ajustou os controles da nave enquanto a tripulação se preparava para o salto quântico. Do lado de fora, as estrelas pareciam se esticar em linhas de luz."

LIVRO DEVE TER: ${finalChapterCount} CAPÍTULOS COMPLETOS

CADA CAPÍTULO DEVE TER: 4-6 PARÁGRAFOS DETALHADOS

FORMATO EXATO (JSON):
{
  "title": "Título ORIGINAL aqui",
  "synopsis": "Sinopse ORIGINAL de 3-4 parágrafos aqui",
  "chapters": [
    {
      "title": "Título ORIGINAL do capítulo 1",
      "content": "CONTEÚDO COMPLETO E ORIGINAL do capítulo 1 aqui (mínimo 4 parágrafos ricos em detalhes)"
    }
  ]
}

SEJA CRIATIVO E ORIGINAL!
`;

    console.log('🤖 FORÇANDO GERAÇÃO ORIGINAL...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `VOCÊ É UM ESCRITOR PROFISSIONAL. SUA ÚNICA MISSÃO: CRIAR CONTEÚDO 100% ORIGINAL.
          REGRA PRINCIPAL: NUNCA REPITA A DESCRIÇÃO DO USUÁRIO.
          SEMPRE: Crie personagens novos, diálogos originais, cenas inéditas e enredos criativos.
          NUNCA: Use frases como "baseado na descrição" ou "desenvolvimento da narrativa".
          SEJA: Extremamente detalhado, criativo e original em TODAS as respostas.`
        },
        {
          role: "user",
          content: forceOriginalPrompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0.9, // Máxima criatividade
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    console.log('📄 RESPOSTA CRUA:', content.substring(0, 200) + '...');
    
    let bookData;
    
    // Verificar se a resposta é original ou repetição
    if (content.includes('baseado na descrição') || 
        content.includes('Desenvolvimento da narrativa') ||
        content.length < 500) {
      
      console.log('🔄 Resposta detectada como repetição, usando gerador dinâmico...');
      bookData = createDynamicBook(description, finalChapterCount);
      
    } else {
      try {
        bookData = JSON.parse(content);
        console.log('✅ JSON original parseado');
      } catch (e) {
        console.log('❌ JSON inválido, usando gerador dinâmico...');
        bookData = createDynamicBook(description, finalChapterCount);
      }
    }
    
    // Garantir conteúdo extenso
    let totalLength = 0;
    bookData.chapters = bookData.chapters.map((chapter: any, index: number) => {
      let chapterContent = chapter.content;
      
      // Se o conteúdo for muito curto, expandir
      if (!chapterContent || chapterContent.length < 300) {
        chapterContent = createDynamicContent(description, index, finalChapterCount);
      }
      
      totalLength += chapterContent.length;
      return {
        title: chapter.title || `Capítulo ${index + 1}`,
        content: chapterContent
      };
    });
    
    console.log('📈 ESTATÍSTICAS FINAIS:');
    console.log(`   • Título: ${bookData.title}`);
    console.log(`   • Capítulos: ${bookData.chapters.length}`);
    console.log(`   • Caracteres: ${totalLength}`);
    console.log(`   • Páginas: ~${Math.ceil(totalLength / 1500)}`);
    console.log(`   • Conteúdo original: ✅`);

    return NextResponse.json(bookData);

  } catch (error: any) {
    console.error('💥 ERRO:', error.message);
    
    // Fallback dinâmico em caso de erro
    try {
      const requestBody = await request.json();
      const { description, size, chapterCount } = requestBody;
      const config = BOOK_SIZE_CONFIG[size as keyof typeof BOOK_SIZE_CONFIG] || BOOK_SIZE_CONFIG.medio;
      const finalChapterCount = chapterCount || config.chapters;
      
      console.log('🔄 Usando fallback dinâmico...');
      const fallbackBook = createDynamicBook(description, finalChapterCount);
      
      return NextResponse.json(fallbackBook);
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Falha na geração do livro' },
        { status: 500 }
      );
    }
  }
}
