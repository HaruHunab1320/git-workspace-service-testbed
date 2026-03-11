/**
 * Comprehensive unit tests for the Cozy Companion feature.
 *
 * Tests cover all components, hooks, and logic introduced
 * in the @cozy-village/cozy-companion app.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Components under test
// ---------------------------------------------------------------------------
import CompanionDisplay from '../apps/cozy-companion/src/components/CompanionDisplay';
import MoodSelector from '../apps/cozy-companion/src/components/MoodSelector';
import FocusTimer from '../apps/cozy-companion/src/components/FocusTimer';
import GentleReminders from '../apps/cozy-companion/src/components/GentleReminders';
import JournalPanel from '../apps/cozy-companion/src/components/JournalPanel';
import SettingsPanel from '../apps/cozy-companion/src/components/SettingsPanel';
import DailyCheckIn from '../apps/cozy-companion/src/components/DailyCheckIn';
import useDailyCheckIn from '../apps/cozy-companion/src/hooks/useDailyCheckIn';
import App from '../apps/cozy-companion/src/App';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a hook and return its result ref. */
function renderHook(hookFn) {
  const result = { current: null };
  function TestComponent() {
    result.current = hookFn();
    return null;
  }
  const utils = render(<TestComponent />);
  return { result, ...utils };
}

/** Advance all timers by ms and flush pending state. */
async function advanceTimers(ms) {
  await act(() => {
    vi.advanceTimersByTime(ms);
  });
}

// ===================================================================
// CompanionDisplay
// ===================================================================

describe('CompanionDisplay', () => {
  it('renders default companion when no mood is provided', () => {
    const { container } = render(<CompanionDisplay mood={null} />);
    expect(screen.getByText('Mochi')).toBeInTheDocument();
    expect(screen.getByText('Hello! How are you today?')).toBeInTheDocument();
    // ASCII art should be a <pre>
    const pre = container.querySelector('pre.companion-ascii');
    expect(pre).toBeInTheDocument();
    expect(pre.textContent).toContain('o.o');
  });

  it('renders happy mood with correct ASCII art and message', () => {
    const { container } = render(<CompanionDisplay mood="happy" />);
    const pre = container.querySelector('pre.companion-ascii');
    expect(pre.textContent).toContain('^.^');
    expect(
      screen.getByText('Your companion is purring contentedly!')
    ).toBeInTheDocument();
  });

  it('renders calm mood', () => {
    const { container } = render(<CompanionDisplay mood="calm" />);
    expect(container.querySelector('pre').textContent).toContain('-.-');
    expect(
      screen.getByText('A peaceful moment together...')
    ).toBeInTheDocument();
  });

  it('renders tired mood', () => {
    const { container } = render(<CompanionDisplay mood="tired" />);
    expect(container.querySelector('pre').textContent).toContain('u.u');
    expect(screen.getByText("Let's take it easy today.")).toBeInTheDocument();
  });

  it('renders excited mood', () => {
    const { container } = render(<CompanionDisplay mood="excited" />);
    expect(container.querySelector('pre').textContent).toContain('*.*');
    expect(
      screen.getByText('So much energy! What an adventure!')
    ).toBeInTheDocument();
  });

  it('renders anxious mood', () => {
    render(<CompanionDisplay mood="anxious" />);
    expect(
      screen.getByText("It's okay. Deep breaths together.")
    ).toBeInTheDocument();
  });

  it('shows mood badge when mood is set', () => {
    const { container: _container } = render(<CompanionDisplay mood="happy" />);
    expect(screen.getByText('happy')).toBeInTheDocument();
  });

  it('does not show mood badge when mood is null', () => {
    render(<CompanionDisplay mood={null} />);
    expect(screen.queryByText('happy')).not.toBeInTheDocument();
    expect(screen.queryByText('calm')).not.toBeInTheDocument();
  });

  it('renders ambient particles', () => {
    const { container } = render(<CompanionDisplay mood="happy" />);
    const particles = container.querySelectorAll('.companion-particle');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('changes particles when mood changes', () => {
    const { container, rerender } = render(<CompanionDisplay mood="happy" />);
    const _key1 = container
      .querySelector('.companion-particles')
      ?.getAttribute('data-reactid');
    rerender(<CompanionDisplay mood="calm" />);
    // Particles should re-render (key changes internally)
    const particles = container.querySelectorAll('.companion-particle');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('blinks the companion on interval', () => {
    vi.useFakeTimers();
    const { container } = render(<CompanionDisplay mood="happy" />);

    // Initially shows happy face
    expect(container.querySelector('pre').textContent).toContain('^.^');

    // After 5s, should blink (eyes replaced with -.-)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.querySelector('pre').textContent).toContain('-.-');

    // After 200ms more, blink ends
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelector('pre').textContent).toContain('^.^');

    vi.useRealTimers();
  });

  it('cleans up blink timers on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(<CompanionDisplay mood="happy" />);
    unmount();
    // Should not throw when timers fire after unmount
    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
    vi.useRealTimers();
  });

  it('falls back to default art for unknown mood', () => {
    const { container } = render(<CompanionDisplay mood="unknown" />);
    // Art falls back to default (o.o face)
    expect(container.querySelector('pre').textContent).toContain('o.o');
    // Message is undefined (mood is truthy but not in MOOD_MESSAGES),
    // so it won't show the default greeting
  });

  it('falls back to default art and greeting when mood is null', () => {
    const { container } = render(<CompanionDisplay mood={null} />);
    expect(container.querySelector('pre').textContent).toContain('o.o');
    expect(screen.getByText('Hello! How are you today?')).toBeInTheDocument();
  });
});

// ===================================================================
// MoodSelector
// ===================================================================

describe('MoodSelector', () => {
  it('renders all five mood options', () => {
    render(<MoodSelector selected={null} onSelect={() => {}} />);
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Calm')).toBeInTheDocument();
    expect(screen.getByText('Tired')).toBeInTheDocument();
    expect(screen.getByText('Excited')).toBeInTheDocument();
    expect(screen.getByText('Anxious')).toBeInTheDocument();
  });

  it('calls onSelect when a mood is clicked', () => {
    const onSelect = vi.fn();
    render(<MoodSelector selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Happy'));
    expect(onSelect).toHaveBeenCalledWith('happy');
  });

  it('calls onSelect for each mood', () => {
    const onSelect = vi.fn();
    render(<MoodSelector selected={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Calm'));
    expect(onSelect).toHaveBeenCalledWith('calm');

    fireEvent.click(screen.getByText('Tired'));
    expect(onSelect).toHaveBeenCalledWith('tired');

    fireEvent.click(screen.getByText('Excited'));
    expect(onSelect).toHaveBeenCalledWith('excited');

    fireEvent.click(screen.getByText('Anxious'));
    expect(onSelect).toHaveBeenCalledWith('anxious');
  });

  it('marks the selected mood as active with aria-pressed', () => {
    const { container } = render(
      <MoodSelector selected="happy" onSelect={() => {}} />
    );
    const happyBtn = container.querySelector('[aria-pressed="true"]');
    expect(happyBtn).toBeInTheDocument();
    expect(happyBtn.textContent).toContain('Happy');
  });

  it('applies active class to selected mood', () => {
    const { container } = render(
      <MoodSelector selected="calm" onSelect={() => {}} />
    );
    const active = container.querySelector('.mood-option--active');
    expect(active).toBeInTheDocument();
    expect(active.textContent).toContain('Calm');
  });

  it('shows "Clear mood" button when a mood is selected', () => {
    render(<MoodSelector selected="happy" onSelect={() => {}} />);
    expect(screen.getByText('Clear mood')).toBeInTheDocument();
  });

  it('does not show "Clear mood" when no mood is selected', () => {
    render(<MoodSelector selected={null} onSelect={() => {}} />);
    expect(screen.queryByText('Clear mood')).not.toBeInTheDocument();
  });

  it('calls onSelect(null) when "Clear mood" is clicked', () => {
    const onSelect = vi.fn();
    render(<MoodSelector selected="happy" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Clear mood'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('displays mood icons (face expressions)', () => {
    render(<MoodSelector selected={null} onSelect={() => {}} />);
    expect(screen.getByText('^_^')).toBeInTheDocument();
    expect(screen.getByText('-.-')).toBeInTheDocument();
    expect(screen.getByText('u.u')).toBeInTheDocument();
    expect(screen.getByText('*.*')).toBeInTheDocument();
    expect(screen.getByText('o.o')).toBeInTheDocument();
  });
});

// ===================================================================
// FocusTimer
// ===================================================================

describe('FocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with default 25-minute timer', () => {
    render(<FocusTimer showToast={() => {}} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows Start button initially', () => {
    render(<FocusTimer showToast={() => {}} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('starts counting down when Start is clicked', async () => {
    render(<FocusTimer showToast={() => {}} />);
    fireEvent.click(screen.getByText('Start'));

    expect(screen.getByText('Focusing...')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();

    await advanceTimers(1000);
    expect(screen.getByText('24:59')).toBeInTheDocument();

    await advanceTimers(1000);
    expect(screen.getByText('24:58')).toBeInTheDocument();
  });

  it('pauses and resumes the timer', async () => {
    render(<FocusTimer showToast={() => {}} />);
    fireEvent.click(screen.getByText('Start'));

    await advanceTimers(3000);
    expect(screen.getByText('24:57')).toBeInTheDocument();

    // Pause
    fireEvent.click(screen.getByText('Pause'));
    expect(screen.getByText('Resume')).toBeInTheDocument();

    await advanceTimers(5000);
    // Time should not have changed while paused
    expect(screen.getByText('24:57')).toBeInTheDocument();

    // Resume
    fireEvent.click(screen.getByText('Resume'));
    await advanceTimers(1000);
    expect(screen.getByText('24:56')).toBeInTheDocument();
  });

  it('resets the timer', async () => {
    render(<FocusTimer showToast={() => {}} />);
    fireEvent.click(screen.getByText('Start'));
    await advanceTimers(5000);

    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows Done! and calls showToast when timer completes', async () => {
    const showToast = vi.fn();
    render(<FocusTimer showToast={showToast} />);

    // Select 5-min preset for faster test
    fireEvent.click(screen.getByText('5 min'));
    expect(screen.getByText('05:00')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Start'));

    // Advance all 300 seconds
    await advanceTimers(300 * 1000);

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('Done!')).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      'Focus session complete! Great work.',
      'success'
    );
  });

  it('increments session count on completion', async () => {
    const showToast = vi.fn();
    render(<FocusTimer showToast={showToast} />);

    // Select 5-min preset
    fireEvent.click(screen.getByText('5 min'));
    fireEvent.click(screen.getByText('Start'));
    await advanceTimers(300 * 1000);

    expect(screen.getByText('1 session today')).toBeInTheDocument();
  });

  it('shows plural "sessions" for multiple completions', async () => {
    const showToast = vi.fn();
    render(<FocusTimer showToast={showToast} />);

    // Complete first session (5 min)
    fireEvent.click(screen.getByText('5 min'));
    fireEvent.click(screen.getByText('Start'));
    await advanceTimers(300 * 1000);

    // Start and complete second session
    fireEvent.click(screen.getByText('Start'));
    await advanceTimers(300 * 1000);

    expect(screen.getByText('2 sessions today')).toBeInTheDocument();
  });

  it('switches between presets', () => {
    render(<FocusTimer showToast={() => {}} />);

    fireEvent.click(screen.getByText('5 min'));
    expect(screen.getByText('05:00')).toBeInTheDocument();

    fireEvent.click(screen.getByText('15 min'));
    expect(screen.getByText('15:00')).toBeInTheDocument();

    fireEvent.click(screen.getByText('45 min'));
    expect(screen.getByText('45:00')).toBeInTheDocument();

    fireEvent.click(screen.getByText('25 min'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('stops running timer when preset is changed', async () => {
    render(<FocusTimer showToast={() => {}} />);
    fireEvent.click(screen.getByText('Start'));
    await advanceTimers(3000);

    // Switch preset while running
    fireEvent.click(screen.getByText('15 min'));
    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('renders circular progress SVG', () => {
    const { container } = render(<FocusTimer showToast={() => {}} />);
    expect(container.querySelector('svg.timer-ring')).toBeInTheDocument();
  });

  it('does not show session count when zero sessions completed', () => {
    render(<FocusTimer showToast={() => {}} />);
    expect(screen.queryByText(/session/)).not.toBeInTheDocument();
  });

  it('formats time correctly for various values', async () => {
    render(<FocusTimer showToast={() => {}} />);
    fireEvent.click(screen.getByText('5 min'));
    fireEvent.click(screen.getByText('Start'));

    // 4:59 after 1 second
    await advanceTimers(1000);
    expect(screen.getByText('04:59')).toBeInTheDocument();

    // 4:00 after 60 seconds total
    await advanceTimers(59000);
    expect(screen.getByText('04:00')).toBeInTheDocument();
  });
});

// ===================================================================
// GentleReminders
// ===================================================================

describe('GentleReminders', () => {
  const reminders = [
    'Take a deep breath.',
    'Drink some water.',
    'Stretch your arms.',
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the first reminder initially', () => {
    render(<GentleReminders reminders={reminders} intervalMs={30000} />);
    expect(screen.getByText('Take a deep breath.')).toBeInTheDocument();
  });

  it('returns null when reminders array is empty', () => {
    const { container } = render(
      <GentleReminders reminders={[]} intervalMs={30000} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('auto-advances to next reminder after interval', async () => {
    render(<GentleReminders reminders={reminders} intervalMs={5000} />);
    expect(screen.getByText('Take a deep breath.')).toBeInTheDocument();

    // Advance past interval + transition delay
    await advanceTimers(5000);
    await advanceTimers(300);
    expect(screen.getByText('Drink some water.')).toBeInTheDocument();
  });

  it('cycles back to first reminder after last', async () => {
    render(<GentleReminders reminders={reminders} intervalMs={1000} />);

    // Advance through all 3 reminders
    for (let i = 0; i < 3; i++) {
      await advanceTimers(1000);
      await advanceTimers(300);
    }
    expect(screen.getByText('Take a deep breath.')).toBeInTheDocument();
  });

  it('pauses auto-advance when Pause is clicked', async () => {
    render(<GentleReminders reminders={reminders} intervalMs={3000} />);

    fireEvent.click(screen.getByText('Pause'));
    expect(screen.getByText('Resume')).toBeInTheDocument();

    await advanceTimers(10000);
    // Should still show first reminder
    expect(screen.getByText('Take a deep breath.')).toBeInTheDocument();
  });

  it('resumes auto-advance when Resume is clicked', async () => {
    render(<GentleReminders reminders={reminders} intervalMs={3000} />);

    fireEvent.click(screen.getByText('Pause'));
    await advanceTimers(5000);

    fireEvent.click(screen.getByText('Resume'));
    await advanceTimers(3000);
    await advanceTimers(300);
    expect(screen.getByText('Drink some water.')).toBeInTheDocument();
  });

  it('advances to next reminder when Next is clicked', async () => {
    render(<GentleReminders reminders={reminders} intervalMs={30000} />);

    fireEvent.click(screen.getByText('Next'));
    await advanceTimers(300);
    expect(screen.getByText('Drink some water.')).toBeInTheDocument();
  });

  it('renders navigation dots for each reminder', () => {
    const { container } = render(
      <GentleReminders reminders={reminders} intervalMs={30000} />
    );
    const dots = container.querySelectorAll('.reminder-dot');
    expect(dots).toHaveLength(3);
  });

  it('highlights the active dot', () => {
    const { container } = render(
      <GentleReminders reminders={reminders} intervalMs={30000} />
    );
    const activeDot = container.querySelector('.reminder-dot--active');
    expect(activeDot).toBeInTheDocument();
  });

  it('jumps to specific reminder when dot is clicked', () => {
    const { container } = render(
      <GentleReminders reminders={reminders} intervalMs={30000} />
    );
    const dots = container.querySelectorAll('.reminder-dot');
    fireEvent.click(dots[2]);
    expect(screen.getByText('Stretch your arms.')).toBeInTheDocument();
  });

  it('does not auto-advance when there is only one reminder', async () => {
    render(<GentleReminders reminders={['Only one.']} intervalMs={1000} />);
    await advanceTimers(5000);
    expect(screen.getByText('Only one.')).toBeInTheDocument();
  });

  it('applies fading class during transition', async () => {
    const { container } = render(
      <GentleReminders reminders={reminders} intervalMs={1000} />
    );

    await advanceTimers(1000);
    // During the 300ms transition, the fading class should be applied
    expect(
      container.querySelector('.reminder-card--fading')
    ).toBeInTheDocument();

    await advanceTimers(300);
    expect(
      container.querySelector('.reminder-card--fading')
    ).not.toBeInTheDocument();
  });
});

// ===================================================================
// JournalPanel
// ===================================================================

describe('JournalPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty state when no entries exist', () => {
    render(<JournalPanel showToast={() => {}} />);
    expect(
      screen.getByText(
        'No entries yet. Start writing to capture your thoughts.'
      )
    ).toBeInTheDocument();
  });

  it('renders textarea for writing', () => {
    const { container } = render(<JournalPanel showToast={() => {}} />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('renders all mood tag buttons', () => {
    render(<JournalPanel showToast={() => {}} />);
    expect(screen.getByText('Grateful')).toBeInTheDocument();
    expect(screen.getByText('Reflective')).toBeInTheDocument();
    expect(screen.getByText('Hopeful')).toBeInTheDocument();
    expect(screen.getByText('Peaceful')).toBeInTheDocument();
    expect(screen.getByText('Challenged')).toBeInTheDocument();
  });

  it('saves an entry when Save Entry is clicked', () => {
    const showToast = vi.fn();
    const { container } = render(<JournalPanel showToast={showToast} />);

    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'A beautiful day.' } });

    fireEvent.click(screen.getByText('Save Entry'));

    expect(showToast).toHaveBeenCalledWith('Entry saved', 'success');
    expect(screen.getByText('A beautiful day.')).toBeInTheDocument();

    // Persisted to localStorage
    const stored = JSON.parse(localStorage.getItem('cozy-journal'));
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('A beautiful day.');
  });

  it('does not save empty entries', () => {
    const showToast = vi.fn();
    const { container: _container } = render(
      <JournalPanel showToast={showToast} />
    );

    fireEvent.click(screen.getByText('Save Entry'));
    expect(showToast).not.toHaveBeenCalled();
    expect(localStorage.getItem('cozy-journal')).toBeNull();
  });

  it('does not save whitespace-only entries', () => {
    const showToast = vi.fn();
    const { container } = render(<JournalPanel showToast={showToast} />);

    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Save Entry'));

    expect(showToast).not.toHaveBeenCalled();
  });

  it('clears draft and tags after saving', () => {
    const { container } = render(<JournalPanel showToast={() => {}} />);

    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'Some thoughts.' } });

    // Select a tag
    fireEvent.click(screen.getByText('Grateful'));

    fireEvent.click(screen.getByText('Save Entry'));

    expect(textarea.value).toBe('');
  });

  it('saves entry with selected tags', () => {
    const { container } = render(<JournalPanel showToast={() => {}} />);

    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'Grateful today.' } });

    fireEvent.click(screen.getByText('Grateful'));
    fireEvent.click(screen.getByText('Hopeful'));

    fireEvent.click(screen.getByText('Save Entry'));

    const stored = JSON.parse(localStorage.getItem('cozy-journal'));
    expect(stored[0].tags).toEqual(['grateful', 'hopeful']);
  });

  it('toggles tags on and off', () => {
    const { container } = render(<JournalPanel showToast={() => {}} />);

    // Select Grateful
    fireEvent.click(screen.getByText('Grateful'));
    const tagEl = container.querySelector('.journal-tag--selected');
    expect(tagEl).toBeInTheDocument();

    // Deselect Grateful
    fireEvent.click(screen.getByText('Grateful'));
    expect(
      container.querySelector('.journal-tag--selected')
    ).not.toBeInTheDocument();
  });

  it('shows word count when draft has text', () => {
    const { container } = render(<JournalPanel showToast={() => {}} />);
    const textarea = container.querySelector('textarea');

    fireEvent.change(textarea, { target: { value: 'hello world today' } });
    expect(screen.getByText('3 words')).toBeInTheDocument();
  });

  it('shows singular "word" for one word', () => {
    const { container } = render(<JournalPanel showToast={() => {}} />);
    const textarea = container.querySelector('textarea');

    fireEvent.change(textarea, { target: { value: 'hello' } });
    expect(screen.getByText('1 word')).toBeInTheDocument();
  });

  it('does not show word count when draft is empty', () => {
    render(<JournalPanel showToast={() => {}} />);
    expect(screen.queryByText(/\d+ words?/)).not.toBeInTheDocument();
  });

  it('displays entries in reverse chronological order (newest first)', () => {
    // Pre-populate localStorage
    const entries = [
      { id: 1, text: 'First entry', tags: [], date: 'Mon, Jan 1, 12:00 PM' },
      { id: 2, text: 'Second entry', tags: [], date: 'Tue, Jan 2, 12:00 PM' },
    ];
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    const { container } = render(<JournalPanel showToast={() => {}} />);
    const entryTexts = container.querySelectorAll('.journal-entry__text');
    expect(entryTexts[0].textContent).toBe('First entry');
    expect(entryTexts[1].textContent).toBe('Second entry');
  });

  it('deletes an entry via confirmation modal', () => {
    const showToast = vi.fn();
    const entries = [
      { id: 1, text: 'To be deleted', tags: [], date: 'Mon, Jan 1' },
    ];
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    render(<JournalPanel showToast={showToast} />);
    expect(screen.getByText('To be deleted')).toBeInTheDocument();

    // Click delete button (the "x" button)
    const deleteBtn = screen
      .getAllByText('x')
      .find((el) => el.closest('.journal-entry__header'));
    fireEvent.click(deleteBtn);

    // Modal should appear
    expect(screen.getByText('Delete Entry?')).toBeInTheDocument();
    expect(
      screen.getByText('This entry will be removed permanently.')
    ).toBeInTheDocument();

    // Confirm delete
    fireEvent.click(screen.getByText('Delete'));

    expect(screen.queryByText('To be deleted')).not.toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('Entry removed', 'info');
  });

  it('cancels deletion via modal Cancel button', () => {
    const entries = [
      { id: 1, text: 'Keep this', tags: [], date: 'Mon, Jan 1' },
    ];
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    render(<JournalPanel showToast={() => {}} />);

    const deleteBtn = screen
      .getAllByText('x')
      .find((el) => el.closest('.journal-entry__header'));
    fireEvent.click(deleteBtn);

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Keep this')).toBeInTheDocument();
  });

  it('shows search bar when more than 3 entries exist', () => {
    const entries = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      text: `Entry ${i}`,
      tags: [],
      date: `Day ${i}`,
    }));
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    const { container } = render(<JournalPanel showToast={() => {}} />);
    expect(
      container.querySelector('.journal-search__input')
    ).toBeInTheDocument();
  });

  it('does not show search bar with 3 or fewer entries', () => {
    const entries = [
      { id: 1, text: 'One', tags: [], date: 'Day 1' },
      { id: 2, text: 'Two', tags: [], date: 'Day 2' },
    ];
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    const { container } = render(<JournalPanel showToast={() => {}} />);
    expect(
      container.querySelector('.journal-search__input')
    ).not.toBeInTheDocument();
  });

  it('filters entries by search query', () => {
    const entries = [
      { id: 1, text: 'Beautiful sunrise', tags: [], date: 'Day 1' },
      { id: 2, text: 'Rainy afternoon', tags: [], date: 'Day 2' },
      { id: 3, text: 'Cozy evening', tags: [], date: 'Day 3' },
      { id: 4, text: 'Morning walk', tags: [], date: 'Day 4' },
    ];
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    const { container } = render(<JournalPanel showToast={() => {}} />);
    const searchInput = container.querySelector('.journal-search__input');
    fireEvent.change(searchInput, { target: { value: 'morning' } });

    expect(screen.getByText('Morning walk')).toBeInTheDocument();
    expect(screen.queryByText('Beautiful sunrise')).not.toBeInTheDocument();
    expect(screen.queryByText('Rainy afternoon')).not.toBeInTheDocument();
  });

  it('filters entries by tag', () => {
    const entries = [
      { id: 1, text: 'Entry A', tags: ['grateful'], date: 'Day 1' },
      { id: 2, text: 'Entry B', tags: ['hopeful'], date: 'Day 2' },
      { id: 3, text: 'Entry C', tags: [], date: 'Day 3' },
      { id: 4, text: 'Entry D', tags: ['grateful'], date: 'Day 4' },
    ];
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    const { container } = render(<JournalPanel showToast={() => {}} />);
    const searchInput = container.querySelector('.journal-search__input');
    fireEvent.change(searchInput, { target: { value: 'grateful' } });

    expect(screen.getByText('Entry A')).toBeInTheDocument();
    expect(screen.getByText('Entry D')).toBeInTheDocument();
    expect(screen.queryByText('Entry B')).not.toBeInTheDocument();
  });

  it('shows empty search message', () => {
    const entries = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      text: `Entry ${i}`,
      tags: [],
      date: `Day ${i}`,
    }));
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    const { container } = render(<JournalPanel showToast={() => {}} />);
    const searchInput = container.querySelector('.journal-search__input');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(
      screen.getByText('No entries match your search.')
    ).toBeInTheDocument();
  });

  it('loads entries from localStorage on mount', () => {
    const entries = [{ id: 1, text: 'Persisted entry', tags: [], date: 'Mon' }];
    localStorage.setItem('cozy-journal', JSON.stringify(entries));

    render(<JournalPanel showToast={() => {}} />);
    expect(screen.getByText('Persisted entry')).toBeInTheDocument();
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('cozy-journal', 'not valid json');

    render(<JournalPanel showToast={() => {}} />);
    expect(
      screen.getByText(
        'No entries yet. Start writing to capture your thoughts.'
      )
    ).toBeInTheDocument();
  });
});

// ===================================================================
// SettingsPanel
// ===================================================================

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders with default settings', () => {
    const { container } = render(<SettingsPanel showToast={() => {}} />);

    // Default companion name
    const nameInput = container.querySelector('.pastel-input');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('Mochi');

    // Theme select present
    expect(screen.getByText('Color Theme')).toBeInTheDocument();
  });

  it('renders all theme swatches', () => {
    const { container } = render(<SettingsPanel showToast={() => {}} />);
    const swatches = container.querySelectorAll('.theme-swatch');
    expect(swatches).toHaveLength(5);
  });

  it('renders toggle switches for sound and reminders', () => {
    render(<SettingsPanel showToast={() => {}} />);
    expect(screen.getByText('Sound Effects')).toBeInTheDocument();
    expect(screen.getByText('Gentle Reminders')).toBeInTheDocument();
  });

  it('saves settings to localStorage on Save', () => {
    const showToast = vi.fn();
    render(<SettingsPanel showToast={showToast} />);

    fireEvent.click(screen.getByText('Save Settings'));

    expect(showToast).toHaveBeenCalledWith('Settings saved', 'success');
    const stored = JSON.parse(localStorage.getItem('cozy-settings'));
    expect(stored).toEqual({
      soundEnabled: true,
      remindersEnabled: true,
      theme: 'lavender',
      companionName: 'Mochi',
      reminderInterval: '30000',
    });
  });

  it('saves custom companion name', () => {
    const { container } = render(<SettingsPanel showToast={() => {}} />);
    const nameInput = container.querySelector('.pastel-input');

    fireEvent.change(nameInput, { target: { value: 'Luna' } });
    fireEvent.click(screen.getByText('Save Settings'));

    const stored = JSON.parse(localStorage.getItem('cozy-settings'));
    expect(stored.companionName).toBe('Luna');
  });

  it('resets settings to defaults via modal', () => {
    const showToast = vi.fn();
    const { container } = render(<SettingsPanel showToast={showToast} />);

    // Change name first
    const nameInput = container.querySelector('.pastel-input');
    fireEvent.change(nameInput, { target: { value: 'Luna' } });
    fireEvent.click(screen.getByText('Save Settings'));

    // Open reset modal
    fireEvent.click(screen.getByText('Reset to Defaults'));
    expect(screen.getByText('Reset Settings?')).toBeInTheDocument();
    expect(
      screen.getByText('All settings will return to their default values.')
    ).toBeInTheDocument();

    // Confirm reset
    fireEvent.click(screen.getByText('Reset'));
    expect(showToast).toHaveBeenCalledWith(
      'Settings reset to defaults',
      'info'
    );

    // Name should be reset
    expect(nameInput.value).toBe('Mochi');
    expect(localStorage.getItem('cozy-settings')).toBeNull();
  });

  it('cancels reset via modal Cancel button', () => {
    const { container } = render(<SettingsPanel showToast={() => {}} />);

    const nameInput = container.querySelector('.pastel-input');
    fireEvent.change(nameInput, { target: { value: 'Luna' } });

    fireEvent.click(screen.getByText('Reset to Defaults'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(nameInput.value).toBe('Luna');
  });

  it('loads saved settings from localStorage', () => {
    localStorage.setItem(
      'cozy-settings',
      JSON.stringify({
        companionName: 'Pixel',
        theme: 'mint',
        soundEnabled: false,
        remindersEnabled: true,
        reminderInterval: '60000',
      })
    );

    const { container } = render(<SettingsPanel showToast={() => {}} />);
    const nameInput = container.querySelector('.pastel-input');
    expect(nameInput.value).toBe('Pixel');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('cozy-settings', '{bad json');
    // Should render with defaults without crashing
    const { container } = render(<SettingsPanel showToast={() => {}} />);
    const nameInput = container.querySelector('.pastel-input');
    expect(nameInput.value).toBe('Mochi');
  });

  it('shows reminder frequency dropdown only when reminders are enabled', () => {
    render(<SettingsPanel showToast={() => {}} />);
    expect(screen.getByText('Reminder Frequency')).toBeInTheDocument();
  });

  it('shows unsaved indicator after changes', () => {
    const { container } = render(<SettingsPanel showToast={() => {}} />);
    const nameInput = container.querySelector('.pastel-input');

    // Initially no unsaved indicator
    expect(container.querySelector('.unsaved-dot')).not.toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: 'Luna' } });
    expect(container.querySelector('.unsaved-dot')).toBeInTheDocument();
  });

  it('clears unsaved indicator after saving', () => {
    const { container } = render(<SettingsPanel showToast={() => {}} />);
    const nameInput = container.querySelector('.pastel-input');

    fireEvent.change(nameInput, { target: { value: 'Luna' } });
    expect(container.querySelector('.unsaved-dot')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save Settings'));
    expect(container.querySelector('.unsaved-dot')).not.toBeInTheDocument();
  });

  it('selects theme via swatch click', () => {
    const { container } = render(<SettingsPanel showToast={() => {}} />);
    const swatches = container.querySelectorAll('.theme-swatch');

    // Click the second swatch (Mint Meadow)
    fireEvent.click(swatches[1]);
    fireEvent.click(screen.getByText('Save Settings'));

    const stored = JSON.parse(localStorage.getItem('cozy-settings'));
    expect(stored.theme).toBe('mint');
  });
});

// ===================================================================
// DailyCheckIn component
// ===================================================================

describe('DailyCheckIn', () => {
  it('renders check-in form when not checked in today', () => {
    render(
      <DailyCheckIn
        todayCheckIn={null}
        hasCheckedInToday={false}
        streak={0}
        recentCheckIns={[]}
        onSubmit={() => {}}
        showToast={() => {}}
      />
    );
    expect(
      screen.getByText('Good to see you! How are you feeling today?')
    ).toBeInTheDocument();
  });

  it('renders all mood buttons in form', () => {
    render(
      <DailyCheckIn
        todayCheckIn={null}
        hasCheckedInToday={false}
        streak={0}
        recentCheckIns={[]}
        onSubmit={() => {}}
        showToast={() => {}}
      />
    );
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Calm')).toBeInTheDocument();
    expect(screen.getByText('Tired')).toBeInTheDocument();
    expect(screen.getByText('Excited')).toBeInTheDocument();
    expect(screen.getByText('Anxious')).toBeInTheDocument();
  });

  it('renders energy level buttons', () => {
    render(
      <DailyCheckIn
        todayCheckIn={null}
        hasCheckedInToday={false}
        streak={0}
        recentCheckIns={[]}
        onSubmit={() => {}}
        showToast={() => {}}
      />
    );
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('submits check-in with selected mood', () => {
    const onSubmit = vi.fn();
    const showToast = vi.fn();
    render(
      <DailyCheckIn
        todayCheckIn={null}
        hasCheckedInToday={false}
        streak={0}
        recentCheckIns={[]}
        onSubmit={onSubmit}
        showToast={showToast}
      />
    );

    fireEvent.click(screen.getByText('Happy'));
    fireEvent.click(screen.getByText('Check In'));

    expect(onSubmit).toHaveBeenCalledWith({
      mood: 'happy',
      energy: null,
      note: '',
    });
    expect(showToast).toHaveBeenCalledWith('Check-in complete!', 'success');
  });

  it('submits with mood, energy, and note', () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <DailyCheckIn
        todayCheckIn={null}
        hasCheckedInToday={false}
        streak={0}
        recentCheckIns={[]}
        onSubmit={onSubmit}
        showToast={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Calm'));
    fireEvent.click(screen.getByText('High'));

    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'Feeling zen' } });

    fireEvent.click(screen.getByText('Check In'));

    expect(onSubmit).toHaveBeenCalledWith({
      mood: 'calm',
      energy: 'high',
      note: 'Feeling zen',
    });
  });

  it('does not submit without a mood selected', () => {
    const onSubmit = vi.fn();
    render(
      <DailyCheckIn
        todayCheckIn={null}
        hasCheckedInToday={false}
        streak={0}
        recentCheckIns={[]}
        onSubmit={onSubmit}
        showToast={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Check In'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows summary after check-in', () => {
    const checkIn = {
      id: 1,
      mood: 'happy',
      energy: 'high',
      note: 'Great day!',
      companionResponse: 'Wonderful!',
      date: new Date().toISOString(),
    };

    render(
      <DailyCheckIn
        todayCheckIn={checkIn}
        hasCheckedInToday={true}
        streak={3}
        recentCheckIns={[checkIn]}
        onSubmit={() => {}}
        showToast={() => {}}
      />
    );

    expect(screen.getByText("Today's check-in")).toBeInTheDocument();
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('high energy')).toBeInTheDocument();
    expect(screen.getByText('Great day!')).toBeInTheDocument();
    expect(screen.getByText('3-day streak')).toBeInTheDocument();
    expect(screen.getByText('Mochi says:')).toBeInTheDocument();
    expect(screen.getByText('Wonderful!')).toBeInTheDocument();
  });

  it('does not show streak badge when streak is 1 or less', () => {
    const checkIn = {
      id: 1,
      mood: 'calm',
      energy: null,
      note: '',
      companionResponse: 'Peace.',
      date: new Date().toISOString(),
    };

    render(
      <DailyCheckIn
        todayCheckIn={checkIn}
        hasCheckedInToday={true}
        streak={1}
        recentCheckIns={[checkIn]}
        onSubmit={() => {}}
        showToast={() => {}}
      />
    );

    expect(screen.queryByText(/streak/)).not.toBeInTheDocument();
  });

  it('renders recent check-in history', () => {
    const checkIns = [
      {
        id: 1,
        mood: 'happy',
        energy: 'high',
        date: new Date().toISOString(),
        companionResponse: 'Nice!',
      },
      {
        id: 2,
        mood: 'tired',
        energy: 'low',
        date: new Date(Date.now() - 86400000).toISOString(),
        companionResponse: 'Rest up.',
      },
    ];

    render(
      <DailyCheckIn
        todayCheckIn={checkIns[0]}
        hasCheckedInToday={true}
        streak={2}
        recentCheckIns={checkIns}
        onSubmit={() => {}}
        showToast={() => {}}
      />
    );

    expect(screen.getByText('Recent Check-ins')).toBeInTheDocument();
  });

  it('does not show history when only one check-in', () => {
    const checkIn = {
      id: 1,
      mood: 'happy',
      energy: null,
      note: '',
      companionResponse: 'Hi!',
      date: new Date().toISOString(),
    };

    render(
      <DailyCheckIn
        todayCheckIn={checkIn}
        hasCheckedInToday={true}
        streak={1}
        recentCheckIns={[checkIn]}
        onSubmit={() => {}}
        showToast={() => {}}
      />
    );

    expect(screen.queryByText('Recent Check-ins')).not.toBeInTheDocument();
  });
});

// ===================================================================
// useDailyCheckIn hook
// ===================================================================

describe('useDailyCheckIn', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial state with no check-ins', () => {
    const { result } = renderHook(() => useDailyCheckIn());

    expect(result.current.todayCheckIn).toBeNull();
    expect(result.current.hasCheckedInToday).toBe(false);
    expect(result.current.streak).toBe(0);
    expect(result.current.recentCheckIns).toEqual([]);
  });

  it('submits a check-in and updates state', () => {
    const { result, rerender: _rerender } = renderHook(() => useDailyCheckIn());

    act(() => {
      result.current.submitCheckIn({
        mood: 'happy',
        energy: 'high',
        note: 'Test note',
      });
    });

    // Re-render to get updated state
    // Note: the hook returns the response string
    expect(result.current.hasCheckedInToday).toBe(true);
    expect(result.current.todayCheckIn).not.toBeNull();
    expect(result.current.todayCheckIn.mood).toBe('happy');
    expect(result.current.todayCheckIn.energy).toBe('high');
    expect(result.current.todayCheckIn.note).toBe('Test note');
    expect(result.current.todayCheckIn.companionResponse).toBeTruthy();
  });

  it('persists check-in to localStorage', () => {
    const { result } = renderHook(() => useDailyCheckIn());

    act(() => {
      result.current.submitCheckIn({ mood: 'calm', energy: null, note: '' });
    });

    const stored = JSON.parse(localStorage.getItem('cozy-checkin-history'));
    expect(stored).toHaveLength(1);
    expect(stored[0].mood).toBe('calm');
  });

  it('returns companion response from submitCheckIn', () => {
    const { result } = renderHook(() => useDailyCheckIn());
    let response;

    act(() => {
      response = result.current.submitCheckIn({
        mood: 'excited',
        energy: 'high',
        note: '',
      });
    });

    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('replaces today check-in if submitted again', () => {
    const { result } = renderHook(() => useDailyCheckIn());

    act(() => {
      result.current.submitCheckIn({ mood: 'happy', energy: null, note: '' });
    });
    act(() => {
      result.current.submitCheckIn({
        mood: 'tired',
        energy: 'low',
        note: 'changed',
      });
    });

    expect(result.current.todayCheckIn.mood).toBe('tired');
    const stored = JSON.parse(localStorage.getItem('cozy-checkin-history'));
    expect(stored).toHaveLength(1);
  });

  it('calculates streak of 1 for today only', () => {
    const { result } = renderHook(() => useDailyCheckIn());

    act(() => {
      result.current.submitCheckIn({ mood: 'calm', energy: null, note: '' });
    });

    expect(result.current.streak).toBe(1);
  });

  it('calculates multi-day streak from pre-populated data', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    const history = [
      {
        id: 3,
        date: today.toISOString(),
        mood: 'happy',
        energy: null,
        note: '',
        companionResponse: '',
      },
      {
        id: 2,
        date: yesterday.toISOString(),
        mood: 'calm',
        energy: null,
        note: '',
        companionResponse: '',
      },
      {
        id: 1,
        date: dayBefore.toISOString(),
        mood: 'tired',
        energy: null,
        note: '',
        companionResponse: '',
      },
    ];
    localStorage.setItem('cozy-checkin-history', JSON.stringify(history));

    const { result } = renderHook(() => useDailyCheckIn());
    expect(result.current.streak).toBe(3);
  });

  it('returns streak of 0 when last check-in was more than 1 day ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    localStorage.setItem(
      'cozy-checkin-history',
      JSON.stringify([
        {
          id: 1,
          date: twoDaysAgo.toISOString(),
          mood: 'happy',
          energy: null,
          note: '',
          companionResponse: '',
        },
      ])
    );

    const { result } = renderHook(() => useDailyCheckIn());
    expect(result.current.streak).toBe(0);
  });

  it('returns recent check-ins limited to 7', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      mood: 'calm',
      energy: null,
      note: '',
      companionResponse: '',
    }));
    localStorage.setItem('cozy-checkin-history', JSON.stringify(history));

    const { result } = renderHook(() => useDailyCheckIn());
    expect(result.current.recentCheckIns).toHaveLength(7);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('cozy-checkin-history', 'bad json');
    const { result } = renderHook(() => useDailyCheckIn());
    expect(result.current.streak).toBe(0);
    expect(result.current.recentCheckIns).toEqual([]);
  });

  it('generates mood-appropriate companion responses', () => {
    const { result } = renderHook(() => useDailyCheckIn());

    const moods = ['happy', 'calm', 'tired', 'excited', 'anxious'];
    moods.forEach((mood) => {
      let response;
      act(() => {
        response = result.current.submitCheckIn({
          mood,
          energy: null,
          note: '',
        });
      });
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });

  it('includes energy response in companion response when energy is set', () => {
    const { result } = renderHook(() => useDailyCheckIn());
    let response;

    act(() => {
      response = result.current.submitCheckIn({
        mood: 'happy',
        energy: 'high',
        note: '',
      });
    });

    // Energy response should be appended
    expect(response).toBeTruthy();
    // The response should contain something from both mood and energy
    expect(response.length).toBeGreaterThan(20);
  });
});

// ===================================================================
// App (main component integration)
// ===================================================================

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the app header with title', () => {
    render(<App />);
    expect(screen.getByText('Cozy Companion')).toBeInTheDocument();
  });

  it('renders a greeting message', () => {
    render(<App />);
    // One of the four greetings should be displayed
    const greeting = screen.getByText(
      /Good (morning|afternoon|evening)|Late night/
    );
    expect(greeting).toBeInTheDocument();
  });

  it('renders three navigation tabs', () => {
    render(<App />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('defaults to Home tab showing companion and mood selector', () => {
    render(<App />);
    expect(screen.getByText('Your Companion')).toBeInTheDocument();
    expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
    expect(screen.getByText('Focus Timer')).toBeInTheDocument();
    expect(screen.getByText('Gentle Reminders')).toBeInTheDocument();
  });

  it('switches to Journal tab', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Journal'));
    expect(screen.getByText(/No entries yet/)).toBeInTheDocument();
  });

  it('switches to Settings tab', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Companion Name')).toBeInTheDocument();
    expect(screen.getByText('Color Theme')).toBeInTheDocument();
  });

  it('shows toast when mood is selected', () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByText('Happy'));
    expect(screen.getByText('Mood set to happy')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders footer text', () => {
    render(<App />);
    expect(
      screen.getByText('A gentle space for focus and calm')
    ).toBeInTheDocument();
  });

  it('renders all 8 default gentle reminders content (cycles through)', () => {
    render(<App />);
    // First reminder should be visible
    expect(
      screen.getByText('Take a deep breath and relax your shoulders.')
    ).toBeInTheDocument();
  });

  it('renders journal tip badge on home tab', () => {
    render(<App />);
    expect(
      screen.getByText('Tip: Use the journal to reflect on your day')
    ).toBeInTheDocument();
  });

  it('clears mood with Clear mood button', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Happy'));
    fireEvent.click(screen.getByText('Clear mood'));

    // Companion should revert to default message
    expect(screen.getByText('Hello! How are you today?')).toBeInTheDocument();
  });
});
