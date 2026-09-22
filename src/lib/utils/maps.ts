export function linkGoogleMaps(endereco: string, bairro?: string | null): string {
  const destino = [endereco, bairro].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}
