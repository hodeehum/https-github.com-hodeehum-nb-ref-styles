import { Style } from '../types';
import { COLORS, EXTRA_COLORS } from '../constants';

// A simple function to resolve the {a|b|c} syntax
export const resolveRandomChoices = (text: string): string => {
  const regex = /\{([^}]+)\}/g;
  return text.replace(regex, (match, content) => {
    const options = content.split('|');
    return options[Math.floor(Math.random() * options.length)].trim();
  });
};

export const constructFinalPrompt = (
  description: string,
  style1: Style,
  style2: Style,
  color: string,
  extraColor: string,
  guidance: number
): string => {
  // The description is used directly without variable substitution.
  const finalDescription = description;
  
  let processedPrompt = style1.prompt;
  processedPrompt = processedPrompt.replace(/\[input\.description\]/g, finalDescription);
  processedPrompt = resolveRandomChoices(processedPrompt);

  let processedStyle2Prompt = style2.prompt;
  processedStyle2Prompt = resolveRandomChoices(processedStyle2Prompt);

  const colorValue = COLORS[color] || '';
  const extraColorValue = EXTRA_COLORS[extraColor] || '';
  
  let guidancePrompt = '';
  if (guidance < 5) {
    guidancePrompt = 'artistic interpretation, creative, painterly';
  } else if (guidance > 7 && guidance <= 10) {
    guidancePrompt = 'sharp focus, detailed, high fidelity';
  } else if (guidance > 10) {
    guidancePrompt = 'masterpiece, highly detailed, high quality, sharp focus, adhering strictly to the prompt description';
  }

  const promptParts = [
      processedPrompt,
      processedStyle2Prompt,
      colorValue,
      extraColorValue,
      guidancePrompt
  ];

  const positivePrompt = promptParts.filter(p => p && p !== '.').join(', ');
  
  const finalPrompt = positivePrompt;

  return finalPrompt;
};