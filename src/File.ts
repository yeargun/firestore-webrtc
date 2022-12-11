import { CHUNK_SIZE } from "./Config";

export async function readFile(file: File) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.addEventListener("error", (error) => {
      console.error("Error reading file: ", error);
      reject(error);
    });
    reader.addEventListener("abort", (event) => {
      reject(event);
    });

    reader.addEventListener("load", (e) => {
      resolve(e?.target?.result);
    });

    reader.readAsArrayBuffer(file);
  });
}

export function humanFileSize(bytes: number, si = true, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}

export const saveFile = (
  meta: { type?: any; name?: any },
  data: any[] | undefined
) => {
  const dataBlob = new Blob(data, { type: meta.type });
  const url = URL.createObjectURL(dataBlob);

  let a = document.createElement("a");
  a.href = url;
  a.download = meta.name;
  a.click();
};

export const fileDownloadPercentage = (fileSize: number, buffer: any[]) => {
  const expectedChunkNum = fileSize / CHUNK_SIZE;
  return Math.floor((buffer.length * 100) / expectedChunkNum);
};
