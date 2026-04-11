// /data/questions.ts
export type Question = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const quizData: Question[] = [
  {
    id: 1,
    question: "生命保険の基本原則において、「一人は万人のために、万人は一人のために」という精神を何と呼ぶ？",
    options: ["相互扶助", "自己責任", "公助", "共助"],
    answer: 0,
    explanation: "生命保険は、多くの人が保険料を出し合って、万が一の時に助け合う「相互扶助」の精神で成り立っているよ！"
  },
  {
    id: 2,
    question: "保険料の構成において、将来の保険金支払いに充てられる部分は？",
    options: ["付加保険料", "純保険料", "解約返戻金", "契約者配当金"],
    answer: 1,
    explanation: "保険料は「純保険料」と「付加保険料」に分かれていて、保険金に充てられるのは純保険料の方だよ。"
  }
];
