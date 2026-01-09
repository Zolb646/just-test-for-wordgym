/**
 * Data export and import utilities for WordGym
 * Supports JSON and CSV formats for backup and data transfer
 */

import { Deck, Rating } from "./store";
import { validateDeckName, validateCard } from "./validation";

/**
 * Export format types
 */
export type ExportFormat = "json" | "csv";

/**
 * Export data structure
 */
export type ExportData = {
  version: string;
  exportedAt: string;
  decks: ExportedDeck[];
};

/**
 * Exported deck structure
 */
export type ExportedDeck = {
  name: string;
  cards: ExportedCard[];
};

/**
 * Exported card structure
 */
export type ExportedCard = {
  word: string;
  translation: string;
  lastRating?: Rating;
};

/**
 * Import result
 */
export type ImportResult = {
  success: boolean;
  decksImported: number;
  cardsImported: number;
  errors: string[];
};

/**
 * Current export version
 */
const EXPORT_VERSION = "1.0";

/**
 * Export decks to JSON format
 */
export function exportToJSON(decks: Deck[]): string {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    decks: decks.map((deck) => ({
      name: deck.name,
      cards: deck.cards.map((card) => ({
        word: card.word,
        translation: card.translation,
        lastRating: card.lastRating,
      })),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export a single deck to JSON format
 */
export function exportDeckToJSON(deck: Deck): string {
  return exportToJSON([deck]);
}

/**
 * Export decks to CSV format
 */
export function exportToCSV(decks: Deck[]): string {
  const lines: string[] = [];

  // Header
  lines.push("deck_name,word,translation,last_rating");

  // Data rows
  for (const deck of decks) {
    for (const card of deck.cards) {
      const row = [
        escapeCSV(deck.name),
        escapeCSV(card.word),
        escapeCSV(card.translation),
        card.lastRating || "",
      ];
      lines.push(row.join(","));
    }
  }

  return lines.join("\n");
}

/**
 * Export a single deck to CSV format
 */
export function exportDeckToCSV(deck: Deck): string {
  return exportToCSV([deck]);
}

/**
 * Parse JSON import data
 */
export function parseJSONImport(
  jsonString: string
): ImportResult & { data?: ExportData } {
  const errors: string[] = [];

  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.decks || !Array.isArray(data.decks)) {
      return {
        success: false,
        decksImported: 0,
        cardsImported: 0,
        errors: ["Invalid JSON structure: missing decks array"],
      };
    }

    let decksImported = 0;
    let cardsImported = 0;

    // Validate each deck
    for (let i = 0; i < data.decks.length; i++) {
      const deck = data.decks[i];

      if (!deck.name) {
        errors.push(`Deck ${i + 1}: missing name`);
        continue;
      }

      const nameValidation = validateDeckName(deck.name);
      if (!nameValidation.isValid) {
        errors.push(`Deck "${deck.name}": ${nameValidation.error}`);
        continue;
      }

      if (!deck.cards || !Array.isArray(deck.cards)) {
        errors.push(`Deck "${deck.name}": missing cards array`);
        continue;
      }

      decksImported++;

      // Validate cards
      for (let j = 0; j < deck.cards.length; j++) {
        const card = deck.cards[j];

        if (!card.word || !card.translation) {
          errors.push(
            `Deck "${deck.name}", Card ${j + 1}: missing word or translation`
          );
          continue;
        }

        const cardValidation = validateCard(card.word, card.translation);
        if (!cardValidation.isValid) {
          errors.push(
            `Deck "${deck.name}", Card ${j + 1}: ${cardValidation.error}`
          );
          continue;
        }

        cardsImported++;
      }
    }

    return {
      success: errors.length === 0,
      decksImported,
      cardsImported,
      errors,
      data: data as ExportData,
    };
  } catch (error) {
    return {
      success: false,
      decksImported: 0,
      cardsImported: 0,
      errors: [
        `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

/**
 * Parse CSV import data
 */
export function parseCSVImport(
  csvString: string
): ImportResult & { data?: ExportData } {
  const errors: string[] = [];
  const lines = csvString.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    return {
      success: false,
      decksImported: 0,
      cardsImported: 0,
      errors: ["CSV file is empty or has no data rows"],
    };
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const deckMap = new Map<string, ExportedCard[]>();

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const columns = parseCSVLine(line);

    if (columns.length < 3) {
      errors.push(`Row ${i + 2}: insufficient columns (expected at least 3)`);
      continue;
    }

    const [deckName, word, translation, lastRating] = columns;

    const nameValidation = validateDeckName(deckName);
    if (!nameValidation.isValid) {
      errors.push(`Row ${i + 2}: ${nameValidation.error}`);
      continue;
    }

    const cardValidation = validateCard(word, translation);
    if (!cardValidation.isValid) {
      errors.push(`Row ${i + 2}: ${cardValidation.error}`);
      continue;
    }

    if (!deckMap.has(deckName)) {
      deckMap.set(deckName, []);
    }

    const card: ExportedCard = {
      word: word.trim(),
      translation: translation.trim(),
    };

    if (lastRating && isValidRating(lastRating)) {
      card.lastRating = lastRating as Rating;
    }

    deckMap.get(deckName)!.push(card);
  }

  const decks: ExportedDeck[] = Array.from(deckMap.entries()).map(
    ([name, cards]) => ({
      name,
      cards,
    })
  );

  const cardsImported = decks.reduce((sum, deck) => sum + deck.cards.length, 0);

  return {
    success: errors.length === 0,
    decksImported: decks.length,
    cardsImported,
    errors,
    data: {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      decks,
    },
  };
}

/**
 * Escape a value for CSV output
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Check if a string is a valid rating
 */
function isValidRating(value: string): boolean {
  return ["again", "hard", "good", "easy"].includes(value.toLowerCase());
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  format: ExportFormat,
  deckName?: string
): string {
  const date = new Date().toISOString().split("T")[0];
  const baseName = deckName
    ? `wordgym-${sanitizeFilename(deckName)}`
    : "wordgym-export";
  return `${baseName}-${date}.${format}`;
}

/**
 * Sanitize string for use in filename
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
