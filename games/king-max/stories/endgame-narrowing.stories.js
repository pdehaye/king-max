import { renderGameVisualStory } from './game-visuals.js';

const meta = {
  title: 'Strategy/Endgame Narrowing',
  tags: ['autodocs']
};

export default meta;

export const TwoCandidateRows = {
  name: 'Two-candidate rows in the endgame',
  render: () => {
    const map = {
      '0,0': 'crown',
      '1,4': 'crown',
      '2,7': 'crown',
      '3,2': 'crown',
      '4,6': 'crown',
      '5,1': 'crown',
      '6,3': 'candidate',
      '6,5': 'candidate',
      '7,5': 'candidate',
      '7,6': 'candidate',
      '6,4': 'blocked',
      '7,4': 'blocked',
      '7,3': 'blocked'
    };
    return renderGameVisualStory({
      cells: map,
      caption: 'Endgame: isolate the final two rows',
      note: 'When only two rows remain unresolved, compare columns and touching constraints to eliminate one candidate quickly.'
    });
  }
};

export const FinalCommit = {
  name: 'Last commitment after elimination',
  render: () => {
    const map = {
      '0,0': 'crown',
      '1,4': 'crown',
      '2,7': 'crown',
      '3,2': 'crown',
      '4,6': 'crown',
      '5,1': 'crown',
      '6,5': 'crown',
      '7,3': 'crown',
      '6,3': 'blocked',
      '7,5': 'blocked',
      '7,6': 'blocked'
    };
    return renderGameVisualStory({
      cells: map,
      caption: 'Final commit and cleanup',
      note: 'After one candidate is disproven, commit the only legal pair and the puzzle closes without guessing.'
    });
  }
};
