import Graph from 'graphology';
import { degree, betweennessCentrality, eigenvectorCentrality } from 'graphology-metrics/centrality';
import { pagerank } from 'graphology-metrics/centrality/pagerank';
import { Artist, NodeLink } from '@/types';

export interface CentralityScores {
  degree: Map<string, number>;
  betweenness: Map<string, number>;
  eigenvector: Map<string, number>;
  pagerank: Map<string, number>;
}

export function calculateCentrality(
  artists: Artist[],
  links: NodeLink[]
): CentralityScores {
  // Build graph
  const graph = new Graph({ type: 'undirected' });

  // Add nodes
  artists.forEach(artist => {
    graph.addNode(artist.id);
  });

  // Add edges
  links.forEach(link => {
    if (!graph.hasEdge(link.source, link.target)) {
      graph.addEdge(link.source, link.target);
    }
  });

  // Calculate all centrality metrics
  const degreeScores = degree(graph);
  const betweennessScores = betweennessCentrality(graph);
  const eigenvectorScores = eigenvectorCentrality(graph);
  const pagerankScores = pagerank(graph);

  return {
    degree: new Map(Object.entries(degreeScores)),
    betweenness: new Map(Object.entries(betweennessScores)),
    eigenvector: new Map(Object.entries(eigenvectorScores)),
    pagerank: new Map(Object.entries(pagerankScores)),
  };
}
