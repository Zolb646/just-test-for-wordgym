/**
 * Input validation utilities for WordGym
 */

import { Rating } from "./store";

/**
 * Validation result type
 */
export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * Valid ratings for cards
 */
const VALID_RATINGS: Rating[] = ["again", "hard", "good", "easy"];

/**
 * Validate deck name
 */
export function validateDeckName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: "Deck name cannot be empty" };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: "Deck name must be 100 characters or less" };
  }

  return { isValid: true };
}

/**
 * Validate card word
 */
export function validateCardWord(word: string): ValidationResult {
  const trimmed = word.trim();

  if (!trimmed) {
    return { isValid: false, error: "Word cannot be empty" };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: "Word must be 500 characters or less" };
  }

  return { isValid: true };
}

/**
 * Validate card translation
 */
export function validateCardTranslation(translation: string): ValidationResult {
  const trimmed = translation.trim();

  if (!trimmed) {
    return { isValid: false, error: "Translation cannot be empty" };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: "Translation must be 500 characters or less" };
  }

  return { isValid: true };
}

/**
 * Validate card data (word + translation)
 */
export function validateCard(word: string, translation: string): ValidationResult {
  const wordResult = validateCardWord(word);
  if (!wordResult.isValid) {
    return wordResult;
  }

  const translationResult = validateCardTranslation(translation);
  if (!translationResult.isValid) {
    return translationResult;
  }

  return { isValid: true };
}

/**
 * Validate rating value
 */
export function validateRating(rating: string): ValidationResult {
  if (!VALID_RATINGS.includes(rating as Rating)) {
    return {
      isValid: false,
      error: `Invalid rating. Must be one of: ${VALID_RATINGS.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate ID format (timestamp-based)
 */
export function validateId(id: string): ValidationResult {
  if (!id || typeof id !== "string") {
    return { isValid: false, error: "ID is required" };
  }

  if (id.length === 0) {
    return { isValid: false, error: "ID cannot be empty" };
  }

  return { isValid: true };
}

/**
 * Sanitize string input (trim whitespace)
 */
export function sanitizeString(input: string): string {
  return input.trim();
}

/**
 * Sanitize deck name
 */
export function sanitizeDeckName(name: string): string {
  return sanitizeString(name).slice(0, 100);
}

/**
 * Sanitize card content
 */
export function sanitizeCardContent(content: string): string {
  return sanitizeString(content).slice(0, 500);
}
