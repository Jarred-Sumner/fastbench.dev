import { init, parse as parseLexer } from "es-module-lexer/dist/lexer.js";
export type LexerType = { s: number; e: number; ss: number; se: number };
export async function useLexer(code: string) {
  await init;

  const [imports] = parseLexer(code);

  return imports;
}

export default async function parse(_code: string): Promise<LexerType[]> {
  return useLexer(_code);
}
