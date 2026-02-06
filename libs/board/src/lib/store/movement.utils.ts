import { Spot, Passage } from '../models/board.models';

/**
 * Build an adjacency list from spots and passages for pathfinding
 */
function buildAdjacencyList(spots: Spot[], passages: Passage[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const spot of spots) {
    adjacency.set(spot.id, []);
  }
  for (const passage of passages) {
    adjacency.get(passage.fromSpotId)?.push(passage.toSpotId);
    adjacency.get(passage.toSpotId)?.push(passage.fromSpotId);
  }
  return adjacency;
}

/**
 * Find all spots reachable within N moves using BFS
 * Includes enemy-occupied spots (for battles) but not own-occupied spots
 *
 * @param startSpotId - The spot to start from
 * @param maxMoves - Maximum number of moves allowed
 * @param spots - All spots on the board
 * @param passages - All passages connecting spots
 * @param ownOccupiedSpotIds - Spots occupied by the current player's Pokemon
 * @param enemyOccupiedSpotIds - Spots occupied by enemy Pokemon
 */
export function findReachableSpots(
  startSpotId: string,
  maxMoves: number,
  spots: Spot[],
  passages: Passage[],
  ownOccupiedSpotIds: Set<string>,
  enemyOccupiedSpotIds: Set<string>,
): string[] {
  if (maxMoves <= 0) return [];

  const adjacency = buildAdjacencyList(spots, passages);

  // BFS with distance tracking
  const reachable: string[] = [];
  const visited = new Map<string, number>(); // spotId -> distance
  const queue: { spotId: string; distance: number }[] = [{ spotId: startSpotId, distance: 0 }];
  visited.set(startSpotId, 0);

  while (queue.length > 0) {
    const { spotId, distance } = queue.shift()!;
    const isStartingSpot = distance === 0;

    if (distance > 0) {
      // Can't land on own Pokemon
      if (!ownOccupiedSpotIds.has(spotId)) {
        reachable.push(spotId);
      }
    }

    // Can't move through enemy Pokemon (battle stops movement)
    // Can't move through own Pokemon either
    // BUT: starting spot (distance 0) is where the Pokemon IS, so allow exploring from it
    const isBlockedByOwn = !isStartingSpot && ownOccupiedSpotIds.has(spotId);
    const isBlockedByEnemy = enemyOccupiedSpotIds.has(spotId);
    const isBlocked = isBlockedByOwn || isBlockedByEnemy;

    if (distance < maxMoves && !isBlocked) {
      const neighbors = adjacency.get(spotId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, distance + 1);
          queue.push({ spotId: neighbor, distance: distance + 1 });
        }
      }
    }
  }

  return reachable;
}

/**
 * Find reachable spots from entry point (for Pokemon leaving bench)
 * Entry spot itself costs 1 movement, so remaining moves is (totalMoves - 1)
 *
 * @param entrySpotId - The entry spot where the Pokemon enters the board
 * @param totalMoves - Total movement points available
 * @param spots - All spots on the board
 * @param passages - All passages connecting spots
 * @param ownOccupiedSpotIds - Spots occupied by the current player's Pokemon
 * @param enemyOccupiedSpotIds - Spots occupied by enemy Pokemon
 */
export function findReachableSpotsFromEntry(
  entrySpotId: string,
  totalMoves: number,
  spots: Spot[],
  passages: Passage[],
  ownOccupiedSpotIds: Set<string>,
  enemyOccupiedSpotIds: Set<string>,
): string[] {
  // Entry counts as 1 move, so remaining moves are (totalMoves - 1)
  const remainingMoves = totalMoves - 1;
  if (remainingMoves <= 0) return []; // No further movement after entry
  return findReachableSpots(
    entrySpotId,
    remainingMoves,
    spots,
    passages,
    ownOccupiedSpotIds,
    enemyOccupiedSpotIds,
  );
}
