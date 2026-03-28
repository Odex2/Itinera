import { OnboardingQuestion } from '../types';

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: 1,
    title: 'Sei appena arrivato a destinazione',
    subtitle: "Qual e' la prima cosa che fai?",
    options: [
      {
        id: '1a',
        text: 'Cerco subito un ristorantino tipico per assaggiare la specialita locale',
        icon: '/food',
        categories: ['enogastronomia'],
        personalityBoost: { socialita: 2, relax: 1 },
      },
      {
        id: '1b',
        text: 'Mi perdo nel centro storico per ammirare i monumenti',
        icon: '/history',
        categories: ['storia', 'cultura'],
        personalityBoost: { cultura: 2, avventura: 1 },
      },
      {
        id: '1c',
        text: 'Cerco il punto panoramico piu alto o un bel parco per orientarmi',
        icon: '/nature',
        categories: ['paesaggio', 'natura'],
        personalityBoost: { avventura: 2, relax: 1 },
      },
      {
        id: '1d',
        text: 'Faccio un giro nella via principale per sbirciare le vetrine',
        icon: '/shopping',
        categories: ['shopping'],
        personalityBoost: { socialita: 1, divertimento: 2 },
      },
    ],
  },
  {
    id: 2,
    title: 'Il pomeriggio perfetto',
    subtitle: 'Hai qualche ora libera, come la riempi?',
    options: [
      {
        id: '2a',
        text: "Entro in quel museo o galleria d'arte di cui ho tanto sentito parlare",
        icon: '/art',
        categories: ['arte', 'cultura'],
        personalityBoost: { cultura: 2, relax: 1 },
      },
      {
        id: '2b',
        text: 'Noleggio una bici o cerco un bel sentiero per fare movimento',
        icon: '/sport',
        categories: ['sport', 'natura'],
        personalityBoost: { avventura: 2, divertimento: 1 },
      },
      {
        id: '2c',
        text: 'Entro nel laboratorio di un creatore locale per vedere come lavora',
        icon: '/craft',
        categories: ['artigianato'],
        personalityBoost: { cultura: 1, socialita: 2 },
      },
      {
        id: '2d',
        text: "Cerco un'attrazione interattiva, un parco o un gioco che faccia divertire tutti",
        icon: '/fun',
        categories: ['intrattenimento', 'family'],
        personalityBoost: { divertimento: 2, socialita: 1 },
      },
    ],
  },
  {
    id: 3,
    title: 'Il souvenir',
    subtitle: "E' ora di tornare a casa, cosa metti in valigia?",
    options: [
      {
        id: '3a',
        text: 'Una bottiglia di vino, formaggi o dolci tipici',
        icon: '/wine',
        categories: ['enogastronomia'],
        personalityBoost: { relax: 1, socialita: 2 },
      },
      {
        id: '3b',
        text: 'Un oggetto unico fatto a mano in una piccola bottega',
        icon: '/handmade',
        categories: ['artigianato', 'arte'],
        personalityBoost: { cultura: 2, relax: 1 },
      },
      {
        id: '3c',
        text: "Un capo d'abbigliamento o un accessorio che ho puntato ieri",
        icon: '/fashion',
        categories: ['shopping'],
        personalityBoost: { divertimento: 1, socialita: 1 },
      },
      {
        id: '3d',
        text: 'Tante foto ricordo, una calamita buffa e regali per i bambini',
        icon: '/photos',
        categories: ['family', 'intrattenimento'],
        personalityBoost: { divertimento: 2, socialita: 1 },
      },
    ],
  },
  {
    id: 4,
    title: 'Il ritmo',
    subtitle: 'Come definiresti il tuo "passo" ideale?',
    options: [
      {
        id: '4a',
        text: 'Tranquillo e accessibile: cerco comodita e spazi adatti anche ai piu piccoli',
        icon: '/family',
        categories: ['family'],
        personalityBoost: { relax: 2, socialita: 1 },
      },
      {
        id: '4b',
        text: "Avventuroso e attivo: zaino in spalla, pronto a sudare e faticare un po'",
        icon: '/adventure',
        categories: ['sport', 'natura'],
        personalityBoost: { avventura: 3 },
      },
      {
        id: '4c',
        text: 'Curioso e attento: voglio il tempo di leggere i cartelli e scoprire i dettagli',
        icon: '/curious',
        categories: ['storia', 'cultura'],
        personalityBoost: { cultura: 3 },
      },
      {
        id: '4d',
        text: 'Vivace e spensierato: voglio leggerezza, sorrisi e stimoli continui',
        icon: '/lively',
        categories: ['intrattenimento'],
        personalityBoost: { divertimento: 3 },
      },
    ],
  },
  {
    id: 5,
    title: 'Il momento magico',
    subtitle: 'Il sole sta tramontando, dove vorresti essere?',
    options: [
      {
        id: '5a',
        text: 'Seduto a fare un aperitivo degustazione in una bella piazza antica',
        icon: '/aperitivo',
        categories: ['enogastronomia', 'storia'],
        personalityBoost: { relax: 2, socialita: 2 },
      },
      {
        id: '5b',
        text: 'In cima a una collina o in mezzo al verde per godermi i colori del cielo',
        icon: '/sunset',
        categories: ['natura', 'paesaggio'],
        personalityBoost: { relax: 2, avventura: 1 },
      },
      {
        id: '5c',
        text: "Seduto in platea ad aspettare l'inizio di uno spettacolo o di un concerto",
        icon: '/show',
        categories: ['intrattenimento', 'arte'],
        personalityBoost: { cultura: 1, divertimento: 2 },
      },
      {
        id: '5d',
        text: 'A passeggiare tra mercatini serali, luci e vetrine illuminate',
        icon: '/market',
        categories: ['shopping', 'artigianato'],
        personalityBoost: { divertimento: 1, socialita: 2 },
      },
    ],
  },
];

export const dietaryOptions = [
  { id: 'none', label: 'Nessuna restrizione' },
  { id: 'vegetarian', label: 'Vegetariano' },
  { id: 'vegan', label: 'Vegano' },
  { id: 'celiac', label: 'Celiaco' },
  { id: 'lactose', label: 'Intollerante al lattosio' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];
