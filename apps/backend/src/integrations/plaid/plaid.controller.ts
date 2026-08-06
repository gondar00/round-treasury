import { Controller, Post, Body } from '@nestjs/common';
import { PlaidService } from './plaid.service';

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

@Controller('api/integrations/plaid')
export class PlaidController {
  constructor(private plaidService: PlaidService) {}

  @Post('create-link-token')
  async createLinkToken() {
    const data = await this.plaidService.createLinkToken(DEMO_USER_ID);
    return { link_token: data.link_token };
  }

  @Post('exchange-public-token')
  async exchangePublicToken(@Body() body: { public_token: string }) {
    const plaidItem = await this.plaidService.exchangePublicToken(
      DEMO_USER_ID,
      body.public_token,
    );
    return { item_id: plaidItem.id };
  }
}
