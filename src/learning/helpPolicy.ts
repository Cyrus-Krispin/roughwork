import { helpLevels, type HelpLevel } from './contracts.ts';

export const maximumHelpResponses = 9;

export function getHelpPolicy(help: Array<{ level: HelpLevel }>) {
  const current = help.at(-1)?.level ?? null;
  const currentIndex = current ? helpLevels.indexOf(current) : -1;
  const next =
    currentIndex < helpLevels.length - 1 ? helpLevels[currentIndex + 1] : null;
  const repeatCount = current
    ? help.filter((item) => item.level === current).length
    : 0;
  const canRepeat =
    current !== null &&
    help.length < maximumHelpResponses &&
    repeatCount < (current === 'direct_explanation' ? 1 : 2);
  const canAdvance = next !== null && help.length < maximumHelpResponses;

  return {
    current,
    next,
    canRepeat,
    canAdvance,
    terminal: current !== null && !canRepeat && !canAdvance,
  };
}
