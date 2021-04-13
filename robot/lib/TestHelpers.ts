export async function isPending(promise: Promise<unknown>) {
  const timeoutResolver = new Promise((resolve) => setTimeout(() => resolve("pending"), 1))
  return (await Promise.race([promise, timeoutResolver])) === "pending"
}
