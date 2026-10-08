/**
 * Allowed input types for survey question rendering and answer validation.
 */
export type QuestionType =
  | "text"
  | "textarea"
  | "rating"
  | "single-choice"
  | "multiple-choice"
  | "yes-no"
  | "select"
  | "number"
  | "email";

/**
 * Option item for choices in single/multiple selection questions.
 */
export interface Option {
  label: string;
  value: string;
}

/**
 * Survey question configuration object.
 */
export interface Question {
  /** Unique question identifier used as key in the answers dictionary */
  id: string;
  /** Input rendering and validation type */
  type: QuestionType;
  /** Primary question title / prompt text */
  title: string;
  /** Optional secondary subtitle or instructions */
  description?: string;
  /** Input placeholder for text/email/number fields */
  placeholder?: string;
  /** Whether answering this question is mandatory before progressing */
  required?: boolean;
  /** Options list for choice-based questions */
  options?: Option[];
  /** Minimum value for numbers or rating scale */
  min?: number;
  /** Maximum value for numbers or rating scale */
  max?: number;
  /** Custom button label for proceeding */
  buttonLabel?: string;
  /** Dynamic skip logic evaluated against previous answers */
  skipLogic?: (answers: Record<string, any>) => boolean;
}

/**
 * Complete survey layout, intro banner, and completion configuration.
 */
export interface SurveyConfig {
  /** Survey schema version / ID */
  id: string;
  /** Main survey display title */
  title: string;
  /** Survey introduction card configuration */
  intro: {
    heading: string;
    subheading: string;
    description: string[];
    buttonText: string;
  };
  /** Ordered list of questions to render sequentially */
  questions: Question[];
  /** Completion screen headline and thank-you message */
  completion: {
    title: string;
    message: string;
  };
}

/**
 * User answers mapping question ID to user input value.
 */
export type Answers = Record<string, any>;

