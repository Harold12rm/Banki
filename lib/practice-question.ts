export type PracticeOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type PracticeQuestion = {
  id: string;
  prompt: string;
  explanation: string;
  topic: string;
  subtopic: string | null;
  difficulty: string;
  options: PracticeOption[];
};
