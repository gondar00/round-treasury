import { Injectable } from '@nestjs/common';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlaidService {
  private plaidClient: PlaidApi;

  constructor(private prisma: PrismaService) {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });
    this.plaidClient = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string) {
    const response = await this.plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Round Treasury',
      products: [Products.Transactions],
      country_codes: [CountryCode.Gb],
      language: 'en',
    });
    return response.data;
  }

  async exchangePublicToken(userId: string, publicToken: string) {
    const response = await this.plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = response.data;

    const institutionResponse = await this.plaidClient.itemGet({
      access_token,
    });

    const institutionId = institutionResponse.data.item.institution_id;
    let institutionName: string | undefined;

    if (institutionId) {
      try {
        const instResponse = await this.plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Gb],
        });
        institutionName = instResponse.data.institution.name;
      } catch (e) {
        // Institution name is not critical
      }
    }

    const plaidItem = await this.prisma.plaidItem.create({
      data: {
        userId,
        accessToken: access_token,
        itemId: item_id,
        institutionId,
        institutionName,
      },
    });

    return plaidItem;
  }

  async getAccounts(accessToken: string) {
    const response = await this.plaidClient.accountsGet({
      access_token: accessToken,
    });
    return response.data.accounts;
  }

  async syncTransactions(accessToken: string, cursor?: string) {
    const response = await this.plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor || undefined,
    });
    return response.data;
  }
}
