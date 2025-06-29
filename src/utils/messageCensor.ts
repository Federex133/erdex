
// Lista de palabras prohibidas que serán censuradas
const BANNED_WORDS = [
  'puto',
  'puta',
  'porno',
  'hijo de puta',
  'hijodeputa',
  'cabrón',
  'cabron',
  'joder',
  'mierda',
  'coño',
  'cono',
  'gilipollas',
  'pendejo',
  'maricón',
  'maricon',
  'bolludo',
  'pelotudo',
  'la concha',
  'concha de tu madre',
  'vete a la mierda',
  'que te jodan',
  'follar',
  'verga',
  'chingar',
  'chingas',
  'mamadas',
  'putada',
  'putadas'
];

export const censorMessage = (message: string): string => {
  let censoredMessage = message;
  
  // Reemplazar cada palabra prohibida con ####
  BANNED_WORDS.forEach(word => {
    // Crear expresión regular que coincida con la palabra completa (case insensitive)
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    censoredMessage = censoredMessage.replace(regex, '####');
  });
  
  return censoredMessage;
};

export const containsBannedWords = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return BANNED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lowerMessage);
  });
};
