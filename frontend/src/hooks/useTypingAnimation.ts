import { useState, useEffect } from 'react';

interface TypingAnimationOptions {
  texts1: string[];
  texts2: string[];
  typingSpeed?: number;
}

export const useTypingAnimation = ({
  texts1,
  texts2,
  typingSpeed = 50, // 50msごとに1文字を追加
}: TypingAnimationOptions) => {
  const [description1, setDescription1] = useState<string[]>([]);
  const [description2, setDescription2] = useState<string[]>([]);

  useEffect(() => {
    if (!texts1.length && !texts2.length) return;

    let text1Index = 0;
    let text2Index = 0;
    let char1Index = 0;
    let char2Index = 0;
    let isProduct1Turn = true;

    const clearTimer = () => {
      if (timer) {
        clearInterval(timer);
      }
    };

    const timer = setInterval(() => {
      if (isProduct1Turn) {
        if (text1Index < texts1.length) {
          const currentText = texts1[text1Index];
          if (char1Index < currentText.length) {
            setDescription1(prev => {
              const newDesc = [...prev];
              newDesc[text1Index] = (newDesc[text1Index] || '') + currentText[char1Index - 1];
              return newDesc;
            });
            char1Index++;
          } else {
            char1Index = 0;
            text1Index++;
            isProduct1Turn = false;
          }
        } else {
          isProduct1Turn = false;
        }
      } else {
        if (text2Index < texts2.length) {
          const currentText = texts2[text2Index];
          if (char2Index < currentText.length) {
            setDescription2(prev => {
              const newDesc = [...prev];
              newDesc[text2Index] = (newDesc[text2Index] || '') + currentText[char2Index - 1];
              return newDesc;
            });
            char2Index++;
          } else {
            char2Index = 0;
            text2Index++;
            isProduct1Turn = true;
          }
        } else {
          isProduct1Turn = true;
        }
      }

      if (text1Index >= texts1.length && text2Index >= texts2.length) {
        clearTimer();
      }
    }, typingSpeed);

    return () => clearTimer();
  }, [texts1, texts2, typingSpeed]);

  return { description1, description2 };
};
