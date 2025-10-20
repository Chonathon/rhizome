// Helper utilities for tuning d3-force simulations shared across force graphs.
// Inspired by react-force-graph collision playground examples to curb jitter
// by clamping velocities and softly constraining the layout within bounds.

type SimulationNode = {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

export type CollisionMitigationOptions<Node extends SimulationNode = SimulationNode> = {
  maxSpeed?: number;
  minSpeedThreshold?: number;
  boundaryRadius?: number;
  boundaryBounce?: number;
  radiusAccessor?: (node: Node) => number;
};

export function createCollisionMitigationForce<Node extends SimulationNode = SimulationNode>(
  options: CollisionMitigationOptions<Node> = {}
) {
  const {
    maxSpeed = 3,
    minSpeedThreshold = 0,
    boundaryRadius,
    boundaryBounce = 0.35,
    radiusAccessor,
  } = options;

  const maxSpeedSq = maxSpeed * maxSpeed;
  const minSpeedSq = minSpeedThreshold * minSpeedThreshold;

  let nodes: Node[] = [];

  const force = () => {
    if (!nodes.length) return;

    for (const node of nodes) {
      if (!node) continue;

      const vx = node.vx || 0;
      const vy = node.vy || 0;
      const speedSq = vx * vx + vy * vy;

      if (speedSq > maxSpeedSq) {
        const factor = maxSpeed / Math.sqrt(speedSq || 1);
        node.vx = vx * factor;
        node.vy = vy * factor;
      } else if (minSpeedSq > 0 && speedSq > 0 && speedSq < minSpeedSq) {
        node.vx = vx * 0.6;
        node.vy = vy * 0.6;

        if (Math.abs(node.vx || 0) < 1e-4) node.vx = 0;
        if (Math.abs(node.vy || 0) < 1e-4) node.vy = 0;
      }

      if (!boundaryRadius) continue;

      const x = node.x || 0;
      const y = node.y || 0;
      const radius = radiusAccessor ? Math.max(0, radiusAccessor(node)) : 0;
      const limit = Math.max(0, boundaryRadius - radius);
      const distSq = x * x + y * y;

      if (limit > 0 && distSq > limit * limit) {
        const dist = Math.sqrt(distSq) || 1;
        const factor = limit / dist;
        node.x = x * factor;
        node.y = y * factor;
        node.vx = -(node.vx || 0) * boundaryBounce;
        node.vy = -(node.vy || 0) * boundaryBounce;
      }
    }
  };

  force.initialize = (simulationNodes: Node[]) => {
    nodes = simulationNodes;
  };

  return force;
}
