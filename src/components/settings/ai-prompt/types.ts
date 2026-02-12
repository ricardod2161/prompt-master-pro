export interface PromptFormData {
  restaurantName: string;
  businessType: string;
  businessDescription: string;
  operatingDays: string[];
  operatingHours: { open: string; close: string };
  paymentMethods: string[];
  pixKey: string;
  hasDelivery: boolean;
  deliveryFee: string;
  hasPickup: boolean;
  avgPrepTime: string;
  voiceTone: string;
  emojiLevel: string;
  botName: string;
  specialRules: string;
}

export const defaultFormData: PromptFormData = {
  restaurantName: "",
  businessType: "",
  businessDescription: "",
  operatingDays: [],
  operatingHours: { open: "08:00", close: "22:00" },
  paymentMethods: [],
  pixKey: "",
  hasDelivery: false,
  deliveryFee: "0",
  hasPickup: true,
  avgPrepTime: "",
  voiceTone: "profissional",
  emojiLevel: "moderado",
  botName: "",
  specialRules: "",
};

export const BUSINESS_TYPES = [
  { value: "pizzaria", label: "🍕 Pizzaria" },
  { value: "hamburgueria", label: "🍔 Hamburgueria" },
  { value: "churrascaria", label: "🥩 Churrascaria" },
  { value: "restaurante", label: "🍽️ Restaurante" },
  { value: "lanchonete", label: "🌭 Lanchonete" },
  { value: "padaria", label: "🥖 Padaria" },
  { value: "doceria", label: "🧁 Doceria" },
  { value: "cafeteria", label: "☕ Cafeteria" },
  { value: "japonesa", label: "🍣 Comida Japonesa" },
  { value: "acaiteria", label: "🫐 Açaiteria" },
  { value: "outro", label: "📋 Outro" },
];

export const DAYS_OF_WEEK = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

export const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credito", label: "Cartão Crédito" },
  { value: "debito", label: "Cartão Débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "vale_refeicao", label: "Vale Refeição" },
];

export const VOICE_TONES = [
  { value: "descontraido", label: "😄 Descontraído" },
  { value: "profissional", label: "👔 Profissional" },
  { value: "formal", label: "🎩 Formal" },
  { value: "divertido", label: "🎉 Divertido" },
];

export const EMOJI_LEVELS = [
  { value: "nenhum", label: "Nenhum" },
  { value: "moderado", label: "Moderado" },
  { value: "bastante", label: "Bastante" },
];
