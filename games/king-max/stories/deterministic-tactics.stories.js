import { renderGameVisualStory } from './game-visuals.js';
import { deterministicExamples } from './generated/deterministic-examples.generated.js';

const meta = {
  title: 'Strategy/Deterministic Tactics',
  tags: ['autodocs']
};

export default meta;

const STORY_PATHS = {
  links: './?path=/story/strategy-deterministic-tactics--direct-links',
  hiddenSingles: './?path=/story/strategy-deterministic-tactics--hidden-singles',
  lockedCandidates: './?path=/story/strategy-deterministic-tactics--locked-candidates',
  subsets: './?path=/story/strategy-deterministic-tactics--subsets',
  excludedNeighbourTwins: './?path=/story/strategy-deterministic-tactics--excluded-neighbour-twins',
  excludedNeighbourTwo: './?path=/story/strategy-deterministic-tactics--excluded-neighbour-two',
  excludedNeighbourThree: './?path=/story/strategy-deterministic-tactics--excluded-neighbour-three',
  excludedNeighbourFour: './?path=/story/strategy-deterministic-tactics--excluded-neighbour-four',
  coupledRegionPairsTwo: './?path=/story/strategy-deterministic-tactics--coupled-regions-2x2'
};

export const DirectLinks = {
  name: 'Direct Links',
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.maxWidth = '760px';
    wrap.style.padding = '24px 16px';

    const heading = document.createElement('h2');
    heading.textContent = 'Deterministic Tactics';
    heading.style.margin = '0 0 8px';
    heading.style.fontFamily = "'Fraunces', serif";
    heading.style.fontSize = '34px';
    heading.style.color = 'var(--ink)';
    wrap.appendChild(heading);

    const sub = document.createElement('p');
    sub.textContent = 'Open any tactic directly using the links below.';
    sub.style.margin = '0 0 14px';
    sub.style.fontSize = '14px';
    sub.style.color = 'var(--ink-soft)';
    wrap.appendChild(sub);

    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gap = '10px';

    const links = [
      { label: 'Hidden Singles', href: STORY_PATHS.hiddenSingles },
      { label: 'Locked Candidates', href: STORY_PATHS.lockedCandidates },
      { label: 'Subsets', href: STORY_PATHS.subsets },
      { label: 'Excluded Neighbour (Twins)', href: STORY_PATHS.excludedNeighbourTwins },
      { label: 'Excluded Neighbour (Two)', href: STORY_PATHS.excludedNeighbourTwo },
      { label: 'Excluded Neighbour (Three)', href: STORY_PATHS.excludedNeighbourThree },
      { label: 'Excluded Neighbour (Four)', href: STORY_PATHS.excludedNeighbourFour },
      { label: 'Coupled Regions (2x2)', href: STORY_PATHS.coupledRegionPairsTwo }
    ];

    links.forEach(({ label, href }) => {
      const row = document.createElement('a');
      row.href = href;
      row.textContent = label;
      row.style.display = 'block';
      row.style.padding = '10px 12px';
      row.style.border = '1px solid var(--line)';
      row.style.borderRadius = '10px';
      row.style.background = 'var(--card)';
      row.style.color = 'var(--teal)';
      row.style.fontWeight = '600';
      row.style.textDecoration = 'none';
      row.style.width = 'fit-content';
      list.appendChild(row);
    });

    wrap.appendChild(list);
    return wrap;
  }
};

function renderExamplePair({ example, index }) {
  const section = document.createElement('section');
  section.style.display = 'grid';
  section.style.gap = '8px';

  const subheading = document.createElement('h4');
  subheading.textContent = `Example ${index + 1}`;
  subheading.style.margin = '0';
  subheading.style.fontFamily = "'Inter', sans-serif";
  subheading.style.fontSize = '15px';
  subheading.style.color = 'var(--ink)';
  section.appendChild(subheading);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
  grid.style.gap = '14px';

  const before = renderGameVisualStory({
    caption: 'Before',
    cells: example.before,
    regions: example.region
  });

  const after = renderGameVisualStory({
    caption: 'After',
    note: `Delta: ${example.metrics.crownDelta} crown(s), ${example.metrics.eliminatedCandidates} candidate(s) removed`,
    cells: example.after,
    regions: example.region
  });

  grid.appendChild(before);
  grid.appendChild(after);
  section.appendChild(grid);
  return section;
}

function renderBeforeAfter({ title, note, examples }) {
  const wrap = document.createElement('div');
  wrap.style.maxWidth = '740px';

  const heading = document.createElement('h3');
  heading.textContent = title;
  heading.style.margin = '0 0 8px';
  heading.style.fontFamily = "'Fraunces', serif";
  heading.style.fontSize = '22px';
  wrap.appendChild(heading);

  const description = document.createElement('p');
  description.textContent = note;
  description.style.margin = '0 0 12px';
  description.style.fontFamily = "'Inter', sans-serif";
  description.style.fontSize = '13px';
  description.style.color = '#5B5148';
  wrap.appendChild(description);

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = '16px';

  const sourceExamples = examples && examples.length > 0 ? examples : [fallbackExample()];
  sourceExamples.forEach((example, index) => {
    list.appendChild(renderExamplePair({ example, index }));
  });

  wrap.appendChild(list);
  return wrap;
}

function fallbackExample() {
  return {
    region: undefined,
    before: {},
    after: {},
    metrics: { crownDelta: 0, eliminatedCandidates: 0 }
  };
}

export const HiddenSingles = {
  name: 'Hidden Singles',
  render: () => {
    const examples = deterministicExamples['hidden-singles'] || [];
    return renderBeforeAfter({
      title: 'Hidden Singles',
      note: 'When one row, column, or region has exactly one legal candidate left, place that crown deterministically.',
      examples
    });
  }
};

export const LockedCandidates = {
  name: 'Locked Candidates',
  render: () => {
    const examples = deterministicExamples['locked-candidates'] || [];
    return renderBeforeAfter({
      title: 'Locked Candidates',
      note: 'If all candidates for a region are confined to one line, eliminate that line outside the region.',
      examples
    });
  }
};

export const Subsets = {
  name: 'Subsets',
  render: () => {
    const examples = deterministicExamples['subsets'] || [];
    return renderBeforeAfter({
      title: 'Subsets',
      note: 'When k regions are constrained to exactly k shared rows or columns, remove other candidates from those lines.',
      examples
    });
  }
};

export const ExcludedNeighbourTwins = {
  name: 'Excluded Neighbour (Twins)',
  render: () => {
    const examples = deterministicExamples['excluded-neighbour-twins'] || [];
    return renderBeforeAfter({
      title: 'Excluded Neighbour (Twins)',
      note: 'When a row, column, or region has exactly two orthogonally-contiguous queen candidates, any cell adjacent to both candidates is excluded.',
      examples
    });
  }
};

export const ExcludedNeighbourTwo = {
  name: 'Excluded Neighbour (Two)',
  render: () => {
    const examples = deterministicExamples['excluded-neighbour-two'] || [];
    return renderBeforeAfter({
      title: 'Excluded Neighbour (Two)',
      note: 'If a region has exactly two queen candidates, eliminate cells that are excluded under both placements (row, column, region, or touching constraints).',
      examples
    });
  }
};

export const ExcludedNeighbourThree = {
  name: 'Excluded Neighbour (Three)',
  render: () => {
    const examples = deterministicExamples['excluded-neighbour-three'] || [];
    return renderBeforeAfter({
      title: 'Excluded Neighbour (Three)',
      note: 'If a region has exactly three queen candidates, eliminate cells excluded under all three placements (row, column, region, or touching constraints).',
      examples
    });
  }
};

export const ExcludedNeighbourFour = {
  name: 'Excluded Neighbour (Four)',
  render: () => {
    const examples = deterministicExamples['excluded-neighbour-four'] || [];
    return renderBeforeAfter({
      title: 'Excluded Neighbour (Four)',
      note: 'If a region has exactly four queen candidates, eliminate cells excluded under all four placements (row, column, region, or touching constraints).',
      examples
    });
  }
};

export const CoupledRegions2x2 = {
  name: 'Coupled Regions (2x2)',
  render: () => {
    const examples = deterministicExamples['coupled-region-pairs-two'] || [];
    return renderBeforeAfter({
      title: 'Coupled Regions (2x2)',
      note: 'If two regions each have exactly two candidates, intersect the exclusions produced by all compatible pairings to eliminate guaranteed impossible cells.',
      examples
    });
  }
};
