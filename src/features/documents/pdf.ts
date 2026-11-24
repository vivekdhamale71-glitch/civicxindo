import type { DocRow } from "./OfficialDocument";

/** Builds an English PDF that mirrors the on-screen official document (letterhead, QR, digital signature box, watermark). */
export async function downloadOfficialPdf(opts: { title: string; refNo: string; date: string; rows: DocRow[]; signer: string; qrId: string; filename: string; note?: string }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const navy: [number, number, number] = [27, 42, 74];
  const body: [number, number, number] = [91, 101, 120];

  // Watermark: the civicXindo mark (24 spokes) drawn faintly in the centre.
  const cx = W / 2, cy = 430, R = 170;
  doc.setDrawColor(236, 239, 245);
  doc.setLineWidth(2.4);
  doc.circle(cx, cy, R);
  doc.circle(cx, cy, R * 0.2);
  doc.setLineWidth(1.4);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24, r2 = i % 2 === 0 ? 0.86 : 0.74;
    doc.line(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3, cx + Math.cos(a) * R * r2, cy + Math.sin(a) * R * r2);
  }

  // Letterhead
  doc.setTextColor(...body);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("GOVERNMENT OF INDIA (DEMO)", 48, 50);
  doc.setTextColor(...navy);
  doc.setFontSize(20);
  doc.text("civicXindo", 48, 74);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...body);
  doc.text("National Welfare Schemes Portal", 48, 90);
  const band = (W - 96) / 3;
  doc.setFillColor(255, 153, 51); doc.rect(48, 104, band, 3, "F");
  doc.setFillColor(235, 235, 235); doc.rect(48 + band, 104, band, 3, "F");
  doc.setFillColor(19, 136, 8); doc.rect(48 + band * 2, 104, band, 3, "F");

  doc.setFontSize(9);
  doc.text("Reference no.", 48, 136);
  doc.text("Date", W - 48, 136, { align: "right" });
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(opts.refNo, 48, 152);
  doc.text(new Date(opts.date).toLocaleString("en-IN"), W - 48, 152, { align: "right" });

  doc.setFontSize(16);
  doc.text(opts.title, W / 2, 196, { align: "center" });

  let y = 236;
  doc.setFontSize(10);
  for (const r of opts.rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...body);
    doc.text(r.label, 48, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    const lines = doc.splitTextToSize(r.value, W - 260);
    doc.text(lines, 230, y);
    y += 14 * lines.length + 10;
    doc.setDrawColor(225, 229, 238);
    doc.setLineWidth(0.5);
    doc.line(48, y - 14, W - 48, y - 14);
  }
  if (opts.note) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...body);
    doc.text(doc.splitTextToSize(opts.note, W - 96), 48, y + 6);
    y += 40;
  }

  // QR + signature
  const qr = document.getElementById(opts.qrId) as HTMLCanvasElement | null;
  const qy = Math.max(y + 20, 600);
  if (qr) doc.addImage(qr.toDataURL("image/png"), "PNG", 48, qy, 96, 96);
  doc.setFontSize(8);
  doc.setTextColor(...body);
  doc.text("Scan to verify at civicXindo", 48, qy + 110);

  doc.setDrawColor(21, 128, 61);
  doc.setFillColor(240, 248, 243);
  doc.setLineWidth(1.2);
  doc.roundedRect(W - 248, qy + 10, 200, 76, 8, 8, "FD");
  doc.setTextColor(21, 128, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Digitally signed", W - 234, qy + 34);
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(opts.signer, 176), W - 234, qy + 52);
  doc.text(new Date(opts.date).toLocaleString("en-IN"), W - 234, qy + 76);

  doc.setFontSize(7.5);
  doc.setTextColor(...body);
  doc.text("Demo prototype - not an official government document. Computer-generated; no physical signature required.", W / 2, 800, { align: "center" });
  doc.save(opts.filename);
}
