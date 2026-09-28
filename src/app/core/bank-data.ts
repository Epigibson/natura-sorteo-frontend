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
