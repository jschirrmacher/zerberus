export default async function wait(millseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millseconds))
}
