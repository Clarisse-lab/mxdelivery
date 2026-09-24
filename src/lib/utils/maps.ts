export function linkGoogleMaps(endereco: string, bairro?: string | null, cep?: string | null): string {
  const destino = [endereco, bairro, cep, "Governador Valadares - MG"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}
