import { amb, Draggable, translate } from 'dragology';

export type DiagramState = {
  nodes: string[];
  edges: {
    name: string;
    tuples: [string, string][];
  }[];
  binRels: {
    leftOf: [string, string][];
    above: [string, string][];
    horizontallyAligned: [string, string][];
    verticallyAligned: [string, string][];
  };
  unconstrained: string[];
};

export const initialState: DiagramState = {
  nodes: ['Node1', 'Node2', 'Node3'],
  edges: [
    { name: 'rightChild', tuples: [['Node1', 'Node2']] },
    { name: 'leftChild', tuples: [['Node1', 'Node3']] },
  ],
  binRels: {
    leftOf: [],
    above: [],
    horizontallyAligned: [],
    verticallyAligned: [],
  },
  unconstrained: ['Node1', 'Node2', 'Node3'],
};

function cartesianToSvg(coord: [number, number]): [number, number] {
  const [x, y] = coord;
  const xmin = -500,
    xmax = 500,
    ymin = -400,
    ymax = 400;
  const width = 1000,
    height = 800;
  const svgX = ((x - xmin) / (xmax - xmin)) * width;
  const svgY = height - ((y - ymin) / (ymax - ymin)) * height;
  return [svgX, svgY];
}

export const DraggableDiagram: Draggable<DiagramState> = ({
  state,
  d,
  draggedId,
}) => {
  const NODE_HEIGHT = 50;
  const NODE_WIDTH = 100;

  return (
    <g>
      <rect
        width="100%"
        height="100%"
        fill="#ffff00"
        strokeWidth={10}
        stroke="#000000"
      />
      {state.nodes.map(node => {
        const [centerX, centerY] = cartesianToSvg([x, y]);
        const nodeX = centerX - NODE_WIDTH / 2;
        const nodeY = centerY - NODE_HEIGHT / 2;
        return (
          <g key={node} transform={translate(nodeX, nodeY)}>
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              fill="#f5f7fa"
              stroke="#d4d8e0"
              strokeWidth={1}
              rx={10}
            />
            <text
              x={NODE_WIDTH / 2}
              y={NODE_HEIGHT / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize={18}
              fontWeight="600"
            >
              {node}
            </text>
          </g>
        );
      })}
      {state.edges.map(({ name: edgeName, tuples }) =>
        tuples.map(([sourceId, targetId], index) => {
          const sourceNode = sourceId;
          const targetNode = targetId;
          if (!sourceNode || !targetNode) return null;

          const [sourceX, sourceY] = cartesianToSvg([
            sourceNode.x,
            sourceNode.y,
          ]);
          const [targetX, targetY] = cartesianToSvg([
            targetNode.x,
            targetNode.y,
          ]);

          return (
            <line
              key={`${edgeName}-${index}`}
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="#000000"
              strokeWidth={2}
            />
          );
        })
      )}
    </g>
  );
};
