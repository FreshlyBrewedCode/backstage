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

import { AzureCredentials, AzureCredentialsProvider } from './types';
import { ScmIntegrationRegistry } from '../registry';
import { AzureIntegration } from './AzureIntegration';
import { AzureUrl } from './AzureUrl';
import { getAzureRequestOptions } from './core';
import { AzureIntegrationConfig } from './config';

/**
 * Handles the creation of default token credentials for the Azure integration.
 *
 * @public
 */
export class DefaultAzureCredentialsProvider
  implements AzureCredentialsProvider
{
  static fromIntegrations(integrations: ScmIntegrationRegistry) {
    return new DefaultAzureCredentialsProvider(integrations.azure.list());
  }

  private constructor(private readonly integrations: AzureIntegration[]) {}

  /**
   * Returns {@link AzureCredentials} for a given URL.
   *
   * @remarks
   *
   * The credentials are selected based on the host and owner of the given URL.
   *
   * @param opts - The Azure URL
   * @returns A promise of {@link AzureCredentials}.
   */
  async getCredentials(opts: { url: string }): Promise<AzureCredentials> {
    const host = new URL(opts.url).host;
    let owner: string | undefined = undefined;
    try {
      owner = AzureUrl.fromRepoUrl(opts.url).getOwner();
    } catch {
      // Unable to get owner from Url
    }

    // Filter integrations with matching host
    const matches = this.integrations.filter(i => i.config.host === host);

    // Find Integration with matching owner, or fallback to first matching host
    const match = matches.find(i => i.config.owner === owner) ?? matches.at(0);

    if (!match) {
      throw new Error(
        `There is no Azure integration that matches ${opts.url}. Please add a configuration for an integration.`,
      );
    }

    // Return token credentials for the matching Azure integration
    return this.getConfigCredentials(match.config);
  }

  getConfigCredentials(config: AzureIntegrationConfig): AzureCredentials {
    return {
      type: 'token',
      headers: getAzureRequestOptions(config).headers,
      token: config.token,
    };
  }
}
