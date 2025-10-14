export interface BookTemplate {
  id: string;
  title: string;
  description: string;
  genre: string;
  audience: string;
  icon: string;
  prompt: string;
  tags: string[];
  recommendedSize: 'small' | 'medium' | 'large';
}

export const bookTemplates: BookTemplate[] = [
  {
    id: 'fantasy-adventure',
    title: 'Aventura Fantástica',
    description: 'Uma jornada épica em um mundo de magia e criaturas místicas',
    genre: 'fantasia',
    audience: 'jovens',
    icon: '🐉',
    recommendedSize: 'large',
    prompt: `Crie uma aventura épica em um mundo de fantasia com os seguintes elementos:
- Um herói/heroína com um destino especial
- Um companheiro leal e divertido
- Um vilão poderoso com motivações complexas
- Magia, criaturas místicas e locais encantados
- Uma jornada com desafios emocionantes
- Um tema sobre amizade, coragem e autodescoberta`,
    tags: ['épico', 'magia', 'jornada', 'amizade']
  },
  {
    id: 'space-opera',
    title: 'Ópera Espacial',
    description: 'Aventuras interestelares com naves espaciais e civilizações alienígenas',
    genre: 'ficcao',
    audience: 'adultos',
    icon: '🚀',
    recommendedSize: 'large',
    prompt: `Crie uma emocionante ópera espacial com:
- Uma tripulação diversificada de uma nave espacial
- Descobertas de civilizações alienígenas antigas
- Conflitos interestelares e diplomacia galáctica
- Tecnologia avançada e viagens mais rápidas que a luz
- Mistérios cósmicos e fenômenos espaciais
- Temas sobre humanidade, exploração e coexistência`,
    tags: ['espaço', 'alienígenas', 'tecnologia', 'exploração']
  },
  {
    id: 'romantic-comedy',
    title: 'Comédia Romântica',
    description: 'Histórias de amor com situações engraçadas e finais felizes',
    genre: 'romance',
    audience: 'adultos',
    icon: '💕',
    recommendedSize: 'medium',
    prompt: `Crie uma comédia romântica divertida com:
- Dois personagens com personalidades opostas
- Encontros acidentais e situações embaraçosas
- Amigos ou familiares que atrapalham ou ajudam
- Conflitos que testam o relacionamento
- Cenas românticas e momentos engraçados
- Um final feliz e satisfatório`,
    tags: ['amor', 'humor', 'relacionamento', 'felicidade']
  },
  {
    id: 'mystery-thriller',
    title: 'Mistério e Suspense',
    description: 'Histórias intrigantes com reviravoltas e investigações',
    genre: 'suspense',
    audience: 'adultos',
    icon: '🕵️',
    recommendedSize: 'medium',
    prompt: `Crie uma história de mistério e suspense com:
- Um crime ou evento inexplicável
- Um detetive ou investigador determinado
- Pistas que levam a revelações surpreendentes
- Suspeitos com motivos e segredos
- Tensão crescente e momentos de perigo
- Uma reviravolta final inesperada`,
    tags: ['mistério', 'investigação', 'suspense', 'reviravolta']
  },
  {
    id: 'children-fable',
    title: 'Fábula Infantil',
    description: 'Contos educativos com animais falantes e lições de moral',
    genre: 'infantil',
    audience: 'criancas',
    icon: '🐻',
    recommendedSize: 'small',
    prompt: `Crie uma fábula infantil educativa com:
- Animais personificados com características humanas
- Um conflito ou problema simples de entender
- Uma jornada de aprendizado e descoberta
- Diálogos simples e apropriados para crianças
- Uma lição de moral positiva no final
- Elementos de fantasia e magia suave`,
    tags: ['educativo', 'animais', 'lição', 'fantasia']
  },
  {
    id: 'superhero-origin',
    title: 'Origem de Super-herói',
    description: 'A história de como um herói comum ganha poderes extraordinários',
    genre: 'aventura',
    audience: 'jovens',
    icon: '🦸',
    recommendedSize: 'medium',
    prompt: `Crie uma história de origem de super-herói com:
- Um personagem comum que ganha poderes inesperados
- A descoberta e aprendizado sobre os novos poderes
- Um vilão ou ameaça que precisa ser enfrentada
- Conflitos entre vida normal e responsabilidades de herói
- Aliados que ajudam na jornada
- Uma batalha final emocionante`,
    tags: ['poderes', 'herói', 'responsabilidade', 'ação']
  },
  {
    id: 'time-travel',
    title: 'Viagem no Tempo',
    description: 'Aventuras através do tempo com paradoxos e consequências',
    genre: 'ficcao',
    audience: 'adultos',
    icon: '⏰',
    recommendedSize: 'medium',
    prompt: `Crie uma história de viagem no tempo com:
- Um dispositivo ou habilidade de viajar no tempo
- Diferentes períodos históricos visitados
- Paradoxos temporais e consequências inesperadas
- Personagens de diferentes épocas
- Decisões que alteram a linha do tempo
- Um dilema moral sobre interferir no passado`,
    tags: ['tempo', 'história', 'paradoxo', 'aventura']
  },
  {
    id: 'magic-school',
    title: 'Escola de Magia',
    description: 'Aventuras de jovens aprendizes em uma escola mágica',
    genre: 'fantasia',
    audience: 'jovens',
    icon: '🏰',
    recommendedSize: 'large',
    prompt: `Crie uma história em uma escola de magia com:
- Jovens estudantes aprendendo feitiços e poções
- Professores excêntricos e sábios
- Amizades, rivalidades e competições escolares
- Mistérios e segredos na escola
- Ameaças mágicas que precisam ser enfrentadas
- Crescimento pessoal e descoberta de talentos`,
    tags: ['escola', 'magia', 'amizade', 'aprendizado']
  },
  {
    id: 'detective-noir',
    title: 'Noir Detetivesco',
    description: 'Histórias de detetives em cenários urbanos sombrios',
    genre: 'suspense',
    audience: 'adultos',
    icon: '🎩',
    recommendedSize: 'medium',
    prompt: `Crie uma história noir com:
- Um detetive cínico e endurecido
- Uma cidade grande com sombras e segredos
- Uma mulher fatal misteriosa
- Corrupção e crimes nos bastidores do poder
- Diálogos afiados e atmosfera melancólica
- Um final ambíguo ou surpreendente`,
    tags: ['noir', 'detetive', 'cidade', 'mistério']
  },
  {
    id: 'animal-adventure',
    title: 'Aventura Animal',
    description: 'Jornadas emocionantes protagonizadas por animais',
    genre: 'aventura',
    audience: 'criancas',
    icon: '🐾',
    recommendedSize: 'small',
    prompt: `Crie uma aventura com animais como protagonistas:
- Um grupo de animais amigos em uma missão
- Um ambiente natural (floresta, savana, oceano)
- Desafios da natureza e perigos reais
- Trabalho em equipe e cooperação
- Valores como amizade, coragem e perseverança
- Um final feliz e reconfortante`,
    tags: ['animais', 'natureza', 'amizade', 'aventura']
  }
];

// Funções utilitárias para trabalhar com templates
export function getTemplateById(id: string): BookTemplate | undefined {
  return bookTemplates.find(template => template.id === id);
}

export function getTemplatesByGenre(genre: string): BookTemplate[] {
  return bookTemplates.filter(template => template.genre === genre);
}

export function getTemplatesByAudience(audience: string): BookTemplate[] {
  return bookTemplates.filter(template => template.audience === audience);
}

export function getRandomTemplate(): BookTemplate {
  const randomIndex = Math.floor(Math.random() * bookTemplates.length);
  return bookTemplates[randomIndex];
}

export function searchTemplates(query: string): BookTemplate[] {
  const lowerQuery = query.toLowerCase();
  return bookTemplates.filter(template =>
    template.title.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Template para criação customizada (sem template)
export const customTemplate: BookTemplate = {
  id: 'custom',
  title: 'Criação Personalizada',
  description: 'Crie um livro totalmente único com sua própria ideia',
  genre: 'aventura',
  audience: 'adultos',
  icon: '✨',
  recommendedSize: 'medium',
  prompt: '',
  tags: ['personalizado', 'único', 'criatividade']
};
