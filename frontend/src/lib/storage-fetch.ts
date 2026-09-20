/**
 * A request straight to the file store, whose failure can be read.
 *
 * These requests do not go through the API: another host, no session, and the
 * exact Content-Type bound into the signature. That also means a refusal never
 * arrives as a status code — a blocked origin, a dropped connection or a
 * missing CORS rule all make `fetch` reject with "Failed to fetch", which is
 * English and tells the owner nothing they can act on. One place turns that
 * into a sentence; a real HTTP answer is handed back untouched for the caller
 * to judge.
 */
export async function storageFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new Error('Không kết nối được tới kho lưu trữ. Kiểm tra mạng rồi thử lại.')
  }
}
