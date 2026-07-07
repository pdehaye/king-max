import { renderGameVisualStory } from './game-visuals.js';

const meta = {
  title: 'Strategy/Region Elimination',
  tags: ['autodocs']
};

export default meta;

export const RegionCandidateCollapse = {
  name: 'Region reduced to one candidate',
  render: () => {
    const map = {
      '2,2': 'blocked',
      '2,3': 'blocked',
      '3,2': 'blocked',
      '3,3': 'crown',
      '3,0': 'crown',
      '0,3': 'crown',
      '5,5': 'dot'
    };
    return renderGameVisualStory({
      cells: map,
      caption: 'A region can force a crown',
      note: 'When all but one tile in a region are ruled out, place the crown immediately.'
    });
  }
};

export const RegionEliminationAfterPlacement = {
  name: 'Placement propagates through region and lines',
  render: () => {
    const map = {
      '3,3': 'crown',
      '3,1': 'blocked',
      '3,2': 'blocked',
      '3,4': 'blocked',
      '3,5': 'blocked',
      '1,3': 'blocked',
      '2,3': 'blocked',
      '4,3': 'blocked',
      '5,3': 'blocked',
      '2,2': 'blocked',
      '2,4': 'blocked',
      '4,2': 'blocked',
      '4,4': 'blocked',
      '2,5': 'dot',
      '4,1': 'dot'
    };
    return renderGameVisualStory({
      cells: map,
      caption: 'Use forced placement to prune aggressively',
      note: 'After a forced crown, mark row, column, touching cells, and region exclusions before searching again.'
    });
  }
};
