sed -i "s/String(botState?.riskConfig?.maxOpenTrades ?? '4')/\"2\"/" src/components/RiskSettingsPanel.tsx
sed -i "s/String(botState?.riskConfig?.entriesPerSignal ?? '1')/\"2\"/" src/components/RiskSettingsPanel.tsx
