/**
 * @typedef {'row' | 'col' | 'region'} ConstraintType
 */

/**
 * A single unsatisfied constraint on the puzzle board.
 *
 * @typedef {Object} Constraint
 * @property {ConstraintType} type  - The dimension of the constraint.
 * @property {number}         index - Zero-based index (row number, col number, or region id).
 */

/**
 * A board cell identified by its row and column.
 *
 * @typedef {Object} Cell
 * @property {number} r - Row index (zero-based).
 * @property {number} c - Column index (zero-based).
 */

/**
 * Shared protocol that Queens and future games implement so that all
 * game-specific logic (tactics, solver loop, difficulty scorer) can work
 * against any conforming game without coupling to Queens internals.
 *
 * @typedef {Object} GameInterface
 *
 * @property {number} n
 *   Board size: the grid is n×n and there are n constraints of each type.
 *
 * @property {function(Constraint): Cell[]} candidatesAt
 *   Returns the current candidate cells for the given constraint.
 *   An empty array means the constraint is unsatisfiable or already satisfied
 *   (all candidates have been placed or eliminated).
 *
 * @property {function(): Constraint[]} constraints
 *   Returns all active (unsatisfied) constraints in a stable, consistent order:
 *   rows 0…n-1, then columns 0…n-1, then regions 0…n-1, skipping any that
 *   are already satisfied.
 *
 * @property {function(Cell, number): void} place
 *   Marks `cell` as the solution for its row, column, and region, then
 *   eliminates every cell that conflicts with that placement.  The second
 *   argument is the solver tier (1 = trivial … 4 = guess-and-check).
 *
 * @property {function(): boolean} isDone
 *   Returns true when the puzzle is fully solved (every constraint satisfied).
 *
 * @property {function(): Object} stateSnapshot
 *   Returns a serialisable deep copy of the current candidate state so that a
 *   caller can save a point-in-time and later restore it via their own logic.
 *
 * @property {function(Cell): boolean} eliminate
 *   Removes a single cell from the candidate set without placing a piece.
 *   Returns true if the cell was still a candidate (i.e. the state changed);
 *   returns false if it had already been eliminated.
 *
 * @property {function(Cell): number} regionOf
 *   Returns the region identifier for the given cell.  Region ids are integers
 *   in the range 0…n-1 for an n×n board.
 */

export {};
