const saldos: Map<string, number> = new Map();

export async function getSaldo(userId: string): Promise<number> {
  return saldos.get(userId) ?? 100;
}

export async function addSaldo(userId: string, amount: number): Promise<number> {
  const saldoAtual = saldos.get(userId) ?? 100;
  const novoSaldo = saldoAtual + amount;
  saldos.set(userId, novoSaldo);
  return novoSaldo;
}

// Função para obter múltiplos saldos de uma vez (otimizada para rank)
export async function getMultipleSaldos(userIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  
  for (const userId of userIds) {
    result.set(userId, saldos.get(userId) ?? 100);
  }
  
  return result;
}

// Função para obter todos os saldos não-padrão (para ranking)
export async function getAllNonDefaultSaldos(): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  
  for (const [userId, saldo] of saldos.entries()) {
    if (saldo > 100) { // Apenas usuários com saldo diferente do padrão
      result.set(userId, saldo);
    }
  }
  
  return result;
}

export async function getSaldoMessage(userId: string, userMention: string): Promise<string> {
  const saldo = await getSaldo(userId);

  return `${userMention}, seu saldo dentro do banco da Myra está com **${saldo.toLocaleString()}** de petiscos.
----------------------------------------------------------------------------------------------
Você pode analisar suas características em \`/rank\` ou se você quiser ganhar, temos exatamente minigames para você se divertir e farmar bastante petiscos e se tornar o mais **Rico**! 🤑🌮`;
}

export async function closeSaldoClient() {
}
