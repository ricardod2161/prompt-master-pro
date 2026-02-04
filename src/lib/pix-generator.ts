/**
 * Gerador de código Pix no formato EMV (padrão brasileiro)
 * Gera códigos Pix "copia e cola" compatíveis com todos os bancos
 */

interface PixPayload {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  transactionId?: string;
  description?: string;
}

// Calcula CRC16 CCITT-FALSE (padrão Pix)
function crc16(str: string): string {
  let crc = 0xFFFF;
  
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Formata um campo EMV (ID + tamanho + valor)
function formatField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

// Remove acentos e caracteres especiais
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .substring(0, 25)
    .toUpperCase();
}

// Detecta o tipo de chave Pix
export function detectPixKeyType(key: string): 'cpf' | 'cnpj' | 'phone' | 'email' | 'random' | 'invalid' {
  const cleanKey = key.replace(/\D/g, '');
  
  // CPF: 11 dígitos numéricos
  if (/^\d{11}$/.test(cleanKey)) {
    return 'cpf';
  }
  
  // CNPJ: 14 dígitos numéricos
  if (/^\d{14}$/.test(cleanKey)) {
    return 'cnpj';
  }
  
  // Telefone: +55 + DDD + número (11-13 dígitos)
  if (/^\+?55\d{10,11}$/.test(key.replace(/[\s\-()]/g, '')) || /^\d{10,11}$/.test(cleanKey)) {
    return 'phone';
  }
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
    return 'email';
  }
  
  // Chave aleatória: UUID ou string de 32-36 caracteres
  if (/^[a-f0-9-]{32,36}$/i.test(key)) {
    return 'random';
  }
  
  return 'invalid';
}

// Formata a chave Pix para o padrão EMV
function formatPixKey(key: string): string {
  const type = detectPixKeyType(key);
  
  switch (type) {
    case 'cpf':
    case 'cnpj':
      return key.replace(/\D/g, '');
    case 'phone':
      const cleanPhone = key.replace(/\D/g, '');
      if (cleanPhone.startsWith('55')) return `+${cleanPhone}`;
      return `+55${cleanPhone}`;
    case 'email':
      return key.toLowerCase();
    case 'random':
    default:
      return key;
  }
}

/**
 * Gera um código Pix EMV completo (copia e cola)
 */
export function generatePixCode({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  transactionId,
  description,
}: PixPayload): string {
  // Formata a chave Pix
  const formattedKey = formatPixKey(pixKey);
  
  // Merchant Account Information (ID: 26)
  // GUI: br.gov.bcb.pix (obrigatório)
  // Chave Pix (ID: 01)
  // Descrição (ID: 02) - opcional
  let merchantAccount = formatField('00', 'br.gov.bcb.pix');
  merchantAccount += formatField('01', formattedKey);
  if (description) {
    merchantAccount += formatField('02', normalizeString(description).substring(0, 25));
  }
  
  // Monta o payload
  let payload = '';
  
  // Payload Format Indicator (ID: 00) - obrigatório
  payload += formatField('00', '01');
  
  // Merchant Account Information (ID: 26)
  payload += formatField('26', merchantAccount);
  
  // Merchant Category Code (ID: 52) - obrigatório
  payload += formatField('52', '0000');
  
  // Transaction Currency (ID: 53) - 986 = BRL
  payload += formatField('53', '986');
  
  // Transaction Amount (ID: 54) - opcional
  if (amount && amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }
  
  // Country Code (ID: 58) - BR
  payload += formatField('58', 'BR');
  
  // Merchant Name (ID: 59) - obrigatório
  payload += formatField('59', normalizeString(merchantName));
  
  // Merchant City (ID: 60) - obrigatório
  payload += formatField('60', normalizeString(merchantCity));
  
  // Additional Data Field Template (ID: 62) - opcional
  if (transactionId) {
    const additionalData = formatField('05', transactionId.substring(0, 25).toUpperCase());
    payload += formatField('62', additionalData);
  }
  
  // CRC16 (ID: 63) - obrigatório, sempre no final
  payload += '6304';
  const crc = crc16(payload);
  payload += crc;
  
  return payload;
}

/**
 * Valida se uma chave Pix é válida
 */
export function isValidPixKey(key: string): boolean {
  return detectPixKeyType(key) !== 'invalid';
}

/**
 * Formata a chave Pix para exibição
 */
export function formatPixKeyForDisplay(key: string): string {
  const type = detectPixKeyType(key);
  const cleanKey = key.replace(/\D/g, '');
  
  switch (type) {
    case 'cpf':
      return cleanKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    case 'cnpj':
      return cleanKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    case 'phone':
      if (cleanKey.length === 11) {
        return cleanKey.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      return cleanKey.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    default:
      return key;
  }
}
