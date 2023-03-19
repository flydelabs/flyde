export function fullInsIdPath (insId: string, ancestorsInsIds?: string): string {
  if (!insId) {
    throw new Error('insId is not defined');
  }
  return ancestorsInsIds ? `${ancestorsInsIds}.${insId}` : insId;
}