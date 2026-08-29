import type { APIRoute } from 'astro';
import annualData from '../../../data/enem-2026.json';
import sources from '../../../data/sources.json';

const usedSources = sources.filter((source) => annualData.officialSourceIds.includes(source.id));

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...annualData,
  sources: usedSources,
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  },
});
