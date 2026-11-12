export function parseRiskSequenceNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return parsed;
}

export function denseRiskNumbers(entries: Array<{ id: string; numero: string }>): Map<string, string> {
  const sorted = [...entries].sort((left, right) => {
    const leftNumber = parseRiskSequenceNumber(left.numero) ?? Number.MAX_SAFE_INTEGER;
    const rightNumber = parseRiskSequenceNumber(right.numero) ?? Number.MAX_SAFE_INTEGER;
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
    return left.id.localeCompare(right.id);
  });
  return new Map(sorted.map((entry, index) => [entry.id, String(index + 1)]));
}

export function nextRiskNumber(numbers: Iterable<string>): string {
  let max = 0;
  for (const value of numbers) {
    const parsed = parseRiskSequenceNumber(value);
    if (parsed !== null && parsed > max) max = parsed;
  }
  return String(max + 1);
}

function numberCounts(risks: Array<{ numeroRisque: string }>): Map<number, number> {
  const counts = new Map<number, number>();
  for (const risk of risks) {
    const number = parseRiskSequenceNumber(risk.numeroRisque);
    if (number === null) continue;
    counts.set(number, (counts.get(number) ?? 0) + 1);
  }
  return counts;
}

export function closeRiskNumberGap<T extends { id: string; numeroRisque: string }>(
  risks: T[],
  deletedId: string,
): T[] {
  const deleted = risks.find((risk) => String(risk.id) === String(deletedId));
  const remaining = risks.filter((risk) => String(risk.id) !== String(deletedId));
  if (!deleted) return remaining;

  const deletedNumber = parseRiskSequenceNumber(deleted.numeroRisque);
  const counts = numberCounts(risks);
  if (deletedNumber === null || counts.get(deletedNumber) !== 1) return remaining;

  return remaining.map((risk) => {
    const number = parseRiskSequenceNumber(risk.numeroRisque);
    if (number === null || number <= deletedNumber || counts.get(number) !== 1) return risk;
    return { ...risk, numeroRisque: String(number - 1) };
  });
}
