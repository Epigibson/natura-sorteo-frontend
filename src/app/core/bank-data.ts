/** Datos bancarios para recibir el pago de los boletos. Editar aquí si cambian. */
export interface BankData {
  accountNumber: string;
  clabe: string;
  cardNumber: string;
  beneficiary: string;
}

export const BANK_DATA: BankData = {
  accountNumber: '1563329976',
  clabe: '012680015633299762',
  cardNumber: '4152 3143 7635 7128',
  beneficiary: 'Yuribeth Garcia Solis',
};

/**
 * WhatsApp de la organizadora (10 dígitos, México). Los botones de "Enviar por
 * WhatsApp" abren el chat directo con este número, así el participante no
 * necesita tenerla agregada. Si se deja vacío, WhatsApp pide elegir contacto.
 */
export const ORGANIZER_WHATSAPP = '4461445984';

/** wa.me necesita lada de país; con 10 dígitos se asume México (52). */
export function organizerWaUrl(text: string): string {
  const tel = ORGANIZER_WHATSAPP.replace(/\D/g, '');
  const num = tel.length === 10 ? '52' + tel : tel;
  return 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
}

/** Bloque de texto listo para pegar en WhatsApp / mensajes. */
export function bankDataText(): string {
  return (
    `Datos para pago:\n` +
    `Beneficiario: ${BANK_DATA.beneficiary}\n` +
    `Cuenta: ${BANK_DATA.accountNumber}\n` +
    `CLABE: ${BANK_DATA.clabe}\n` +
    `Tarjeta: ${BANK_DATA.cardNumber}`
  );
}
