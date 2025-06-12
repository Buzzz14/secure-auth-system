import { UseCaptcha } from '@/types';
import { useState, useCallback, useEffect } from 'react';

type Operation = '+' | '-' | '*';

function generateNumbers(operation: Operation): { num1: number; num2: number } {
  switch (operation) {
    case '+':
      return {
        num1: Math.floor(Math.random() * 11),
        num2: Math.floor(Math.random() * 11),
      };
    case '-':
      const minuend = Math.floor(Math.random() * 11);
      const subtrahend = Math.floor(Math.random() * (minuend + 1));
      return {
        num1: minuend,
        num2: subtrahend,
      };
    case '*':
      return {
        num1: Math.floor(Math.random() * 6),
        num2: Math.floor(Math.random() * 6),
      };
  }
}

function calculateResult(num1: number, num2: number, operation: Operation): number {
  switch (operation) {
    case '+':
      return num1 + num2;
    case '-':
      return num1 - num2;
    case '*':
      return num1 * num2;
  }
}

export function useCaptcha(): UseCaptcha {
  const operations: Operation[] = ['+', '-', '*'];
  const [operation, setOperation] = useState<Operation>('+');
  const [numbers, setNumbers] = useState({ num1: 0, num2: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [isReady, setIsReady] = useState(false);

  const generateNewCaptcha = useCallback(() => {
    const newOperation = operations[Math.floor(Math.random() * operations.length)];
    const newNumbers = generateNumbers(newOperation);
    setOperation(newOperation);
    setNumbers(newNumbers);
    setUserAnswer('');
  }, []);

  useEffect(() => {
    generateNewCaptcha();
    setIsReady(true);
  }, [generateNewCaptcha]);
  
  const answer = calculateResult(numbers.num1, numbers.num2, operation);
  const question = `What is ${numbers.num1} ${operation} ${numbers.num2}?`;
  
  return {
    question,
    answer,
    userAnswer,
    setUserAnswer,
    regenerateCaptcha: generateNewCaptcha,
    isReady
  };
} 