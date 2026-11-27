/** Browser export lifecycle, independent of any mathematical playhead. Keep
 * the URL alive until the browser has consumed the synthetic download click. */
export function downloadJson(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  try { link.click(); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
