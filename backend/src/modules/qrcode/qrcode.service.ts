import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QRCodeService {
  async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data);
    } catch (err) {
      console.error('QR Code generation failed:', err);
      return null;
    }
  }

  async generateProductQRCode(productId: number, sku: string): Promise<string> {
    const productUrl = `${process.env.FRONTEND_URL}/products/${productId}`;
    const qrData = JSON.stringify({
      id: productId,
      sku: sku,
      url: productUrl,
      timestamp: new Date().toISOString()
    });
    return this.generateQRCode(qrData);
  }

  async generateBarcode(sku: string): Promise<string> {
    // Génération simple de code-barres (format Code 128)
    return `BAR-${sku}-${Date.now()}`;
  }
}
