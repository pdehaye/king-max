import { around, renderGameVisualStory } from './game-visuals.js';

const meta = {
  title: 'Strategy/Interaction Demo',
  tags: ['autodocs']
};

export default meta;

export const CrownBlocksNeighbors = {
  name: 'Crown blocks touching cells',
  render: () => {
    const map = { '3,3': 'crown' };
    around(3, 3).forEach((key) => {
      map[key] = 'blocked';
    });
    return renderGameVisualStory({
      cells: map,
      caption: 'A crown blocks all adjacent cells'
    });
  }
};

export const DotVsCrownCycle = {
  name: 'Dot vs Crown teaching snapshot',
  render: () => {
    const map = {
      '1,1': 'dot',
      '1,2': 'crown',
      '1,3': 'empty',
      '4,2': 'dot',
      '5,4': 'crown'
    };
    return renderGameVisualStory({
      cells: map,
      caption: 'Dots mark candidate rejection; crowns mark committed placements'
    });
  }
};
