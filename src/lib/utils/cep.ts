export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarCep(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

type RespostaViaCep = {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

// Busca best-effort no ViaCEP — se falhar (rede fora, CEP inválido,
// serviço indisponível), retorna null e o atendente preenche o
// endereço na mão, igual sempre foi.
export async function buscarEnderecoPorCep(cep: string): Promise<RespostaViaCep | null> {
  const digitos = apenasDigitos(cep);
  if (digitos.length !== 8) return null;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as RespostaViaCep;
    if (dados.erro) return null;

    return dados;
  } catch {
    return null;
  }
}
