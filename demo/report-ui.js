'use strict';
const WeeklyReportUI = (() => {
  const PRESETS = {
    gemini: {
      wireFormat: 'gemini',
      defaultModel: 'gemini-2.5-flash',
      placeholder: 'AIza... (Gemini API key)',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    },
    openai: {
      wireFormat: 'openai-responses',
      defaultModel: 'gpt-4o-mini',
      placeholder: 'sk-... (OpenAI API key)',
      baseUrl: 'https://api.openai.com/v1',
    },
    claude: {
      wireFormat: 'anthropic',
      defaultModel: 'claude-haiku-4-5',
      placeholder: 'sk-ant-... (Anthropic key)',
      baseUrl: 'https://api.anthropic.com/v1',
    },
    deepseek: {
      wireFormat: 'openai-chat',
      defaultModel: 'deepseek-chat',
      placeholder: 'sk-... (DeepSeek API key)',
      baseUrl: 'https://api.deepseek.com',
    },
    openrouter: {
      wireFormat: 'openai-chat',
      defaultModel: 'openai/gpt-4o-mini',
      placeholder: 'sk-or-... (OpenRouter key)',
      baseUrl: 'https://openrouter.ai/api/v1',
    },
    custom: {
      wireFormat: null,
      defaultModel: '',
      placeholder: 'API key for custom endpoint',
      baseUrl: '',
    },
  };

  const button = document.getElementById?.('generate-report');
  const output = document.getElementById?.('weekly-report');
  const status = document.getElementById?.('report-status');
  const providerSelect = document.getElementById?.('report-provider');
  const modelInput = document.getElementById?.('report-model');
  const customFields = document.getElementById?.('report-custom-fields');
  const baseUrlInput = document.getElementById?.('report-base-url');
  const wireFormatSelect = document.getElementById?.('report-wire-format');
  const keyInput = document.getElementById?.('report-api-key');
  const toggleKeyButton = document.getElementById?.('toggle-api-key');
  const clearKeyButton = document.getElementById?.('clear-api-key');

  let snapshot = '';
  let summary = null;
  let controller = null;
  let version = 0;

  function syncProviderUI(resetModel = false) {
    const provider = providerSelect?.value || 'gemini';
    const preset = PRESETS[provider] || PRESETS.gemini;
    if (customFields) customFields.hidden = provider !== 'custom';
    if (keyInput) keyInput.placeholder = preset.placeholder;
    if (resetModel && modelInput && provider !== 'custom') {
      modelInput.value = preset.defaultModel;
    }
  }

  function resetKeyVisibility() {
    if (keyInput) keyInput.type = 'password';
    if (toggleKeyButton) {
      toggleKeyButton.setAttribute?.('aria-pressed', 'false');
      toggleKeyButton.textContent = 'Show';
      toggleKeyButton.setAttribute?.('aria-label', 'Show API key');
    }
  }

  syncProviderUI(false);
  providerSelect?.addEventListener?.('change', () => syncProviderUI(true));

  toggleKeyButton?.addEventListener?.('click', () => {
    if (!keyInput) return;
    const reveal = keyInput.type === 'password';
    keyInput.type = reveal ? 'text' : 'password';
    toggleKeyButton.setAttribute?.('aria-pressed', String(reveal));
    toggleKeyButton.textContent = reveal ? 'Hide' : 'Show';
    toggleKeyButton.setAttribute?.('aria-label', reveal ? 'Hide API key' : 'Show API key');
  });

  clearKeyButton?.addEventListener?.('click', () => {
    if (keyInput) keyInput.value = '';
    resetKeyVisibility();
    if (controller) {
      version++;
      controller.abort();
      controller = null;
      if (button) {
        button.disabled = !summary;
        button.textContent = 'Generate weekly report';
      }
      if (output) output.textContent = '';
    }
    if (status) {
      status.textContent = 'API key cleared from memory.';
    }
  });

  function sanitizeErrorMessage(message, apiKey = '') {
    let text = typeof message === 'string' ? message : String(message || '');
    if (apiKey) {
      text = text.split(apiKey).join('[redacted]');
      try {
        const encoded = encodeURIComponent(apiKey);
        if (encoded) text = text.split(encoded).join('[redacted]');
      } catch {}
    }
    text = text
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
      .replace(/([?&](?:key|api_key|token)=)[^&\s"')]+/gi, '$1[redacted]')
      .replace(/\b(?:sk-[A-Za-z0-9_-]{6,}|AIza[0-9A-Za-z_-]{10,}|xai-[A-Za-z0-9_-]{6,}|gsk_[A-Za-z0-9_-]{6,}|or-[A-Za-z0-9_-]{6,})\b/g, '[redacted]');
    return text.trim();
  }

  function validateCustomBaseUrl(raw) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) throw new Error('Enter a Custom Base URL.');
    if (typeof URL !== 'function') throw new Error('URL validation is unavailable in this environment.');
    let parsed;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error('Enter a valid Custom Base URL.');
    }
    if (parsed.username || parsed.password || /^https?:\/\/[^/?#]*@/i.test(trimmed)) {
      throw new Error('Custom Base URL must not include credentials.');
    }
    if (parsed.search || parsed.hash || /[?#]/.test(trimmed)) {
      throw new Error('Custom Base URL must not include a query string or fragment.');
    }
    const isHttps = parsed.protocol === 'https:';
    const isLocalHttp = parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
    if (!isHttps && !isLocalHttp) {
      throw new Error('Custom Base URL must use HTTPS (or http://localhost / http://127.0.0.1).');
    }
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    const isBareRoot = cleanPath === '';
    return { base: `${parsed.origin}${cleanPath}`, isBareRoot };
  }

  function buildEndpointUrl(provider, base, wireFormat, model, isBareRoot) {
    const clean = base.replace(/\/+$/, '');
    if (wireFormat === 'openai-chat') {
      if (/\/chat\/completions$/.test(clean)) return clean;
      if (provider === 'deepseek') return `${clean}/chat/completions`;
      return isBareRoot ? `${clean}/v1/chat/completions` : `${clean}/chat/completions`;
    }
    if (wireFormat === 'openai-responses') {
      if (/\/responses$/.test(clean)) return clean;
      return isBareRoot ? `${clean}/v1/responses` : `${clean}/responses`;
    }
    if (wireFormat === 'anthropic') {
      if (/\/messages$/.test(clean)) return clean;
      return isBareRoot ? `${clean}/v1/messages` : `${clean}/messages`;
    }
    if (wireFormat === 'gemini') {
      const encodedModel = encodeURIComponent(model);
      if (/\/models\/[^/]+:generateContent$/.test(clean)) return clean;
      if (/\/models$/.test(clean)) return `${clean}/${encodedModel}:generateContent`;
      return isBareRoot
        ? `${clean}/v1beta/models/${encodedModel}:generateContent`
        : `${clean}/models/${encodedModel}:generateContent`;
    }
    throw new Error('Unsupported API format.');
  }

  async function readErrorDetail(response, apiKey) {
    let raw = '';
    try {
      if (typeof response.text === 'function') {
        raw = await response.text();
      } else if (typeof response.json === 'function') {
        const parsed = await response.json();
        raw = parsed?.error?.message || parsed?.message || parsed?.error || '';
      }
    } catch {}
    if (!raw) return '';
    let detail = '';
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.error?.message === 'string') detail = parsed.error.message;
      else if (typeof parsed?.error === 'string') detail = parsed.error;
      else if (typeof parsed?.message === 'string') detail = parsed.message;
      else detail = raw;
    } catch {
      detail = raw;
    }
    const clean = sanitizeErrorMessage(detail, apiKey).replace(/\s+/g, ' ').trim();
    return clean.length > 160 ? `${clean.slice(0, 157)}...` : clean;
  }

  function extractReportText(wireFormat, data) {
    let report = '';
    if (wireFormat === 'gemini') {
      const cand = data?.candidates?.[0];
      if (cand?.finishReason !== 'STOP') {
        throw new Error('The AI provider did not complete the weekly report. Please try again.');
      }
      report = (cand.content?.parts || [])
        .filter(p => p && !p.thought && typeof p.text === 'string' && !p.text.startsWith('THOUGHT:'))
        .map(p => p.text.trim())
        .filter(Boolean)
        .join(' ')
        .trim();
    } else if (wireFormat === 'openai-responses') {
      if (data?.status !== 'completed') {
        throw new Error('The AI provider did not complete the weekly report. Please try again.');
      }
      report = (data.output || [])
        .filter(o => o && o.type === 'message')
        .flatMap(o => o.content || [])
        .filter(c => c && c.type === 'output_text' && typeof c.text === 'string')
        .map(c => c.text)
        .join(' ')
        .trim();
      if (!report && typeof data?.output_text === 'string') {
        report = data.output_text.trim();
      }
    } else if (wireFormat === 'openai-chat') {
      const choice = data?.choices?.[0];
      if (choice?.finish_reason !== 'stop' || typeof choice?.message?.content !== 'string') {
        throw new Error('The AI provider did not complete the weekly report. Please try again.');
      }
      report = choice.message.content.trim();
    } else if (wireFormat === 'anthropic') {
      if (!['end_turn', 'stop_sequence'].includes(data?.stop_reason)) {
        throw new Error('The AI provider did not complete the weekly report. Please try again.');
      }
      report = (data.content || [])
        .filter(b => b && b.type === 'text' && typeof b.text === 'string')
        .map(b => b.text.trim())
        .filter(Boolean)
        .join(' ')
        .trim();
    }
    if (!report || report.length > 3000 || /[\r\n]|^\s*(?:#|[-*•]\s)/.test(report)) {
      throw new Error('The AI provider returned an unexpected report format. Please try again.');
    }
    return report;
  }

  function buildDirectRequest(apiKey) {
    const reportData = typeof WeeklyReportData !== 'undefined' ? WeeklyReportData : globalThis.WeeklyReportData;
    if (
      typeof reportData?.validateSummary !== 'function' ||
      typeof reportData?.modelSummary !== 'function'
    ) {
      throw new Error('Weekly summary formatter is unavailable. Reload the page and try again.');
    }
    reportData.validateSummary(summary);
    const inputPayload = JSON.stringify(reportData.modelSummary(summary));

    const systemPrompt = (
      globalThis.WeeklyReportPromptConfig?.getActiveReportPrompt?.() ||
      globalThis.getActiveReportPrompt?.() ||
      (typeof globalThis.WeeklyReportPrompt === 'string' ? globalThis.WeeklyReportPrompt : '')
    ).trim();
    if (!systemPrompt) {
      throw new Error('Weekly report prompt is unavailable. Reload the page and try again.');
    }

    const provider = providerSelect?.value || 'gemini';
    const preset = PRESETS[provider] || PRESETS.gemini;
    const isCustom = provider === 'custom';
    const wireFormat = isCustom ? (wireFormatSelect?.value || 'openai-chat') : preset.wireFormat;
    const model = (modelInput?.value ?? preset.defaultModel).trim();
    if (!model) {
      throw new Error('Enter a model name.');
    }

    let endpointUrl;
    if (isCustom) {
      const { base, isBareRoot } = validateCustomBaseUrl(baseUrlInput?.value);
      endpointUrl = buildEndpointUrl(provider, base, wireFormat, model, isBareRoot);
    } else {
      endpointUrl = buildEndpointUrl(provider, preset.baseUrl, wireFormat, model, false);
    }

    let headers;
    let payload;
    if (wireFormat === 'gemini') {
      headers = {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      };
      payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: inputPayload }] }],
        generationConfig: { maxOutputTokens: 2048 },
      };
    } else if (wireFormat === 'openai-responses') {
      headers = {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      };
      payload = {
        model,
        instructions: systemPrompt,
        input: inputPayload,
        max_output_tokens: 2048,
        store: false,
      };
    } else if (wireFormat === 'openai-chat') {
      headers = {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        ...(provider === 'openrouter' ? { 'x-title': 'Spendly' } : {}),
      };
      let isOpenAiHost = false;
      try {
        isOpenAiHost = typeof URL === 'function'
          ? new URL(endpointUrl).hostname === 'api.openai.com'
          : endpointUrl.startsWith('https://api.openai.com/') || endpointUrl.startsWith('https://api.openai.com:443/');
      } catch {}
      const useMaxCompletionTokens =
        isOpenAiHost &&
        /^(?:o[1-9](?:$|[-.])|gpt-5)/i.test(model);
      payload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputPayload },
        ],
        [useMaxCompletionTokens ? 'max_completion_tokens' : 'max_tokens']: 2048,
        stream: false,
      };
    } else if (wireFormat === 'anthropic') {
      headers = {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
      payload = {
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: inputPayload }],
      };
    } else {
      throw new Error('Unsupported API format.');
    }

    return { endpointUrl, headers, payload, wireFormat, isCustom };
  }

  function update(next, mode) {
    const fingerprint = JSON.stringify([mode, next]);
    if (fingerprint === snapshot) return;
    snapshot = fingerprint;
    summary = next;
    version++;
    controller?.abort();
    controller = null;
    if (button) {
      button.disabled = !next;
      button.textContent = 'Generate weekly report';
    }
    if (output) output.textContent = '';
    if (status) {
      status.textContent = next
        ? 'Ready. Only summary statistics are sent when you generate a report.'
        : 'A report is unavailable for these dates.';
    }
  }

  button?.addEventListener?.('click', async () => {
    if (!summary || button.disabled) return;
    const current = version;
    if (output) output.textContent = '';

    if (summary.current.count === 0) {
      if (output) output.textContent = 'No expenses were recorded for this seven-day period.';
      if (status) status.textContent = 'No API request was needed.';
      return;
    }

    const apiKey = keyInput?.value?.trim() || '';
    const isDirect = Boolean(apiKey);

    if (!isDirect && location.protocol === 'file:') {
      if (status) status.textContent = 'Start the Node server and open its URL to generate AI reports.';
      return;
    }

    let directConfig = null;
    if (isDirect) {
      try {
        directConfig = buildDirectRequest(apiKey);
      } catch (error) {
        if (status) status.textContent = sanitizeErrorMessage(error.message, apiKey);
        return;
      }
    }

    const requestController = new AbortController();
    controller = requestController;
    const timer = setTimeout(() => requestController.abort(), 90000);
    button.disabled = true;
    button.textContent = 'Generating…';
    if (status) status.textContent = 'Generating your English weekly report…';

    try {
      let report;
      if (isDirect) {
        let response;
        try {
          response = await fetch(directConfig.endpointUrl, {
            method: 'POST',
            headers: directConfig.headers,
            body: JSON.stringify(directConfig.payload),
            signal: requestController.signal,
            redirect: 'error',
          });
        } catch (err) {
          if (err?.name === 'AbortError') throw err;
          throw new Error(
            'Could not reach the provider from your browser (network or CORS error). Check your connection, Base URL, or CORS support.'
          );
        }

        if (!response.ok) {
          const detail = await readErrorDetail(response, apiKey);
          const suffix = detail ? ` (${detail})` : '';
          if (response.status === 401 || response.status === 403) {
            throw new Error(`Authentication failed (${response.status}). Check your API key and provider permissions.${suffix}`);
          }
          if (response.status === 404) {
            throw new Error(`Endpoint or model not found (404). Check the model name${directConfig.isCustom ? ' and Custom Base URL' : ''}.${suffix}`);
          }
          if (response.status === 429) {
            throw new Error(`Rate limit or quota exceeded (429). Wait a moment or check your provider billing.${suffix}`);
          }
          throw new Error(`Provider request failed (HTTP ${response.status}).${suffix}`);
        }

        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error('The provider returned an invalid or truncated JSON response. Check the endpoint URL and try again.');
        }
        report = extractReportText(directConfig.wireFormat, data);
      } else {
        const configuredBase = globalThis.SPENDLY_CONFIG?.apiBaseUrl || '';
        if (!configuredBase && location.hostname?.endsWith('.github.io')) {
          throw new Error('The report server has not been connected yet. Enter an API key above to call a provider directly, or connect a backend server.');
        }

        const activePrompt =
          globalThis.WeeklyReportPromptConfig?.getActiveReportPrompt?.() ||
          globalThis.getActiveReportPrompt?.() ||
          '';
        const isCustomPrompt = Boolean(
          globalThis.WeeklyReportPromptConfig?.isCustomReportPrompt?.(activePrompt) ||
          globalThis.isCustomReportPrompt?.(activePrompt)
        );
        const bodyPayload = isCustomPrompt ? { summary, prompt: activePrompt } : summary;

        let response;
        try {
          response = await fetch(configuredBase.replace(/\/+$/, '') + '/api/weekly-report', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(bodyPayload),
            signal: requestController.signal,
          });
        } catch (err) {
          if (err?.name === 'AbortError') throw err;
          throw new Error('Could not reach the report server. Please try again.');
        }

        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error('AI reporting requires the Node server. This static host does not provide the report API.');
        }
        if (!response.ok) throw new Error(result?.error || 'The weekly report could not be generated.');
        if (typeof result?.report !== 'string' || !result.report.trim()) {
          throw new Error('The server returned an empty report.');
        }
        report = result.report;
      }

      if (current !== version) return;
      if (output) output.textContent = report;
      if (status) status.textContent = 'AI-generated report. Check the figures against your recorded summary.';
    } catch (error) {
      if (current === version && status) {
        if (error?.name === 'AbortError') {
          status.textContent = 'The request timed out. Please try again.';
        } else {
          const msg = error?.message === 'Failed to fetch' && !isDirect
            ? 'Could not reach the report server. Please try again.'
            : sanitizeErrorMessage(error?.message || 'The weekly report could not be generated.', apiKey);
          status.textContent = msg;
        }
      }
    } finally {
      clearTimeout(timer);
      if (current === version) {
        button.disabled = false;
        button.textContent = 'Generate weekly report';
        controller = null;
      }
    }
  });

  return { update };
})();
