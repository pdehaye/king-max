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
  subsets: './?path=/story/strategy-deterministic-tactics--subsets'
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
      { label: 'Subsets', href: STORY_PATHS.subsets }
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

function renderBeforeAfter({ title, note, example }) {
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
  wrap.appendChild(grid);
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
    const example = deterministicExamples['hidden-singles'][0] || fallbackExample();
    return renderBeforeAfter({
      title: 'Hidden Singles',
      note: 'When one row, column, or region has exactly one legal candidate left, place that crown deterministically.',
      example
    });
  }
};

export const LockedCandidates = {
  name: 'Locked Candidates',
  render: () => {
    const example = deterministicExamples['locked-candidates'][0] || fallbackExample();
    return renderBeforeAfter({
      title: 'Locked Candidates',
      note: 'If all candidates for a region are confined to one line, eliminate that line outside the region.',
      example
    });
  }
};

export const Subsets = {
  name: 'Subsets',
  render: () => {
    const example = deterministicExamples['subsets'][0] || fallbackExample();
    return renderBeforeAfter({
      title: 'Subsets',
      note: 'When k regions are constrained to exactly k shared rows or columns, remove other candidates from those lines.',
      example
    });
  }
};
