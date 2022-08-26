/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ScmIntegrations } from '../ScmIntegrations';
import { AzureIntegrationConfig } from './config';

import { DefaultAzureCredentialsProvider } from './DefaultAzureCredentialsProvider';
import { ConfigReader } from '@backstage/config';
import { AzureCredentials } from './types';

const mockGetConfigCredentials = ({
  host,
  owner,
  token,
}: AzureIntegrationConfig): AzureCredentials => {
  return {
    type: 'token',
    token: `${host}-${owner}-${token}`,
    headers: {
      token: `${host}-${owner}-${token}`,
    },
  };
};

let integrations: ScmIntegrations;

const org1Config: AzureIntegrationConfig = {
  host: 'dev.azure.com',
  owner: 'org1',
  token: 'hardcoded_token_2',
};

const org2Config: AzureIntegrationConfig = {
  host: 'dev.azure.com',
  owner: 'org2',
  token: 'hardcoded_token_3',
};

const fallbackConfig: AzureIntegrationConfig = {
  host: 'my.dev.azure.com',
  token: 'hardcoded_token_1',
};

describe('DefaultAzureCredentialsProvider tests', () => {
  beforeEach(() => {
    integrations = ScmIntegrations.fromConfig(
      new ConfigReader({
        integrations: {
          azure: [fallbackConfig, org1Config, org2Config],
        },
      }),
    );
    jest.resetAllMocks();
  });

  describe('getCredentials', () => {
    it('returns the credentials for the matching config', async () => {
      const provider =
        DefaultAzureCredentialsProvider.fromIntegrations(integrations);

      provider.getConfigCredentials = jest.fn(mockGetConfigCredentials);

      const org1Credentials = await provider.getCredentials({
        url: `https://${org1Config.host}/${org1Config.owner}/someProject/_git/someRepo`,
      });
      const org2Credentials = await provider.getCredentials({
        url: `https://${org2Config.host}/${org2Config.owner}/someProject/_git/someRepo`,
      });
      const fallbackCredentials = await provider.getCredentials({
        url: `https://${fallbackConfig.host}/someOwner/someProject/_git/someRepo`,
      });

      expect(org1Credentials).toEqual(mockGetConfigCredentials(org1Config));
      expect(org2Credentials).toEqual(mockGetConfigCredentials(org2Config));
      expect(fallbackCredentials).toEqual(
        mockGetConfigCredentials(fallbackConfig),
      );
    });
  });
});
