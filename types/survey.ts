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

export interface Option {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: Option[];
  min?: number;
  max?: number;
  buttonLabel?: string;
  skipLogic?: (answers: Record<string, any>) => boolean;
}

export interface SurveyConfig {
  id: string;
  title: string;
  intro: {
    heading: string;
    subheading: string;
    description: string[];
    buttonText: string;
  };
  questions: Question[];
  completion: {
    title: string;
    message: string;
  };
}

export type Answers = Record<string, any>;
