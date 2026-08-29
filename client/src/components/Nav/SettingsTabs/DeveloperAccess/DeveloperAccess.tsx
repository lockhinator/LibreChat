import { useState } from 'react';
import copy from 'copy-to-clipboard';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Button, Label, useToastContext } from '@librechat/client';
import { useDeveloperAccessQuery } from '~/data-provider';
import { useLocalize } from '~/hooks';

export default function DeveloperAccess() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [visible, setVisible] = useState(false);
  const query = useDeveloperAccessQuery();
  const access = query.data;
  const config = access
    ? JSON.stringify(
        {
          provider: {
            litellm: {
              npm: '@ai-sdk/openai-compatible',
              name: 'Lockhinator AI',
              options: { baseURL: access.baseURL, apiKey: access.apiKey },
              models: { [access.model]: { name: 'Qwen 3.8 27B' } },
            },
          },
          model: `litellm/${access.model}`,
        },
        null,
        2,
      )
    : '';

  const reveal = async () => {
    if (!access) {
      const result = await query.refetch();
      if (!result.data) {
        showToast({ status: 'error', message: localize('com_ui_developer_access_error') });
        return;
      }
    }
    setVisible((current) => !current);
  };

  const copyValue = (value: string) => {
    if (!copy(value)) {
      showToast({ status: 'error', message: localize('com_ui_copy_failed') });
      return;
    }
    showToast({ status: 'success', message: localize('com_ui_copied_to_clipboard') });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>{localize('com_ui_developer_access')}</Label>
          <p className="text-sm text-text-secondary">{localize('com_ui_developer_access_info')}</p>
        </div>
        <Button variant="outline" onClick={reveal} disabled={query.isFetching}>
          {visible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {visible
            ? localize('com_ui_hide')
            : query.isFetching
              ? localize('com_ui_loading')
              : localize('com_ui_reveal')}
        </Button>
      </div>
      {visible && access && (
        <div className="space-y-3 rounded-md border border-border-medium p-3">
          <div>
            <Label>{localize('com_ui_api_key')}</Label>
            <div className="flex gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-surface-secondary px-3 py-2">
                {access.apiKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyValue(access.apiKey)}
                aria-label={localize('com_ui_copy_to_clipboard')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>{localize('com_ui_opencode_config')}</Label>
            <div className="relative">
              <pre className="max-h-64 overflow-auto rounded bg-surface-secondary p-3 text-xs">
                {config}
              </pre>
              <Button
                className="absolute right-2 top-2"
                variant="outline"
                size="icon"
                onClick={() => copyValue(config)}
                aria-label={localize('com_ui_copy_to_clipboard')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
