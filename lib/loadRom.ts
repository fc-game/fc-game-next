import { loadBinary } from "@/lib/utils";

export function loadRomBySlug(slug: string): Promise<any> {
  return new Promise((resolve, reject) => {
    loadBinary(`${slug}.nes`, (err, data) => {
      if (err) reject(err);
      else resolve(data as any);
    });
  });
}
