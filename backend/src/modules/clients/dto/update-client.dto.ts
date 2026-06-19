import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  status?: string;
}
