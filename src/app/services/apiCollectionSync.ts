import { ApiError, apiJson } from "@/lib/apiClient";

export async function fetchCollection<T>(
  path: string,
  collectionKey: string,
  token?: string,
): Promise<T[]> {
  const data = await apiJson<Record<string, T[]>>(path, {}, token);
  const list = data[collectionKey];
  return Array.isArray(list) ? list : [];
}

export async function syncCollectionToApi<T extends { id: string }>(
  resourcePath: string,
  items: T[],
  token?: string,
  collectionKey?: string,
): Promise<void> {
  const resolvedCollectionKey =
    collectionKey ?? resourcePath.replace(/^\//, "").split("/")[0];

  if (token && resolvedCollectionKey) {
    try {
      const remote = await fetchCollection<T>(
        resourcePath,
        resolvedCollectionKey,
        token,
      );
      const localIds = new Set(items.map((item) => item.id));
      for (const remoteItem of remote) {
        if (!localIds.has(remoteItem.id)) {
          await apiJson(
            `${resourcePath}/${encodeURIComponent(remoteItem.id)}`,
            { method: "DELETE" },
            token,
          );
        }
      }
    } catch (error) {
      console.warn(`[Lecompas] réconciliation ${resourcePath}`, error);
    }
  }

  for (const item of items) {
    try {
      await apiJson(
        `${resourcePath}/${encodeURIComponent(item.id)}`,
        {
          method: "PUT",
          body: JSON.stringify(item),
        },
        token,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await apiJson(
          resourcePath,
          {
            method: "POST",
            body: JSON.stringify(item),
          },
          token,
        );
      } else {
        throw error;
      }
    }
  }
}
