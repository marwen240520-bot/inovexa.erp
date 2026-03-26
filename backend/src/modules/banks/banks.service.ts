import { Injectable } from '@nestjs/common';

@Injectable()
export class BanksService {
  private banks = [
    { code: 'BIAT', name: 'Banque Internationale Arabe de Tunisie', swift: 'BIATTNTT', logo: 'biat.png', website: 'https://www.biat.com.tn' },
    { code: 'STB', name: 'Société Tunisienne de Banque', swift: 'STBKTNTT', logo: 'stb.png', website: 'https://www.stb.com.tn' },
    { code: 'ATB', name: 'Arab Tunisian Bank', swift: 'ATBKTNTT', logo: 'atb.png', website: 'https://www.atb.tn' },
    { code: 'BNA', name: 'Banque Nationale Agricole', swift: 'BNATTNTT', logo: 'bna.png', website: 'https://www.bna.tn' },
    { code: 'BH', name: 'Banque de l\'Habitat', swift: 'BHABTNTT', logo: 'bh.png', website: 'https://www.bh.com.tn' },
    { code: 'UIB', name: 'Union Internationale de Banques', swift: 'UIBITNTT', logo: 'uib.png', website: 'https://www.uib.com.tn' },
    { code: 'BT', name: 'Banque de Tunisie', swift: 'BTBITNTT', logo: 'bt.png', website: 'https://www.bt.com.tn' },
    { code: 'AmenBank', name: 'Amen Bank', swift: 'AMENTNTT', logo: 'amen.png', website: 'https://www.amenbank.com.tn' },
    { code: 'Zitouna', name: 'Zitouna Bank', swift: 'ZITOTNTT', logo: 'zitouna.png', website: 'https://www.zitouna.tn' },
    { code: 'QNB', name: 'QNB Tunisie', swift: 'QNBATNTT', logo: 'qnb.png', website: 'https://www.qnb.tn' },
    { code: 'Wifack', name: 'Wifack International Bank', swift: 'WIBATNTT', logo: 'wifack.png', website: 'https://www.wifackbank.com.tn' },
    { code: 'TIB', name: 'Tunis International Bank', swift: 'TIBITNTT', logo: 'tib.png', website: 'https://www.tib.com.tn' },
    { code: 'BFPME', name: 'Banque de Financement des PME', swift: 'BFPMTNTT', logo: 'bfpme.png', website: 'https://www.bfpme.tn' }
  ];

  getBanks() { return this.banks; }
  getBankByCode(code: string) { return this.banks.find(b => b.code === code); }

  async processPayment(invoiceId: string, bankCode: string, amount: number): Promise<any> {
    return { success: true, transactionId: `TXN_${Date.now()}`, bankCode, amount, invoiceId, timestamp: new Date(), status: 'completed' };
  }
}
