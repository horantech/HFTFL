export async function renderTicketCanvas({
  qrSrc,
  guestName,
  sponsorName,
}: {
  qrSrc: string;
  guestName: string;
  sponsorName: string;
}) {
  const W = 1600;
  const H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  const bg = await loadImage("/ticket-template.png");
  const qr = await loadImage(qrSrc);

  ctx.drawImage(bg, 0, 0, W, H);

  const rightX = W * 0.5;
  const rightW = W * 0.5;
  const bottomPad = H * 0.06;
  const qrSize = W * 0.275;
  const qrPad = W * 0.008;
  const textBlock = H * 0.12;
  const qrX = rightX + (rightW - qrSize) / 2;
  const qrY = H - bottomPad - textBlock - qrSize;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - qrPad, qrY - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2);
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  const centerX = rightX + rightW / 2;
  const labelY = qrY + qrSize + H * 0.03;
  ctx.textAlign = "center";

  ctx.fillStyle = "rgba(58,57,55,0.62)";
  ctx.font = "500 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText("ADMIT ONE", centerX, labelY);

  ctx.fillStyle = "#3a3937";
  ctx.font = "600 36px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(guestName, centerX, labelY + 40);

  if (sponsorName && sponsorName !== guestName) {
    ctx.fillStyle = "rgba(58,57,55,0.62)";
    ctx.font = "500 20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(sponsorName, centerX, labelY + 70);
  }

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
