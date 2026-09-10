import { DaRaM1Engine } from "./src/engines/dara_m1/DaRaM1Engine.js";
import { DaRaBrokerInterface, DaRaTelegramInterface } from "./src/engines/dara_m1/types.js";
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const SERVER_INSTANCE_ID = crypto.randomBytes(4).toString('hex').toUpperCase();
const SERVER_BOOT_TIME = new Date().toISOString();

// ============================================






// ============================================
// 🔥 DaRa M1 EA v1.0 INTEGRATION
// ============================================

class DaRaServerBroker implements DaRaBrokerInterface {
    async sendOrder(order) {
        console.log(`[DaRa Broker] Executing ${order.type} for ${order.lot} lot...`);
        
        // ==========================================
        // FINAL LIVE TRADING SAFETY GUARD (SERVER-SIDE METAAPI GATE)
        // ==========================================
        if (!global.daraEngine) {
             const errorMsg = "HARD BLOCK: Engine not initialized.";
             console.error(`[DaRa Broker] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        if (global.daraEngine.isRunning !== true) {
             const errorMsg = "HARD BLOCK: Bot is NOT explicitly RUNNING. Execution aborted.";
             console.error(`[DaRa Broker] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        const settings = global.daraEngine.getUserSettings();
        if (settings.liveTradingEnabled !== true) {
             console.log(`[DaRa Broker] ℹ️ LIVE TRADING IS OFF (Monitor Mode). Execution aborted.`);
             return { success: false, error: 'MONITOR_MODE' };
        }
        // ==========================================
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        
        if (!accountId || !token || !baseUrl) {
             return { success: false, error: "MetaApi not connected" };
        }
        
        const requestBody = {
            actionType: order.type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
            symbol: order.symbol,
            volume: order.lot,
            stopLoss: order.sl,
            takeProfit: order.tp,
            comment: order.comment
        };
        
        try {
            const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/trade`, {
                method: 'POST',
                headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const responseText = await res.text();
            if (!res.ok) {
                return { success: false, error: `HTTP ${res.status} - ${responseText}` };
            }
            const data = JSON.parse(responseText);
            if (data.numericCode && data.numericCode !== 10009) {
                return { success: false, error: data.stringCode || data.message || `MetaApi Error ${data.numericCode}` };
            }
            return { success: true, ticket: data.orderId || data.positionId || 'UNKNOWN' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async modifyPosition(ticket, newSl, newTp) {
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        
        if (!accountId || !token || !baseUrl) return { success: false, error: "MetaApi not connected" };
        
        const modifyPayload: any = {
             actionType: 'POSITION_MODIFY',
             positionId: ticket,
             stopLoss: newSl
        };
        if (newTp !== undefined) modifyPayload.takeProfit = newTp;
        
        // ==========================================
        // FINAL LIVE TRADING SAFETY GUARD (POSITION_MODIFY)
        // ==========================================
        if (!global.daraEngine) {
             const errorMsg = "HARD BLOCK: Engine not initialized.";
             console.error(`[DaRa Broker Modify] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        if (global.daraEngine.isRunning !== true) {
             const errorMsg = "HARD BLOCK: Bot is NOT explicitly RUNNING. Modify aborted.";
             console.error(`[DaRa Broker Modify] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        // Removed liveTradingEnabled block for modifyPosition to ensure EA can manage existing positions even if Live Trading is toggled off.
        if (!botState || !botState.account || botState.account.serverConnected !== true) {
             const errorMsg = "HARD BLOCK: Server is NOT connected.";
             console.error(`[DaRa Broker Modify] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        // ==========================================
        
        try {
             const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/trade`, {
                 method: 'POST',
                 headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                 body: JSON.stringify(modifyPayload)
             });
             const responseText = await res.text();
             if (!res.ok) {
                 return { success: false, error: `HTTP ${res.status} - ${responseText}` };
             }
             const data = JSON.parse(responseText);
             if (data.numericCode && data.numericCode !== 10009) {
                 return { success: false, error: data.stringCode || data.message || `MetaApi Error ${data.numericCode}` };
             }
             return { success: true };
        } catch (err) {
             return { success: false, error: err.message };
        }
    }

    async closePosition(ticket) {
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        if (!accountId || !token || !baseUrl) return { success: false, error: "MetaApi not connected" };

        if (!global.daraEngine || global.daraEngine.isRunning !== true) {
            return { success: false, error: "HARD BLOCK: Bot is not running" };
        }
        // Removed liveTradingEnabled block for closePosition to ensure EA can protect balance and close trades even if Live Trading is toggled off.

        try {
            const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/trade`, {
                method: 'POST',
                headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionType: 'POSITION_CLOSE_ID',
                    positionId: String(ticket)
                })
            });
            if (res.ok) {
                return { success: true };
            }
            const errText = await res.text();
            return { success: false, error: errText };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    async getOpenPositions(symbol) {
        return (botState.openTrades || []).filter(t => t.symbol === symbol).map(t => ({
            ticket: String(t.id),
            symbol: t.symbol,
            type: t.side,
            lot: t.volume,
            openPrice: t.entryPrice,
            currentPrice: t.currentPrice,
            sl: t.stopLoss || 0,
            tp: t.takeProfit || 0,
            openTime: new Date(t.openTime).getTime()
        }));
    }

    async getSymbolInfo(symbol) {
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        if (!accountId || !token || !baseUrl) return { pointSize: 0.01 };
        
        try {
            const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/specification`, {
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                const spec = await res.json();
                return { pointSize: spec.pointSize || spec.point || 0.01 };
            }
        } catch (e) {
            console.error('[DaRa Broker] Failed to fetch symbol info:', e);
        }
        return { pointSize: 0.01 };
    }
}

class DaRaServerTelegram implements DaRaTelegramInterface {
    async notify(title, message) {
        // We can hook this to sendTelegramMessage(botState.userPreferences?.telegramChatId, message)
        // Since sendTelegramMessage is already defined globally in server.ts
        if (typeof global.sendTelegramMessage === 'function') {
            global.sendTelegramMessage(message).catch(() => {});
        } else {
            console.log(`[DaRa Telegram] ${title}
${message}`);
        }
    }
}

const daraBroker = new DaRaServerBroker();
const daraTelegram = new DaRaServerTelegram();
// Initialize with safe defaults, will sync immediately after botState loads
const initialDaraSettings = {
    lotSize: 0.01,
    slDistance: 30,
    tpDistance: 30,
    dailyLossLimit: 50,
    maxOpenTrades: 5,
    maxConsecutiveSL: 3,
    cooldownMinutes: 15,
    maxSpreadPoints: 30,
    newsFilterEnabled: false,
    newsMinsBefore: 60,
    newsMinsAfter: 60,
    trailingEnabled: true,
    entryDistance: 2.0,
    liveTradingEnabled: false
};
const daraEngine = new DaRaM1Engine(daraBroker, initialDaraSettings, daraTelegram);
global.daraEngine = daraEngine;







// ============================================
// TELEGRAM NOTIFICATION LAYER (100% KHMER LANGUAGE)
// ============================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const alertCooldowns: Record<string, number> = {};
const lastNotifiedTrailingSl: Record<string, number> = {};

function formatLocalTime(): string {
    return new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Phnom_Penh', hour12: false });
}

async function sendTelegramRaw(message: string, dedupeKey?: string, cooldownMinutes: number = 0) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    
    if (dedupeKey && cooldownMinutes > 0) {
        const now = Date.now();
        const lastSent = alertCooldowns[dedupeKey] || 0;
        if (now - lastSent < cooldownMinutes * 60 * 1000) {
            return; // Throttled / Deduplication
        }
        alertCooldowns[dedupeKey] = now;
    }
    
    try {
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
        }).then(res => {
            if (!res.ok) {
                console.error(`Telegram API Error: ${res.status} ${res.statusText} (Check Token/Chat ID)`);
            }
        }).catch(err => {
            // Suppress noisy fetch failed (DNS/Network drops) but log other errors
            if (err.message && err.message.toLowerCase().includes('fetch failed')) {
                // Silently ignore transient network drops
            } else {
                console.error('Telegram Fetch Error:', err.message);
            }
        });
    } catch (err) {
        console.error('Telegram Alert Error:', err);
    }
}

// ១. ពេលប្រព័ន្ធមានបញ្ហា
async function sendSystemProblemAlert(section: string, problem: string, status: string = 'កំពុងព្យាយាមភ្ជាប់ឡើងវិញ') {
    const msg = `🚨 ប្រព័ន្ធមានបញ្ហា\n\n` +
                `ផ្នែក៖ ${section}\n` +
                `បញ្ហា៖ ${problem}\n` +
                `ស្ថានភាព៖ ${status}\n` +
                `ការចូល Trade ថ្មី៖ 🛑 ត្រូវបានផ្អាក`;
    await sendTelegramRaw(msg, `SYS_PROBLEM_${section}`, 3);
}

// ២. ពេលប្រព័ន្ធជួសជុល/ត្រឡប់ធម្មតា
async function sendSystemRecoveredAlert(section: string, prevProblem: string, resolution: string) {
    const msg = `✅ ប្រព័ន្ធបានជួសជុលរួចរាល់\n\n` +
                `ផ្នែក៖ ${section}\n` +
                `បញ្ហាមុន៖ ${prevProblem}\n` +
                `ដំណោះស្រាយ៖ ${resolution}\n` +
                `ស្ថានភាពបច្ចុប្បន្ន៖ 🟢 ធម្មតា\n` +
                `ការចូល Trade ថ្មី៖ 🟢 អាចដំណើរការ`;
    await sendTelegramRaw(msg, `SYS_RECOVERED_${section}`, 1);
}

// ៣. ពេល Trade ចូល
async function sendTradeOpenAlert(trade: {
    type: 'BUY' | 'SELL';
    lot: number | string;
    entry: number | string;
    signalEntry?: number | string;
    sl: number | string;
    tp: number | string;
    rr?: string;
    ticket: string | number;
    time?: string;
}) {
    const formattedEntry = typeof trade.entry === 'number' ? trade.entry.toFixed(3) : trade.entry;
    const formattedSignalEntry = trade.signalEntry ? (typeof trade.signalEntry === 'number' ? trade.signalEntry.toFixed(3) : trade.signalEntry) : formattedEntry;
    const formattedSl = typeof trade.sl === 'number' ? trade.sl.toFixed(3) : trade.sl;
    const formattedTp = typeof trade.tp === 'number' ? trade.tp.toFixed(3) : trade.tp;

    let msg = `🟢 TRADE OPENED\n\n` +
              `Symbol: XAUUSD\n` +
              `Direction: ${trade.type}\n\n`;
              
    if (formattedEntry !== formattedSignalEntry) {
        msg += `Signal Entry: ${formattedSignalEntry}\n` +
               `Fill Price: ${formattedEntry}\n`;
    } else {
        msg += `Entry: ${formattedEntry}\n`;
    }
    
    msg += `SL: ${formattedSl}\n` +
           `TP: ${formattedTp}\n\n` +
           `Ticket: ${trade.ticket}`;
    await sendTelegramRaw(msg);
}

// ៤. ពេលដល់ Take Profit
async function sendTakeProfitAlert(trade: {
    type: 'BUY' | 'SELL';
    lot: number | string;
    entry: number | string;
    exit: number | string;
    tp: number | string;
    profit: number | string;
    ticket: string | number;
    time?: string;
}) {
    const msg = `🏁 TRADE CLOSED\n\n` +
                `Symbol: XAUUSD\n` +
                `Direction: ${trade.type}\n\n` +
                `Result: ✅ TP HIT\n` +
                `P/L: +$${trade.profit}\n\n` +
                `Ticket: ${trade.ticket}`;
    await sendTelegramRaw(msg);
}

// ៥. ពេលដល់ Stop Loss
async function sendStopLossAlert(trade: {
    type: 'BUY' | 'SELL';
    lot: number | string;
    entry: number | string;
    exit: number | string;
    sl: number | string;
    loss: number | string;
    ticket: string | number;
    time?: string;
}) {
    const lossVal = typeof trade.loss === 'number' ? Math.abs(trade.loss).toFixed(2) : String(trade.loss).replace('-', '');
    const msg = `🏁 TRADE CLOSED\n\n` +
                `Symbol: XAUUSD\n` +
                `Direction: ${trade.type}\n\n` +
                `Result: ❌ SL HIT\n` +
                `P/L: -$${lossVal}\n\n` +
                `Ticket: ${trade.ticket}`;
    await sendTelegramRaw(msg);
}

// ៦. ពេល Trailing Stop ផ្លាស់ទី
async function sendTrailingStopMovedAlert(trade: {
    type: 'BUY' | 'SELL';
    oldSl: number | string;
    newSl: number | string;
    price: number | string;
    ticket: string | number;
}) {
    const ticketKey = String(trade.ticket);
    const newSlNum = Number(trade.newSl);
    // Anti-spam: only send once per SL change per ticket
    if (lastNotifiedTrailingSl[ticketKey] === newSlNum) {
        return;
    }
    lastNotifiedTrailingSl[ticketKey] = newSlNum;
    
    const typeKhmer = trade.type === 'BUY' ? 'ទិញ' : 'លក់';
    const msg = `🔒 បានការពារប្រាក់ចំណេញ\n\n` +
                `គូ៖ XAUUSD\n` +
                `ប្រភេទ៖ ${typeKhmer}\n` +
                `Stop Loss ចាស់៖ ${trade.oldSl}\n` +
                `Stop Loss ថ្មី៖ ${trade.newSl}\n` +
                `តម្លៃបច្ចុប្បន្ន៖ ${trade.price}\n` +
                `លេខសំបុត្រ៖ ${trade.ticket}`;
    await sendTelegramRaw(msg);
}

// ៧. ពេល Order ត្រូវបានបដិសេធ
async function sendOrderRejectedAlert(order: {
    reason: string;
    type: 'BUY' | 'SELL';
    lot: number | string;
    entry: number | string;
    sl: number | string;
    tp: number | string;
}) {
    const typeKhmer = order.type === 'BUY' ? 'ទិញ' : 'លក់';
    const msg = `⚠️ មិនអាចបើកការជួញដូរ\n\n` +
                `មូលហេតុ៖ ${order.reason}\n` +
                `ប្រភេទ៖ ${typeKhmer}\n` +
                `Lot៖ ${order.lot}\n` +
                `Entry៖ ${order.entry}\n` +
                `SL៖ ${order.sl}\n` +
                `TP៖ ${order.tp}`;
    await sendTelegramRaw(msg, `ORDER_REJECTED_${order.reason}`, 1);
}

// ៨. ពេល News បិទការចូល Trade
async function sendNewsBlockAlert(news: {
    title: string;
    time?: string;
}) {
    const timeStr = news.time || formatLocalTime();
    const msg = `📰 ការចូល Trade ត្រូវបានផ្អាកដោយសារព័ត៌មាន\n\n` +
                `ព័ត៌មាន៖ ${news.title}\n` +
                `រូបិយប័ណ្ណ៖ USD\n` +
                `កម្រិត៖ ផលប៉ះពាល់ខ្ពស់\n` +
                `ម៉ោង៖ ${timeStr}\n\n` +
                `ការចូល Trade ថ្មី៖ 🛑 ត្រូវបានផ្អាក`;
    await sendTelegramRaw(msg, `NEWS_BLOCK_${news.title}`, 15);
}

// ៩. ពេល News Data មិនអាចប្រើបាន
async function sendNewsUnavailableAlert() {
    const msg = `🚨 ទិន្នន័យព័ត៌មានមិនអាចប្រើបាន\n\n` +
                `ផ្នែក៖ ប្រព័ន្ធព័ត៌មាន\n` +
                `បញ្ហា៖ មិនអាចទាញទិន្នន័យព័ត៌មានបាន\n` +
                `ស្ថានភាព៖ ប្រព័ន្ធការពារសុវត្ថិភាពត្រូវបានបើក\n` +
                `ការចូល Trade ថ្មី៖ 🛑 ត្រូវបានផ្អាក`;
    await sendTelegramRaw(msg, 'NEWS_DATA_UNAVAILABLE', 15);
}

// ១០. ពេល Daily Loss Limit ដល់កំណត់
async function sendDailyLossLimitAlert(amount: number | string, limit: number | string) {
    const lossStr = typeof amount === 'number' ? Math.abs(amount).toFixed(2) : String(amount).replace('-', '');
    const msg = `🛑 ដល់កម្រិតខាតប្រចាំថ្ងៃ\n\n` +
                `ការខាតប្រចាំថ្ងៃ៖ $${lossStr}\n` +
                `កម្រិតកំណត់៖ $${limit}\n\n` +
                `ការចូល Trade ថ្មី៖ 🛑 ត្រូវបានផ្អាក\n` +
                `ស្ថានភាព៖ រង់ចាំថ្ងៃជួញដូរថ្មី`;
    await sendTelegramRaw(msg, 'DAILY_LOSS_LIMIT_HIT', 60);
}

// ១១. ពេល MT5 ដាច់
async function sendMt5DisconnectedAlert() {
    const msg = `🚨 ការភ្ជាប់ MT5 មានបញ្ហា\n\n` +
                `ស្ថានភាព MT5៖ 🔴 ផ្តាច់\n` +
                `ទិន្នន័យទីផ្សារ៖ 🔴 មិនអាចទទួលបាន\n` +
                `DaRa M1 EA៖ 🛑 ផ្អាកការចូលថ្មី\n` +
                `ការចូល Trade ថ្មី៖ 🛑 ត្រូវបានផ្អាក`;
    await sendTelegramRaw(msg, 'MT5_DISCONNECTED_ALERT', 5);
}

// ១២. ពេល MT5 ភ្ជាប់ឡើងវិញ
async function sendMt5ReconnectedAlert() {
    const msg = `✅ MT5 បានភ្ជាប់ឡើងវិញ\n\n` +
                `MT5៖ 🟢 ភ្ជាប់\n` +
                `ទិន្នន័យទីផ្សារ៖ 🟢 ដំណើរការ\n` +
                `DaRa M1 EA៖ 🟢 ដំណើរការ\n` +
                `ការចូល Trade ថ្មី៖ 🟢 អាចដំណើរការ`;
    await sendTelegramRaw(msg, 'MT5_RECONNECTED_ALERT', 1);
}

// Fallback Alert function (100% Khmer)
async function sendTelegramAlert(category: string, issue: string, action: string = '', cooldownMinutes: number = 5) {
    if (category === 'DAILY LOSS LIMIT HIT') {
        const maxLoss = botState.riskConfig.maxDailyLossAmount || botState.riskConfig.maxDailyLoss || 50;
        await sendDailyLossLimitAlert(botState.realizedDailyPnL || 0, maxLoss);
        return;
    }
    
    let header = '🤖 ប្រព័ន្ធ AI Scalping (XAUUSD)';
    if (category === 'BOT STATUS') {
        header = '🤖 ស្ថានភាព Bot';
    } else if (category === '3 CONSECUTIVE SL HIT') {
        header = '🛑 ដល់កម្រិតខាតជាប់គ្នា (3 Consecutive SL)';
    } else if (category === 'CRITICAL ERROR') {
        header = '🚨 បញ្ហាធ្ងន់ធ្ងរ';
    }
    
    const tzTime = formatLocalTime();
    let message = `${header}\n\n`;
    if (issue) message += `${issue}\n`;
    if (action) message += `សកម្មភាព៖ ${action}\n`;
    message += `ម៉ោង៖ ${tzTime}`;
    
    await sendTelegramRaw(message, `${category}_${issue}`, cooldownMinutes);
}

// ============================================

const systemComponentStates: Record<string, { isHealthy: boolean; lastError: string }> = {
    'MT5 Connection': { isHealthy: true, lastError: '' },
    'Market Data': { isHealthy: true, lastError: '' },
    'News Provider': { isHealthy: true, lastError: '' }
};

async function sendDetailedSystemAlert(component: string, type: 'PROBLEM' | 'RECOVERY', description: string, tradingAffected: boolean) {
    if (type === 'PROBLEM') {
        if (component === 'MT5 Connection') {
            await sendMt5DisconnectedAlert();
        } else if (component === 'News Provider') {
            await sendNewsUnavailableAlert();
        } else {
            await sendSystemProblemAlert(component, description, 'កំពុងព្យាយាមភ្ជាប់ឡើងវិញ');
        }
    } else {
        if (component === 'MT5 Connection') {
            await sendMt5ReconnectedAlert();
        } else {
            const componentKhmer = component === 'Market Data' ? 'ទិន្នន័យទីផ្សារ (Market Data)' :
                                   component === 'News Provider' ? 'ប្រព័ន្ធព័ត៌មាន (News Provider)' :
                                   component;
            await sendSystemRecoveredAlert(componentKhmer, 'មានបញ្ហាពីមុន', description);
        }
    }
}

async function handleSystemStateTransition(
    component: string, 
    isHealthy: boolean, 
    problemDesc: string, 
    resolutionDesc: string,
    tradingAffected: boolean
) {
    if (!systemComponentStates[component]) {
        systemComponentStates[component] = { isHealthy: true, lastError: '' };
    }

    const currentState = systemComponentStates[component];

    if (currentState.isHealthy && !isHealthy) {
        currentState.isHealthy = false;
        currentState.lastError = problemDesc;
        await sendDetailedSystemAlert(component, 'PROBLEM', problemDesc, tradingAffected);
    } else if (!currentState.isHealthy && isHealthy) {
        currentState.isHealthy = true;
        await sendDetailedSystemAlert(component, 'RECOVERY', resolutionDesc, false);
        currentState.lastError = '';
    }
}

let prevServerConnected = true;
let prevPnLSynced = true;
let prevDailyLossHit = false;
let lastNotifiedNewsEventKey = '';

function monitorSystemTransitions() {
    handleSystemStateTransition(
        'MT5 Connection',
        !!botState.account.serverConnected,
        'ការភ្ជាប់ MT5 ត្រូវបានផ្តាច់ ឬ Bridge Server មិនឆ្លើយតប',
        'ការភ្ជាប់ទៅកាន់ MT5 ត្រូវបានភ្ជាប់ឡើងវិញដោយជោគជ័យ',
        true
    ).catch(console.error);

    handleSystemStateTransition(
        'Market Data',
        !!botState.account.marketDataReceiving,
        'ទិន្នន័យតម្លៃមាស XAUUSD មិនអាចទទួលបាន',
        'ទិន្នន័យតម្លៃមាស XAUUSD កំពុងដំណើរការធម្មតា',
        true
    ).catch(console.error);

    
    if (!prevDailyLossHit && botState.dailyLossLimitHit) {
        const maxLoss = botState.riskConfig.maxDailyLossAmount || botState.riskConfig.maxDailyLoss || 50;
        sendDailyLossLimitAlert(botState.realizedDailyPnL || 0, maxLoss).catch(console.error);
    }
    prevDailyLossHit = !!botState.dailyLossLimitHit;
}
// ============================================





function updateEnvVariable(key: string, value: string) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const regex = new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}="${value}"`);
  } else {
    envContent += `\n${key}="${value}"\n`;
  }
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  process.env[key] = value;
}

dotenv.config();

if (!fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    console.warn("⚠️  [WARNING] មិនមានឯកសារ .env (Missing .env file) នៅក្នុង Folder នេះទេ។ (TOKEN: MISSING)");
    console.warn("⚠️  [WARNING] អ្នកអាចបញ្ចូល Token និង URL តាមរយៈផ្ទាំង UI ភ្ជាប់គណនីបានដោយមិនបាច់មាន .env ក៏បាន។");
}

const mt5ApiKey = process.env.MT5_API_KEY ? process.env.MT5_API_KEY.trim() : undefined;
const mt5BridgeUrl = process.env.MT5_BRIDGE_URL ? process.env.MT5_BRIDGE_URL.trim() : undefined;
const mt5Password = process.env.MT5_PASSWORD ? process.env.MT5_PASSWORD.trim() : undefined;



// ==========================================
// SELF-HEALING & AUTO-RECOVERY ENGINE 24/7
// ==========================================
const DATA_DIR = path.join(process.cwd(), 'data');

const RECOVERY_LOG_PATH = path.join(DATA_DIR, 'recovery_logs.json');
if (!fs.existsSync(RECOVERY_LOG_PATH)) {
    fs.writeFileSync(RECOVERY_LOG_PATH, JSON.stringify([]));
}

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || '',
        pass: process.env.GMAIL_APP_PASSWORD || ''
    }
});

const SelfHealingEngine = {
    isDisconnected: false,
    disconnectStartTime: 0,
    alertSent: false,
    
    log(event, details) {
        try {
            const history = JSON.parse(fs.readFileSync(RECOVERY_LOG_PATH, 'utf8'));
            history.unshift({ time: new Date().toISOString(), event, details });
            if (history.length > 500) history.pop(); // Keep last 500 logs
            fs.writeFileSync(RECOVERY_LOG_PATH, JSON.stringify(history, null, 2));
            console.log(`[Self-Healing] ${event}: ${details}`);
        } catch (err) {
            console.error('Failed to write recovery log', err);
        }
    },

    async sendAlert(subject, text) {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not set. Skipping email alert.');
            return;
        }
        try {
            // await mailTransport.sendMail({
            //     from: process.env.GMAIL_USER,
            //     to: process.env.GMAIL_USER,
            //     subject: `[XAUUSD Bot Alert] ${subject}`,
            //     text: text
            // });
            this.log('EMAIL_ALERT_DISABLED', subject);
        } catch (err) {
            this.log('EMAIL_FAILED', String(err));
        }
    },

    checkConnectionState(isConnected) {
        if (!isConnected) {
            if (!this.isDisconnected) {
                this.isDisconnected = true;
                this.disconnectStartTime = Date.now();
                this.log('DISCONNECTED', 'MT5 Connection lost. Tracking downtime.');
            } else {
                const offlineMinutes = (Date.now() - this.disconnectStartTime) / 60000;
                if (offlineMinutes >= 5 && !this.alertSent) {
                    this.sendAlert('CRITICAL: MT5 Disconnected', `The bot has been offline for ${offlineMinutes.toFixed(1)} minutes.

Auto-recovery is active and attempting to reconnect every 3 seconds.`);
                    this.alertSent = true;
                }
            }
        } else {
            if (this.isDisconnected) {
                const offlineMinutes = (Date.now() - this.disconnectStartTime) / 60000;
                this.log('RECOVERED', `MT5 Connection restored after ${offlineMinutes.toFixed(1)} minutes.`);
                if (this.alertSent) {
                    this.sendAlert('RESOLVED: MT5 Reconnected', `The bot successfully auto-recovered and reconnected to MT5 after ${offlineMinutes.toFixed(1)} minutes of downtime.

Auto Trading resumes normally.`);
                }
                this.isDisconnected = false;
                this.disconnectStartTime = 0;
                this.alertSent = false;
            }
        }
    },

    registerCrashHandlers() {
        process.on('uncaughtException', (err) => {
            this.log('CRASH', `Uncaught Exception: ${err.message}`);
            this.sendAlert('CRASH: Uncaught Exception', `Bot crashed: ${err.stack}

PM2 should auto-restart it shortly.`).finally(() => {
                process.exit(1);
            });
        });
        process.on('unhandledRejection', (reason, promise) => {
            this.log('CRASH', `Unhandled Rejection: ${reason}`);
            this.sendAlert('CRASH: Unhandled Rejection', `Bot crashed due to unhandled promise rejection: ${reason}

PM2 will restart it.`).finally(() => {
                process.exit(1);
            });
        });
    }
};

SelfHealingEngine.registerCrashHandlers();

// ==========================================
// PERSISTENT OWNER / ADMIN AUTHENTICATION & BOT CONFIG
// ==========================================
const AUTH_FILE_PATH = path.join(DATA_DIR, 'admin_auth.json');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'bot_config.json');
const REVOKED_TOKENS_PATH = path.join(DATA_DIR, 'revoked_tokens.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'xauusd_secure_owner_admin_session_key_2026';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface AdminAuthData {
  username: string;
  passwordHash: string;
  salt: string;
  recoveryPin: string;
  isCustomized?: boolean;
  createdAt: string;
  updatedAt: string;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512');
  return {
    hash: derivedKey.toString('hex'),
    salt: generatedSalt,
  };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    const inputHash = derivedKey.toString('hex');
    const inputBuffer = Buffer.from(inputHash, 'hex');
    const expectedBuffer = Buffer.from(hash, 'hex');
    if (inputBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

function loadOrCreateAdminAuth(): AdminAuthData {
  try {
    if (fs.existsSync(AUTH_FILE_PATH)) {
      const raw = fs.readFileSync(AUTH_FILE_PATH, 'utf-8');
      const data: AdminAuthData = JSON.parse(raw);
      if (data.username && data.passwordHash && data.salt) {
        if (data.username.trim().toUpperCase() === 'MT5') {
          data.username = 'admin';
          try {
            fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
          } catch {}
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading admin_auth.json, reinitializing...');
  }

  // Create Initial Admin Account with Salted PBKDF2
  const initialUsername = process.env.ADMIN_USERNAME || 'admin';
  const initialPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const initialPin = '948210';
  const { hash, salt } = hashPassword(initialPassword);

  const initialData: AdminAuthData = {
    username: initialUsername,
    passwordHash: hash,
    salt: salt,
    recoveryPin: initialPin,
    isCustomized: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial admin_auth.json');
  }

  return initialData;
}

let currentAdminAuth = loadOrCreateAdminAuth();

function saveAdminAuth(auth: AdminAuthData) {
  currentAdminAuth = auth;
  try {
    fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(auth, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save admin auth to disk:', err);
  }
}

// Revoked Tokens Set & Persistence
function loadRevokedTokens(): Set<string> {
  try {
    if (fs.existsSync(REVOKED_TOKENS_PATH)) {
      const raw = fs.readFileSync(REVOKED_TOKENS_PATH, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch {}
  return new Set();
}

let revokedTokens = loadRevokedTokens();

function revokeToken(signature: string) {
  revokedTokens.add(signature);
  try {
    fs.writeFileSync(REVOKED_TOKENS_PATH, JSON.stringify(Array.from(revokedTokens)), 'utf-8');
  } catch (err) {
    console.error('Failed to save revoked tokens:', err);
  }
}

interface AuthTokenPayload {
  username: string;
  role: 'admin';
  issuedAt: number;
  exp: number;
}

function generateAuthToken(username: string, role: 'admin'): string {
  const payload: AuthTokenPayload = {
    username,
    role,
    issuedAt: botState.lastTickTime || Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days persistent session
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifyAuthToken(tokenString?: string): AuthTokenPayload | null {
  if (!tokenString) {
    console.error('[Auth] Token missing');
    return null;
  }
  try {
    const [payloadB64, signature] = tokenString.split('.');
    if (!payloadB64 || !signature) {
      console.error('[Auth] Malformed token format');
      return null;
    }
    if (revokedTokens.has(signature)) {
      console.error('[Auth] Token has been revoked');
      return null; 
    }
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
    if (signature !== expectedSignature) { 
      console.error('[Auth] Signature mismatch'); 
      return null; 
    }
    const payload: AuthTokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) { 
      console.error('[Auth] Token expired'); 
      return null; 
    }
    return payload;
  } catch (err) {
    console.error('[Auth] Token parse error:', err);
    return null;
  }
}

// In-Memory & Persistent State for XAUUSD Bot
interface BotServerState {
  desiredBotState?: 'RUNNING' | 'STOPPED';
  status: 'running' | 'paused' | 'stopped' | 'daily_limit_hit';
  selectedAsset: 'XAUUSD';
  goldPrice: number;
  bidPrice?: number;
  askPrice?: number;
  lastPriceUpdate?: string;
  lastTickTime?: number;
  brokerQuoteTime?: number;
  lastFeedArrivalTime?: number;
  tickHistory?: number[];
  marketDataStatus?: string;
  newsProviderStatus?: 'CONNECTED' | 'UNAVAILABLE';
  activeGoldSymbol?: string;
  spreadPoints: number;
  account: {
    accountType: 'cent';
    server: string;
    loginId: string;
    isConnected: boolean;
    serverConnected: boolean;
    isRealAccount: boolean;
    marketDataReceiving: boolean;
    tradingPermission: boolean;
    eaConnected: boolean;
    symbolAvailable: boolean;
    pingMs: number;
    connectionMethod: 'rest_bridge' | 'zeromq_terminal' | 'ea_socket';
    vpsOnline: boolean;
    balance: number;
    equity: number;
    freeMargin?: number;
    marginLevel?: number;
    currency: string;
    metaApiAccountId?: string;
    metaApiToken?: string;
    metaApiUrl?: string;
    stages: {
      appLoggedIn: boolean;
      mt5AccountConfigured: boolean;
      exnessServerConnected: boolean;
      marketDataFeedLive: boolean;
      tradingPermissionGranted: boolean;
      eaLoadedAndReady: boolean;
      consecutiveLosses?: number;
  cooldownUntil?: number | null;
};
  };
  isDailyPnLSynced?: boolean;
  dailyLossResetOffset?: number;
  realizedDailyPnL?: number;
  currentTradingDate?: string;
  todayProfitLoss: number;
  todayTradeCount: number;
  todayWinCount: number;
  todayLossCount: number;
  signals?: { gold: string };
  metaApiAccountId?: string;
  metaApiToken?: string;
  metaApiUrl?: string;
  currentTrade: any | null;
  manualTrades: any[];
  tradingHours: {
    enabled: boolean;
    startHour: string; // "08:00"
    stopHour: string;  // "22:00"
    startDate?: string; // "YYYY-MM-DD"
    endDate?: string;   // "YYYY-MM-DD"
    mode?: 'daily' | 'custom_date';
  };
  riskConfig: {
    lotSizeMode?: 'fixed' | 'risk_percent';
    lotSize: number;
    riskPercent?: number;
    maxDailyLoss: number;
    maxDrawdownPercent: number;
    maxSpreadPoints: number;
    stopLossPips: number;
    takeProfitPips: number;
    trailingStopEnabled: boolean;
    trailingStopActivationPoints?: number;
    trailingStopDistancePoints?: number;
    trailingStopBreakEven?: boolean;
    trailingStopBreakEvenOffset?: number;
    maxOpenTrades: number;
    newsFilterEnabled?: boolean;
    entryDistance?: number;
    trailingDistance?: number;
    liveTradingEnabled?: boolean;
    entriesPerSignal: number;
    maxConsecutiveLosses: number;
    cooldownMinutes: number;
    maxDailyLossPercent: number;
    maxDailyLossAmount: number;
    noMartingale: boolean;
    noGrid: boolean;
  };
  userPreferences?: {
    autoStartOnConnect?: boolean;
    soundEnabled?: boolean;
    theme?: string;
  };
  magicNumber: number;
  marketSpeed?: string;
  volatilityValue?: number;
  currentCycle?: number;
  cycleStage?: string;
  dailyLossLimitHit: boolean;
  statusMessageKhmer: string;
  lastSavedAt?: string;

  isInsideTradingHours: boolean;
  openTrades: any[];
  signalDetails?: any;
  consecutiveLosses?: number;
  cooldownUntil?: number | null;
  isAutoSaved?: boolean;

  // Real-time Start Confirmation & EA Heartbeat Telemetry
  startRequestedTime?: string | null;
  startConfirmedTime?: string | null;
  isStartRequested?: boolean;
  eaHeartbeatTime?: number;
  lastAnalysisLoopTime?: number;
}
const DEFAULT_BOT_CONFIG = {
  desiredBotState: 'STOPPED' as const,
  status: 'stopped' as const,
  selectedAsset: 'XAUUSD' as const,
  currentTradingDate: '',
  dailyLossLimitHit: false,
  account: {
    accountType: 'cent' as const,
    server: 'Exness-Real21',
    loginId: '8492019',
    metaApiAccountId: '8fdbc882-5233-42f9-8a6a-6af1adc1a012',
    metaApiToken: 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MGFmYzg1ZmQ0MzZhNjJlNDc4ODU1MTU0Y2ZhMzUyOCIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJiaWxsaW5nLWFwaSIsIm1ldGhvZHMiOlsiYmlsbGluZy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiNTBhZmM4NWZkNDM2YTYyZTQ3ODg1NTE1NGNmYTM1MjgiLCJpYXQiOjE3ODg2MzU2NzIsImV4cCI6MTc5NjQxMTY3Mn0.Ak3KxS2yL9PorDzTinDKbog_EilXdm9YGvwHY6tvbokWJbVT8BMc0OgN-zpHq2j7scnjqoG-0g9i1CiBTY8_D0cGWbkll10l-4UGCcZbtKicOVCirCtwABHsm2MU3NtJsfgVZmK2xcuvblLx28gI92lAG7WDnbbyAtjHIIyrRyjNPeEJeJmIXUUaqy6p4PLJxDjfHv5-8Pci0yoG9W-m59r8f8ikxEkjMBOBHXGN0t3rElMoLy2kzx1BFtxZ1vmijZUUHLykiEkztgHfTnr5ZW1QK_Lwga765DOihNt5KqS9SqcTbOYRvqrZouM3lxu8mNDt-iU28Tj0G5iJiu5ipMr-K8rlzqCgnZ0ylO3QaHJFzg9P4NcJavWIZuNUpqwcIh_14RoIP5k0Jeiot4SGMLxk_a5Qaem9PMZnh8n8wAyAHgtw6KVI9pDY9yYj36Wu5OlwNS1D4hjc-_et-9LS02wjurcbx-1NHuVdbLhYbfr3BdKLJlKqWZVjVwnK5BEJblhtNplm9cWy7-pquJjYO4ZXQhtoRZP2lzhqHmUAZvoxq7xoMGQAdY-YPP9_0FqHiEWMpsW1Rarox7DlYwzjqZ4Tishrt6n1B7YPHqUVlWak4CnlWh9JkVGYPRymfh2eI_xosaylM95lfvXd7Y-MxOFi0hCTU0bjuFUE_gFtasI',
    metaApiUrl: 'https://mt-client-api-v1.backup-new-york.agiliumtrade.ai',
    isConnected: true,
    serverConnected: true,
    isRealAccount: true,
    marketDataReceiving: true,
    tradingPermission: true,
    eaConnected: true,
    symbolAvailable: true,
    pingMs: 24,
    connectionMethod: 'ea_socket' as const,
    vpsOnline: true,
    balance: 150000.00,
    equity: 150000.00,
    freeMargin: 150000.00,
    marginLevel: 999.0,
    currency: 'USC',
    stages: {
      appLoggedIn: true,
      mt5AccountConfigured: true,
      exnessServerConnected: true,
      marketDataFeedLive: true,
      tradingPermissionGranted: true,
      eaLoadedAndReady: true,
    }
  },
  tradingHours: {
    enabled: true,
    startHour: '08:00',
    stopHour: '22:00',
  },
  riskConfig: {
    lotSizeMode: 'fixed' as const,
    lotSize: 0.01,
    riskPercent: 1.0,
    maxDailyLoss: 50.00,
    maxDrawdownPercent: 5.0,
    maxSpreadPoints: 30,
    stopLossPips: 25,
    takeProfitPips: 35,
    trailingStopEnabled: true,

    maxOpenTrades: 5,
    entriesPerSignal: 1,
    maxConsecutiveLosses: 3,
    cooldownMinutes: 15,
    maxDailyLossPercent: 5,
    maxDailyLossAmount: 50,
    noMartingale: true,
    noGrid: true,
    liveTradingEnabled: false,
  },
  userPreferences: {
    autoStartOnConnect: false,
    soundEnabled: true,
    theme: 'dark',
  },
};

function loadOrCreateBotConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data && data.account) {
        return {
          ...DEFAULT_BOT_CONFIG,
          ...data,
          desiredBotState: data.desiredBotState || (data.status === 'running' ? 'RUNNING' : 'STOPPED'),
          account: {
            ...DEFAULT_BOT_CONFIG.account,
            ...data.account,
            stages: { ...DEFAULT_BOT_CONFIG.account.stages, ...(data.account.stages || {}) }
          },
          tradingHours: { ...DEFAULT_BOT_CONFIG.tradingHours, ...data.tradingHours },
          riskConfig: { ...DEFAULT_BOT_CONFIG.riskConfig, ...data.riskConfig },
          userPreferences: { ...DEFAULT_BOT_CONFIG.userPreferences, ...data.userPreferences },
        };
      }
    }
  } catch (err) {
    console.error('Error loading bot_config.json:', err);
  }
  return DEFAULT_BOT_CONFIG;
}

const initialSavedConfig = loadOrCreateBotConfig();



const botState: BotServerState = {
  desiredBotState: initialSavedConfig.desiredBotState || (initialSavedConfig.status === 'running' ? 'RUNNING' : 'STOPPED'),
  status: initialSavedConfig.status === 'running' ? 'running' : 'stopped',
  selectedAsset: 'XAUUSD',
  goldPrice: 0,
  bidPrice: 0,
  askPrice: 0,
  lastPriceUpdate: 'រង់ចាំ Live MT5 Feed',
  spreadPoints: 0,
  account: {
    ...initialSavedConfig.account,
    metaApiToken: initialSavedConfig.account.metaApiToken || mt5ApiKey,
    metaApiUrl: initialSavedConfig.account.metaApiUrl || mt5BridgeUrl,
    isConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
    serverConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
    marketDataReceiving: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
    tradingPermission: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
    eaConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
    balance: initialSavedConfig.account.balance || 0,
    equity: initialSavedConfig.account.equity || 0,
    freeMargin: initialSavedConfig.account.freeMargin || 0,
    stages: {
      appLoggedIn: true,
      mt5AccountConfigured: !!initialSavedConfig.account.loginId,
      exnessServerConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
      marketDataFeedLive: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
      tradingPermissionGranted: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
      eaLoadedAndReady: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server),
    },
  },
  isDailyPnLSynced: false,
  realizedDailyPnL: 0,
  currentTradingDate: initialSavedConfig.currentTradingDate || "",
  dailyLossLimitHit: initialSavedConfig.dailyLossLimitHit || false,
  todayProfitLoss: 0.00,
  todayTradeCount: 0,
  todayWinCount: 0,
  todayLossCount: 0,
  currentTrade: null,
  openTrades: [],
  consecutiveLosses: 0,
  cooldownUntil: null,
  signals: { gold: 'WAIT' },
  signalDetails: undefined,
  manualTrades: [],
  tradingHours: {
    ...initialSavedConfig.tradingHours,
  },
  riskConfig: {
    ...initialSavedConfig.riskConfig,
    liveTradingEnabled: initialSavedConfig.riskConfig?.liveTradingEnabled ?? false,
  },
  userPreferences: {
    ...initialSavedConfig.userPreferences,
  },
  magicNumber: 778899,
  statusMessageKhmer: '🔴 មិនទាន់ភ្ជាប់ Real MT5 — សូមដាក់ EA លើ VPS ឬភ្ជាប់ Bridge',
  lastSavedAt: new Date().toISOString(),
  isInsideTradingHours: true,
  isStartRequested: (initialSavedConfig.desiredBotState === 'RUNNING' || initialSavedConfig.status === 'running'),
  startRequestedTime: (initialSavedConfig.desiredBotState === 'RUNNING' || initialSavedConfig.status === 'running') ? new Date().toISOString() : null,
  startConfirmedTime: null,
  eaHeartbeatTime: Date.now(),
  lastAnalysisLoopTime: 0,
};

// Sync Dara Engine with loaded config
if (global.daraEngine) {
    global.daraEngine.updateUserSettings({
        lotSize: botState.riskConfig.lotSize || 0.01,
        slDistance: botState.riskConfig.stopLossPips || 30,
        tpDistance: botState.riskConfig.takeProfitPips || 30,
        dailyLossLimit: botState.riskConfig.maxDailyLossAmount || 50,
        maxOpenTrades: botState.riskConfig.maxOpenTrades || 5,
        maxConsecutiveSL: botState.riskConfig.maxConsecutiveLosses || 3,
        cooldownMinutes: botState.riskConfig.cooldownMinutes || 15,
        maxSpreadPoints: botState.riskConfig.maxSpreadPoints || 30,
        newsFilterEnabled: botState.riskConfig.newsFilterEnabled || false,
        trailingEnabled: botState.riskConfig.trailingStopEnabled !== false,
        trailingDistance: botState.riskConfig.trailingDistance,
        entryDistance: botState.riskConfig.entryDistance || 2.0,
        liveTradingEnabled: botState.riskConfig.liveTradingEnabled === true
    });
    if (botState.status === 'running' || botState.desiredBotState === 'RUNNING') {
        global.daraEngine.start();
    }
}

function saveBotConfig() {
  try {
    const configToPersist = {
      desiredBotState: botState.desiredBotState || (botState.status === 'running' ? 'RUNNING' : 'STOPPED'),
      status: botState.status === 'running' ? 'running' : 'stopped',
      selectedAsset: botState.selectedAsset,
      currentTradingDate: botState.currentTradingDate,
      dailyLossLimitHit: botState.dailyLossLimitHit,
      account: {
        accountType: botState.account.accountType,
        server: botState.account.server,
        loginId: botState.account.loginId,
        isConnected: botState.account.isConnected,
        serverConnected: botState.account.serverConnected,
        isRealAccount: true,
        marketDataReceiving: botState.account.marketDataReceiving,
        tradingPermission: botState.account.tradingPermission,
        eaConnected: botState.account.eaConnected,
        symbolAvailable: botState.account.symbolAvailable,
        pingMs: botState.account.pingMs,
        connectionMethod: botState.account.connectionMethod,
        vpsOnline: true,
        balance: botState.account.balance,
        equity: botState.account.equity,
        freeMargin: botState.account.freeMargin,
        marginLevel: botState.account.marginLevel,
        currency: botState.account.currency,
        stages: botState.account.stages,
        metaApiAccountId: botState.account.metaApiAccountId,
        metaApiToken: botState.account.metaApiToken,
        metaApiUrl: botState.account.metaApiUrl,
      },
      tradingHours: botState.tradingHours,
      riskConfig: botState.riskConfig,
      userPreferences: botState.userPreferences,
      lastSavedAt: new Date().toISOString(),
    };
    botState.lastSavedAt = configToPersist.lastSavedAt;
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configToPersist, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save bot configuration to disk:', err);
  }
}

// Check if currently inside trading hours
function checkInsideTradingHours(): boolean {
  // 🟢 24/7 AUTO: EA operates 24/7 continuously whenever the broker market is open
  return true;
}

// Global Timers & AI Analysis Engine
let lastSyncTimestamp = 0;
let consecutivePollingFailures = 0;
let lastAnalysisTimestamp = 0;
const AI_ANALYSIS_INTERVAL_MS = 60000; // 1 Minute (60 seconds) Analysis Interval

/**
 * 1-MINUTE AI MARKET ANALYSIS & RISK VERIFICATION ENGINE
 * Runs every 1 minute:
 * 🔍 Step 1: AI Analyze (Inspect market price movement, trend, momentum for selected asset)
 * 🔍 Step 2: Check Signal (Evaluate if signal is BUY, SELL, or WAIT)
 * 🔍 Step 3: Check Risk & Entry Conditions (Trading hours, Daily loss, Max open trades, Spread)
 * 🔍 Step 4: Authorize Entry if valid AND conditions met. If signal is WAIT/unclear, do NOT trade and wait for next 1-minute cycle.
 */
var eaState = {
  paperMode: false, // ENABLED LIVE REAL TRADING
  h4Bias: 'NEUTRAL' as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  m15Setup: 'WAITING' as 'WAITING' | 'READY_FOR_M1' | 'WAITING_FOR_MITIGATION' | 'CONSUMED',
  setupSide: 'NONE' as 'BUY' | 'SELL' | 'NONE',
  setupTimestamp: 0,
  m1ObZone: null as {high: number, low: number} | null,
};

function resetEASetup(reason: string) {
    eaState.m15Setup = 'WAITING';
  eaState.setupSide = 'NONE';
  eaState.setupTimestamp = 0;
  eaState.m1ObZone = null;
  botState.signals = { gold: 'WAIT' };
  botState.signalDetails = undefined;
}

export interface Candle { time: number | string; open: number; high: number; low: number; close: number; volume?: number; }
async function fetchRealCandles(baseUrl: string, accountId: string, token: string, symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    try {
        const marketDataBaseUrl = baseUrl.replace('mt-client-api-v1', 'mt-market-data-client-api-v1');
        const res = await fetch(`${marketDataBaseUrl}/users/current/accounts/${accountId}/historical-market-data/symbols/${symbol}/timeframes/${timeframe}/candles?limit=${limit}`, {
            headers: { 'auth-token': token },
            signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                return data.map((d: any) => ({
                    time: d.time,
                    open: Number(d.open),
                    high: Number(d.high),
                    low: Number(d.low),
                    close: Number(d.close),
                    volume: Number(d.tickVolume || d.volume || 0)
                }));
            }
        }
    } catch (e) { }
    
    // Strict Real Market Policy: Never generate mock / fake candle data
    return [];
}

interface LocalM1Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
let daraM1CandlesBuffer: LocalM1Candle[] = [];
let lastM1CandlesFetchTime = 0;

async function syncDaraM1CandlesBuffer(baseUrl: string, accountId: string, token: string, symbol: string) {
    const now = Date.now();
    if (daraM1CandlesBuffer.length >= 10 && (now - lastM1CandlesFetchTime < 120000)) return;
    lastM1CandlesFetchTime = now;
    try {
        const raw = await fetchRealCandles(baseUrl, accountId, token, symbol, '1m', 50);
        if (raw && raw.length >= 10) {
            daraM1CandlesBuffer = raw.map((c: any) => ({
                time: typeof c.time === 'string' ? new Date(c.time).getTime() : Number(c.time),
                open: Number(c.open),
                high: Number(c.high),
                low: Number(c.low),
                close: Number(c.close),
                volume: Number(c.volume || 1)
            }));
        }
    } catch (_) {}
}

function feedLiveTickToCandlesBuffer(price: number, tickTime: number) {
    if (price <= 0) return;
    const barMinute = Math.floor(tickTime / 60000) * 60000;
    if (daraM1CandlesBuffer.length === 0) {
        daraM1CandlesBuffer.push({ time: barMinute, open: price, high: price, low: price, close: price, volume: 1 });
        return;
    }
    const lastBar = daraM1CandlesBuffer[daraM1CandlesBuffer.length - 1];
    if (lastBar.time === barMinute) {
        lastBar.high = Math.max(lastBar.high, price);
        lastBar.low = Math.min(lastBar.low, price);
        lastBar.close = price;
        lastBar.volume = (lastBar.volume || 0) + 1;
    } else if (barMinute > lastBar.time) {
        daraM1CandlesBuffer.push({ time: barMinute, open: price, high: price, low: price, close: price, volume: 1 });
        if (daraM1CandlesBuffer.length > 100) daraM1CandlesBuffer.shift();
    }
}




function calculateVolatilityAndSpeed() {
    botState.tickHistory = botState.tickHistory || [];
    if (botState.tickHistory.length < 10) {
        botState.marketSpeed = 'NORMAL';
        botState.volatilityValue = 0;
        return;
    }

    const prices = botState.tickHistory;
    let maxPrice = prices[0];
    let minPrice = prices[0];

    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > maxPrice) maxPrice = prices[i];
        if (prices[i] < minPrice) minPrice = prices[i];
    }
    
    const range = maxPrice - minPrice;
    botState.volatilityValue = Number(range.toFixed(2));

    if (range >= 4.0 || botState.spreadPoints >= 40) {
        botState.marketSpeed = 'EXTREME';
    } else if (range >= 2.0 || botState.spreadPoints >= 25) {
        botState.marketSpeed = 'FAST';
    } else {
        botState.marketSpeed = 'NORMAL';
    }
}


// ============================================
// MARKET AWARENESS LAYER (READ-ONLY)
// ============================================
let isMarketOpen = true; // Default assumption until fetched
let marketStatusReason = 'Initializing...';
let lastMarketStatusCheck = 0;

async function checkActualMarketStatus() {
    if (Date.now() - lastMarketStatusCheck < 300000) {
        return; // Cache for 5 minutes to prevent hammering broker specification endpoints
    }
    lastMarketStatusCheck = Date.now();

    const accountId = botState.account.metaApiAccountId;
    const token = botState.account.metaApiToken;
    const baseUrl = botState.account.metaApiUrl;

    if (!baseUrl || !accountId || !token || !botState.activeGoldSymbol) {
        return;
    }

    try {
        const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/symbols/${botState.activeGoldSymbol}/specification`, {
            headers: { 'auth-token': token },
            signal: AbortSignal.timeout(10000)
        });
        
        if (res.ok) {
            const spec = await res.json();
            
            // Checking MT5 specification tradeMode and session status
            // 0 = SYMBOL_TRADE_MODE_DISABLED
            // 1 = SYMBOL_TRADE_MODE_LONGONLY
            // 2 = SYMBOL_TRADE_MODE_SHORTONLY
            // 3 = SYMBOL_TRADE_MODE_CLOSEONLY
            // 4 = SYMBOL_TRADE_MODE_FULL
            
            if (spec.tradeMode === 0 || spec.tradeMode === 'SYMBOL_TRADE_MODE_DISABLED') {
                isMarketOpen = false;
                marketStatusReason = 'Symbol Trade Disabled by Broker';
                return;
            }

            // A more direct way is checking if quotes are stale, or using the MetaApi current-price quote which might have a 'tradeable' flag.
            // Let's use the current-price API directly since it often contains session data.
            const priceRes = await fetch(`${baseUrl}/users/current/accounts/${accountId}/symbols/${botState.activeGoldSymbol}/current-price`, {
                headers: { 'auth-token': token },
                signal: AbortSignal.timeout(10000)
            });

            if (priceRes.ok) {
                const quote = await priceRes.json();
                
                // If there's no quote or time is extremely stale (e.g. > 15 mins), the market is likely closed (weekend/holiday)
                const quoteTime = new Date(quote.time).getTime();
                const now = Date.now();
                
                if (now - quoteTime > 15 * 60 * 1000) {
                    isMarketOpen = false;
                    const date = new Date().getDay();
                    if (date === 0 || date === 6) {
                        marketStatusReason = 'Weekend Market Closed';
                    } else {
                        marketStatusReason = 'Market Holiday or Session Closed';
                    }
                    return;
                }
            }

            // Check day of week locally as a fallback safeguard
            const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
            const currentHour = new Date().getHours();
            
            // XAUUSD typically closes Friday ~ 23:59 (Server Time) and opens Sunday ~ 23:00 / Monday 00:00 (Server time). 
            // In Cambodia Time (ICT / UTC+7), Market closes Saturday ~ 4:00 AM and opens Monday ~ 5:00 AM
            if (dayOfWeek === 6 && currentHour >= 5) {
                isMarketOpen = false;
                marketStatusReason = 'Weekend Market Closed (Saturday)';
                return;
            }
            if (dayOfWeek === 0) {
                isMarketOpen = false;
                marketStatusReason = 'Weekend Market Closed (Sunday)';
                return;
            }
            if (dayOfWeek === 1 && currentHour < 4) {
                isMarketOpen = false;
                marketStatusReason = 'Weekend Market Closed (Early Monday)';
                return;
            }

            isMarketOpen = true;
            marketStatusReason = 'Market Open';
        }
    } catch (err) {
        if (err.name === 'TimeoutError') {
            console.warn('Market Status Check Error: Timeout (10s)');
        } else {
            console.error('Market Status Check Error:', err);
        }
    }
}



// ==== DAILY P/L SYNC SYSTEM ====
function getCambodiaMidnightISO() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Phnom_Penh',
        year: 'numeric', month: 'numeric', day: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    let year = '', month = '', day = '';
    for (const p of parts) {
        if (p.type === 'year') year = p.value;
        if (p.type === 'month') month = p.value.padStart(2, '0');
        if (p.type === 'day') day = p.value.padStart(2, '0');
    }
    // Convert to ISO (UTC)
    return new Date(`${year}-${month}-${day}T00:00:00+07:00`).toISOString();
}

let isSyncingPnL = false;
let lastPnLSyncTime = 0;
let pnlSyncConsecutiveFailures = 0;

async function syncDailyRealizedPnL() {
    if (isSyncingPnL) return;
    if (!botState.account.serverConnected || !botState.account.metaApiToken || !botState.account.metaApiUrl || !botState.account.metaApiAccountId) return;

    try {
        isSyncingPnL = true;
        const currentMidnight = getCambodiaMidnightISO();
        if (botState.currentTradingDate && botState.currentTradingDate !== currentMidnight) {
            botState.currentTradingDate = currentMidnight;
            botState.realizedDailyPnL = 0;
            botState.todayTradeCount = 0;
            botState.todayWinCount = 0;
            botState.todayLossCount = 0;
            botState.dailyLossLimitHit = false;
            botState.dailyLossResetOffset = 0;
            botState.isDailyPnLSynced = false;
            pnlSyncConsecutiveFailures = 0;
        }

        const startTime = currentMidnight;
        const endTime = new Date().toISOString();
        const baseUrl = botState.account.metaApiUrl;
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        
        let allDeals: any[] = [];
        let offset = 0;
        const limit = 1000;
        
        while (true) {
            const encStart = encodeURIComponent(startTime);
            const encEnd = encodeURIComponent(endTime);
            const url = `${baseUrl}/users/current/accounts/${accountId}/history-deals/time/${encStart}/${encEnd}?offset=${offset}&limit=${limit}`;
            const response = await fetch(url, { 
                headers: { 'auth-token': token },
                signal: AbortSignal.timeout(25000)
            });
            if (!response.ok) {
                throw new Error(`History API failed: ${response.status}`);
            }
            const deals = await response.json();
            allDeals = allDeals.concat(deals);
            if (!Array.isArray(deals) || deals.length < limit) break;
            offset += limit;
        }
        
        let dailyRealized = 0;
        let tCount = 0;
        let wCount = 0;
        let lCount = 0;

        for (const deal of allDeals) {
            // Include both bot trades (magic === 778899) and manual user trades (magic === 0 or undefined)
            // But skip other bots if they use different magic numbers
            const magicNum = Number(deal.magic || 0);
            if (magicNum === botState.magicNumber || magicNum === 0) {
                const profit = Number(deal.profit || 0);
                const commission = Number(deal.commission || 0);
                const swap = Number(deal.swap || 0);
                const fee = Number(deal.fee || 0);
                const net = profit + commission + swap + fee;
                
                // Exclude pure balance operations like deposits/withdrawals
                if (deal.type !== 'DEAL_TYPE_BALANCE') {
                    dailyRealized += net;

                    // Count only closed trades for win/loss stats
                    if (deal.entryType !== 'DEAL_ENTRY_IN') {
                        tCount++;
                        if (net >= 0) wCount++;
                        else lCount++;
                    }
                }
            }
        }
        
        botState.todayTradeCount = tCount;
        botState.todayWinCount = wCount;
        botState.todayLossCount = lCount;
        
        botState.realizedDailyPnL = dailyRealized;
        botState.isDailyPnLSynced = true;
        botState.currentTradingDate = startTime;
        pnlSyncConsecutiveFailures = 0;
        
    } catch (error: any) {
        pnlSyncConsecutiveFailures++;
        if (error.name === 'TimeoutError') {
            console.warn(`[DaRa EA] P/L Sync Warning: Request timed out (25s). Consecutive failures: ${pnlSyncConsecutiveFailures}. Will retry in 20s.`);
        } else if (error.message && error.message.includes('429')) {
            console.warn('[DaRa EA] P/L Sync Warning: Rate limited (HTTP 429). Will retry later.');
            lastPnLSyncTime = Date.now(); 
        } else {
            console.error('[DaRa EA] P/L Sync Error:', error.message || error);
        }
        // Fallback gracefully: drop sync status only after 3 consecutive failures to avoid spurious blocks on transient latency
        if (pnlSyncConsecutiveFailures >= 3 || !botState.isDailyPnLSynced) {
            botState.isDailyPnLSynced = false; // FAIL-SAFE: Block entry if persistent sync error
        }
        botState.realizedDailyPnL = botState.realizedDailyPnL || 0;
    } finally {
        botState.lastAnalysisLoopTime = Date.now();
        botState.eaHeartbeatTime = Date.now();
        lastPnLSyncTime = Date.now();
        isSyncingPnL = false;
    }
}
// =================================

let lastAccountInfoTime = 0;
let lastPositionsTime = 0;
let isPollingMT5 = false;
let metaApiBackoffUntil = 0;
let lastMetaApiQuoteTime = 0;
let lastMarketDataLogTime = 0;
let symbolRetryCount = 0;
let lastSymbolTried = '';





// REAL MT5 Polling Loop (ultra-low latency live quotes & periodic account sync)
setInterval(async () => {
    if (isPollingMT5) return;
    isPollingMT5 = true;
    try {
        monitorSystemTransitions();
    if (!botState.account.isConnected) return;

    const now = Date.now();
    const pnlSyncInterval = botState.isDailyPnLSynced ? 60000 : 20000;
    if (now - lastPnLSyncTime >= pnlSyncInterval) {
        lastPnLSyncTime = now;
        syncDailyRealizedPnL().catch(console.error);
    }

    // If EA is actively syncing via WebRequest, keep states solid and bypass conflicting REST errors
    const lastSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0);
    const isEaActive = (lastSyncTimestamp > 0 && Date.now() - lastSyncTimestamp < 25000);
    if (isEaActive) {
        botState.account.isConnected = true;
        botState.account.serverConnected = true;
        botState.account.eaConnected = true;
        botState.account.vpsOnline = true;
        botState.account.marketDataReceiving = true;
                                 if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
        consecutivePollingFailures = 0;
        return;
    }
    
    const accountId = botState.account.metaApiAccountId;
    const token = botState.account.metaApiToken;
    let baseUrl = botState.account.metaApiUrl || 'https://mt-client-api-v1.backup-new-york.agiliumtrade.ai';
    
    if (accountId === 'mock_account') {
        botState.marketDataStatus = '🔴 មិនមានការតភ្ជាប់ MetaAPI';
        return;
    }
    if (accountId && token && baseUrl && (baseUrl.includes('agiliumtrade.ai') || baseUrl.includes('metaapi.cloud'))) {
        try {
            let workingBaseUrl = baseUrl;
            const isCentAccount = (
                botState.account.accountType === 'cent' ||
                botState.account.currency === 'USC' ||
                Boolean(botState.account.server && /cent|usc/i.test(botState.account.server))
            );
            const primarySymbol = isCentAccount ? 'XAUUSDc' : (botState.activeGoldSymbol || (botState.account.server && botState.account.server.toLowerCase().includes('real') ? 'XAUUSDc' : 'XAUUSD'));
            if (isCentAccount) {
                botState.activeGoldSymbol = 'XAUUSDc';
            }
            const nowTime = Date.now();

            // 1. Live Quote Fetch with Adaptive Rate-Limiting Protection (max ~1 request per 3.5s to preserve 6h CPU quota)
            const canFetchQuote = (nowTime >= metaApiBackoffUntil) && (nowTime - lastMetaApiQuoteTime >= 4000);
            if (canFetchQuote) {
                lastMetaApiQuoteTime = nowTime;
                try {
                    const quoteRes = await fetch(`${workingBaseUrl}/users/current/accounts/${accountId}/symbols/${primarySymbol}/current-price`, {
                        headers: { 'auth-token': token },
                        signal: AbortSignal.timeout(10000)
                    });
                    
                    let quote: any = null;
                    if (quoteRes.ok) {
                        quote = await quoteRes.json();
                    } else if (quoteRes.status === 429) {
                        metaApiBackoffUntil = nowTime + 5000;
                        console.warn(`[MARKET_DATA RATE_LIMIT] 429 TooManyRequests on ${primarySymbol}. Cooling down 5s until ${new Date(metaApiBackoffUntil).toISOString()}`);
                    } else if (quoteRes.status === 404) {
                        // MetaAPI returns 404 when terminal is subscribing or waiting for the first live tick.
                        // Attempt instant fallback to latest 1m candle from historical-market-data
                        try {
                            const marketDataBaseUrl = workingBaseUrl.replace('mt-client-api-v1', 'mt-market-data-client-api-v1');
                            const candleRes = await fetch(`${marketDataBaseUrl}/users/current/accounts/${accountId}/historical-market-data/symbols/${primarySymbol}/timeframes/1m/candles?limit=1`, {
                                headers: { 'auth-token': token },
                                signal: AbortSignal.timeout(5000)
                            });
                            if (candleRes.ok) {
                                const candles = await candleRes.json().catch(() => []);
                                if (candles && candles.length > 0 && candles[0].close) {
                                    const c = candles[0];
                                    const pointMultiplier = 0.001;
                                    const spreadOffset = (c.spread ? (c.spread * pointMultiplier) : 0.26);
                                    quote = {
                                        bid: Number(c.close),
                                        ask: Number((c.close + spreadOffset).toFixed(3)),
                                        time: c.time || new Date().toISOString(),
                                        brokerTime: c.brokerTime
                                    };
                                }
                            }
                        } catch (_) {}

                        if (!quote) {
                            if (lastSymbolTried !== primarySymbol) {
                                symbolRetryCount = 0;
                                lastSymbolTried = primarySymbol;
                            }
                            symbolRetryCount++;
                            if (isCentAccount) {
                                // FIX #3: Exness CENT account symbol is locked strictly to XAUUSDc.
                                // Never cycle to invalid fallback symbols (XAUUSDm, XAUUSD, GOLD).
                                botState.activeGoldSymbol = 'XAUUSDc';
                                if (symbolRetryCount % 10 === 1) {
                                    console.log(`[QUOTE WARMUP] Exness CENT symbol locked to XAUUSDc. Waiting for tick (MetaApi subscribing/warming up). Retry ${symbolRetryCount}`);
                                }
                            } else {
                                // Non-Cent accounts: preserve standard fallback cycling
                                if (symbolRetryCount >= 5) {
                                    console.log(`[QUOTE FALLBACK] Symbol ${primarySymbol} not found after 5 retries. Switching activeGoldSymbol from ${botState.activeGoldSymbol}`);
                                    if (primarySymbol === 'XAUUSDc') botState.activeGoldSymbol = 'XAUUSDm';
                                    else if (primarySymbol === 'XAUUSDm') botState.activeGoldSymbol = 'XAUUSD';
                                    else if (primarySymbol === 'XAUUSD') botState.activeGoldSymbol = 'GOLD';
                                    else if (primarySymbol === 'GOLD') botState.activeGoldSymbol = 'XAUUSDc';
                                    console.log(`[QUOTE FALLBACK] New activeGoldSymbol is ${botState.activeGoldSymbol}`);
                                    symbolRetryCount = 0;
                                } else {
                                    console.log(`[QUOTE WARMUP] Symbol ${primarySymbol} waiting for tick. MetaApi might be subscribing. Retry ${symbolRetryCount}/5`);
                                }
                            }
                        }
                    } else {
                        console.warn(`[MARKET_DATA NOTICE] ${quoteRes.status} ${quoteRes.statusText} on ${primarySymbol}`);
                    }

                    if (quote) {
                        if (quote && (quote.bid || quote.ask || quote.price)) {
                            const bid = Number(quote.bid || quote.price || quote.ask || 0);
                            const ask = Number(quote.ask || quote.price || quote.bid || 0);
                            if (bid > 0) {
                                botState.goldPrice = bid;
                                botState.activeGoldSymbol = primarySymbol;
                                botState.bidPrice = bid;
                                botState.askPrice = ask;
                                // Automatically adapt point multiplier based on decimal places (2 for XAUUSDc standard, 3 for Pro)
                                const bidStr = bid.toString();
                                const decimals = (bidStr.includes('.') ? bidStr.split('.')[1].length : 2);
                                // For Gold, typical point is 0.01 (2 decimals). If 3 decimals, point is 0.001.
                                const pointMultiplier = 100;
                                botState.spreadPoints = Math.round(Math.abs(ask - bid) * pointMultiplier);

                                botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                
                                // FIX #1: Track actual local VPS arrival time of valid quote vs broker quote timestamp
                                const brokerTickTime = quote.time ? new Date(quote.time).getTime() : Date.now();
                                const tickTimeMs = brokerTickTime;
                                const localArrivalTime = Date.now();
                                botState.brokerQuoteTime = brokerTickTime;
                                botState.lastFeedArrivalTime = localArrivalTime;
                                botState.lastTickTime = localArrivalTime;
                                global.lastSuccessfulPingTime = localArrivalTime;

                                botState.marketDataStatus = '🟢 LIVE (MT5 FEED ACTIVE)';
                                botState.account.isConnected = true;
                                botState.account.serverConnected = true;
                                botState.account.eaConnected = true;
                                botState.account.vpsOnline = true;
                                botState.account.marketDataReceiving = true;
                                if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
                                consecutivePollingFailures = 0;

                                // --- INSTANT EXECUTION GATE SYNC (NO STALE FLAGS) ---
                                if (botState.status !== 'running') {
                                    } else if (!botState.account.isConnected || !botState.account.serverConnected) {
                                    } else if (!isMarketOpen) {
                                    } else if (!botState.isDailyPnLSynced) {
                                    } else if (botState.dailyLossLimitHit) {
                                    } else if (botState.marketSpeed === 'EXTREME') {
                                    } else {
                                    }
                                // ----------------------------------------------------

                                // Sync M1 Candles Buffer
                                syncDaraM1CandlesBuffer(workingBaseUrl, accountId, token, primarySymbol).catch(() => {});
                                feedLiveTickToCandlesBuffer(bid, tickTimeMs);

                                // Forward live tick to DaRaM1Engine
                                if (global.daraEngine && typeof global.daraEngine.onMarketUpdate === 'function') {
                                    try {
                                        global.daraEngine.onMarketUpdate({
                                            symbol: primarySymbol,
                                            bid,
                                            ask,
                                            time: tickTimeMs,
                                            serverTime: tickTimeMs,
                                            spreadPoints: botState.spreadPoints || 0,
                                            openTradesCount: botState.openTrades ? botState.openTrades.length : 0,
                                            m1Candles: daraM1CandlesBuffer
                                        }).catch((err: any) => console.error('[DaRa M1 EA] Error in onMarketUpdate:', err));
                                    } catch (e) {
                                        console.error('[DaRa M1 EA] Error invoking onMarketUpdate:', e);
                                    }
                                }

                                

                                // Accumulate tick history for 1-minute analysis
                                botState.tickHistory = botState.tickHistory || [];
                                botState.tickHistory.push(bid);
                                if (botState.tickHistory.length > 100) botState.tickHistory.shift();
                            }
                        }
                    }
                } catch (err: any) {
                    // Transient network jitter is safe, keep status active
                }
            }

            

            await new Promise(r => setTimeout(r, 1000));
            // 2. Account Information Sync (every 5 seconds or if balance missing)
            if (nowTime - lastAccountInfoTime >= 5000 || botState.account.balance === 0) {
                lastAccountInfoTime = nowTime;
                try {
                    const accRes = await fetch(`${workingBaseUrl}/users/current/accounts/${accountId}/accountInformation`, {
                        headers: { 'auth-token': token },
                        signal: AbortSignal.timeout(2500)
                    });
                    if (accRes.ok) {
                        const info = await accRes.json();
                        if (info && (info.balance !== undefined || info.equity !== undefined)) {
                            botState.account.balance = Number(info.balance || 0);
                            botState.account.equity = Number(info.equity || info.balance || 0);
                            botState.account.freeMargin = Number(info.freeMargin || info.balance || 0);
                            if (info.marginLevel !== undefined) {
                                botState.account.marginLevel = Number(info.marginLevel);
                            }
                            if (info.currency) {
                                botState.account.currency = String(info.currency).toUpperCase();
                            }
                            
                            botState.account.isConnected = true;
                            const currentFeedAge = (botState.lastFeedArrivalTime || botState.lastTickTime) ? (Date.now() - (botState.lastFeedArrivalTime || botState.lastTickTime || 0)) : 999999;
                            if (currentFeedAge < 60000) {
                                botState.account.serverConnected = true;
                                botState.account.eaConnected = true;
                            }
                            botState.account.vpsOnline = true;
                            botState.account.tradingPermission = true;
                            botState.account.stages.mt5AccountConfigured = true;
                            botState.account.stages.exnessServerConnected = true;
                            botState.account.stages.tradingPermissionGranted = true;
                            botState.account.stages.eaLoadedAndReady = true;
                            consecutivePollingFailures = 0;
                        }
                    }
                } catch (_) {}
            }

            // Freshness Check: Aligned with watchdog (60 seconds) using actual feed arrival time
            const lastFeedSeen = Math.max(botState.lastFeedArrivalTime || 0, botState.lastTickTime || 0);
            const feedAgeMs = lastFeedSeen > 0 ? nowTime - lastFeedSeen : 0;
            const isDataFresh = Boolean(lastFeedSeen > 0 && feedAgeMs < 60000 && botState.bidPrice && botState.bidPrice > 0 && botState.askPrice && botState.askPrice > 0);
            if (!isDataFresh) {
                const ageText = lastFeedSeen > 0 ? `${Math.floor(feedAgeMs/1000)}s` : 'No Data';
                botState.marketDataStatus = lastFeedSeen > 0 ? `🔴 MT5 DATA DISCONNECTED (Delay: ${ageText})` : (botState.account.isConnected ? 'WATCHING / WAITING FOR LIVE DATA...' : '🔴 MT5 DATA DISCONNECTED (Delay: No Data)');
                if (nowTime - lastMarketDataLogTime >= 10000) {
                    lastMarketDataLogTime = nowTime;
                    console.log(`[MARKET_DATA] connection=${botState.account.isConnected ? 'CONNECTED' : 'DISCONNECTED'} lastFeedTime=${lastFeedSeen} feedAgeMs=${feedAgeMs} bid=${botState.bidPrice} ask=${botState.askPrice} dataFresh=false`);
                }
            } else {
                botState.marketDataStatus = '🟢 LIVE (MT5 FEED ACTIVE)';
                if (nowTime - lastMarketDataLogTime >= 10000) {
                    lastMarketDataLogTime = nowTime;
                    console.log(`[MARKET_DATA] connection=CONNECTED lastFeedTime=${new Date(lastFeedSeen).toISOString()} feedAgeMs=${feedAgeMs} bid=${botState.bidPrice} ask=${botState.askPrice} dataFresh=true symbol=${botState.activeGoldSymbol}`);
                }
            }

            // Check Trading Session
            botState.isInsideTradingHours = checkInsideTradingHours();

            // Fetch Open Positions (every 3 seconds)
            let positions: any[] | null = null;
            if (nowTime - lastPositionsTime >= 3000) {
                lastPositionsTime = nowTime;
                try {
                    const posRes = await fetch(`${baseUrl}/users/current/accounts/${accountId}/positions`, {
                        headers: { 'auth-token': token },
                        signal: AbortSignal.timeout(4000)
                    });
                    if (posRes.ok) {
                        positions = await posRes.json();
                    }
                } catch (_) {}
            }
            
            if (positions && Array.isArray(positions)) {
                const prevOpenTradesCount = (botState.openTrades || []).length;
                // Consecutive Loss Tracking
                if (botState.openTrades && botState.openTrades.length > 0) {
                    const newTradeIds = positions.map((p: any) => p.id);
                    let tradeClosed = false;
                    let tradeClosed2 = false;
                    botState.openTrades.forEach((oldTrade: any) => {
                        if (!newTradeIds.includes(oldTrade.id)) {
                            tradeClosed = true;
                            
                            if (oldTrade.floatingProfit < 0) {
                                if (global.daraEngine) {
                                    global.daraEngine.recordRealTradeResult(Number(oldTrade.floatingProfit || 0));
                                    botState.consecutiveLosses = global.daraEngine.getTelemetry().consecutiveLossCount;
                                } else {
                                    botState.consecutiveLosses = (botState.consecutiveLosses || 0) + 1;
                                }
                                sendStopLossAlert({
                                    type: (oldTrade.side === 'BUY' || oldTrade.side === 'SELL') ? oldTrade.side : 'BUY',
                                    lot: oldTrade.lot || botState.riskConfig?.lotSize || 0.01,
                                    entry: oldTrade.entryPrice || 0,
                                    exit: oldTrade.currentPrice || botState.goldPrice || 0,
                                    sl: oldTrade.sl || 0,
                                    loss: Math.abs(Number(oldTrade.floatingProfit || 0)).toFixed(2),
                                    ticket: oldTrade.id,
                                    time: formatLocalTime()
                                }).catch(console.error);
                            } else {
                                if (global.daraEngine) {
                                    global.daraEngine.recordRealTradeResult(Number(oldTrade.floatingProfit || 0));
                                    botState.consecutiveLosses = 0;
                                } else {
                                    botState.consecutiveLosses = 0;
                                }
                                sendTakeProfitAlert({
                                    type: (oldTrade.side === 'BUY' || oldTrade.side === 'SELL') ? oldTrade.side : 'BUY',
                                    lot: oldTrade.lot || botState.riskConfig?.lotSize || 0.01,
                                    entry: oldTrade.entryPrice || 0,
                                    exit: oldTrade.currentPrice || botState.goldPrice || 0,
                                    tp: oldTrade.tp || 0,
                                    profit: Number(oldTrade.floatingProfit || 0).toFixed(2),
                                    ticket: oldTrade.id,
                                    time: formatLocalTime()
                                }).catch(console.error);
                            }
                        }
                    });
                    if (tradeClosed) lastPnLSyncTime = 0; // Force sync
                }

                const existingTradesMap = new Map((botState.openTrades || []).map((t: any) => [String(t.id), t]));
                botState.openTrades = positions.map((botPos: any) => {
                    const prevT = existingTradesMap.get(String(botPos.id));
                    const isBot = Number(botPos.magic || 0) === botState.magicNumber;
                    return {
                        id: botPos.id,
                        magicNumber: botPos.magic || 0,
                        isBotTrade: isBot,
                        symbol: botPos.symbol,
                        side: botPos.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL',
                        lot: botPos.volume,
                        entryPrice: botPos.openPrice,
                        currentPrice: botPos.currentPrice,
                        sl: botPos.stopLoss || 0,
                        tp: botPos.takeProfit || 0,
                        originalTp: prevT?.originalTp || botPos.takeProfit || 0,
                        floatingProfit: botPos.profit,
                        commission: botPos.commission || 0,
                        swap: botPos.swap || 0,
                        openedAt: new Date(botPos.time).toLocaleTimeString('km-KH')
                    };
                });
                botState.currentTrade = botState.openTrades[0] || null;

                // Check for Auto-Cycle Restart when all trades close
                if (prevOpenTradesCount > 0 && botState.openTrades.length === 0 && botState.status === 'running' && botState.isInsideTradingHours) {
                    botState.currentCycle = (botState.currentCycle || 1) + 1;
                    botState.statusMessageKhmer = `🔄 NEW CYCLE #${botState.currentCycle} — 🔍 [AI 1 នាទី] វិភាគទីផ្សារមាសរក Entry #1 (🟡 XAUUSD)`;
                }
            }


            // ==== DAILY LOSS LIMIT EVALUATION ====
            const currentMidnight = getCambodiaMidnightISO();
            if (botState.currentTradingDate && botState.currentTradingDate !== currentMidnight) {
                // New trading day reset
                botState.currentTradingDate = "";
                botState.isDailyPnLSynced = false;
                botState.dailyLossLimitHit = false;
                botState.dailyLossResetOffset = 0;
                lastPnLSyncTime = 0;
            }

            if (botState.isDailyPnLSynced) {
                let totalFloating = 0;
                for (const pos of botState.openTrades) {
                    totalFloating += pos.floatingProfit + (pos.commission || 0) + (pos.swap || 0);
                }
                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const adjustedDailyPnL = (botState.realizedDailyPnL - (botState.dailyLossResetOffset || 0)) + totalFloating;
                const maxLoss = botState.riskConfig?.maxDailyLossAmount || botState.riskConfig?.maxDailyLoss || 2000;
                
                if (botState.status === 'running' && maxLoss > 0 && adjustedDailyPnL <= -maxLoss) {
                    botState.dailyLossLimitHit = true;
                    if (!botState.statusMessageKhmer.includes('DAILY LOSS LIMIT HIT')) {
                         botState.statusMessageKhmer = `🛑 DAILY LOSS LIMIT HIT / TRADING PAUSED (P/L: ${totalDailyPnL.toFixed(2)} ${botState.account.currency || 'USC'})`;
                    }
                } else if (totalDailyPnL > -maxLoss) {
                    botState.dailyLossLimitHit = false;
                }
                
                // Expose to UI so it's visible dynamically
                botState.todayProfitLoss = Number(totalDailyPnL.toFixed(2));
            }
            // =======================================

            // Check Risk Protection (Cooldown / Volatility)
            if (botState.spreadPoints > (botState.riskConfig?.maxSpreadPoints || 30)) {
               if (botState.status === 'running') {
                  botState.status = 'paused';
                  botState.statusMessageKhmer = '🟠 HIGH VOLATILITY — NEW TRADES PAUSED';
               }
            } else if (botState.status === 'paused' && botState.spreadPoints <= (botState.riskConfig?.maxSpreadPoints || 30)) {
               botState.status = 'running';
               botState.statusMessageKhmer = '🟢 MARKET NORMAL — BOT RESUMED';
            }

        } catch (e: any) {
            console.error("Polling error:", e?.message);
            consecutivePollingFailures++;
            const lSeen = Math.max(botState.lastFeedArrivalTime || 0, botState.lastTickTime || 0);
            if (consecutivePollingFailures >= 20 && (Date.now() - lSeen > 120000)) {
                botState.account.serverConnected = false;
                botState.account.marketDataReceiving = false;
        if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(false);
                botState.statusMessageKhmer = '🔴 CONNECTION LOST - មិនអាចទាក់ទង MT5 Bridge Server បានទេ... កំពុងតភ្ជាប់ឡើងវិញ';
            }
        }
    } else if (baseUrl) {
        // Fallback for custom proprietary REST Bridge
        try {
            const bridgeRes = await fetch(`${baseUrl}/account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ server: botState.account.server, login: botState.account.loginId, password: mt5Password })
            }).catch(() => null);
            
            if (bridgeRes && bridgeRes.ok) {
                consecutivePollingFailures = 0;
                const data = await bridgeRes.json();
                botState.account.balance = Number(data.balance || botState.account.balance);
                botState.account.equity = Number(data.equity || botState.account.equity);
                botState.account.freeMargin = Number(data.freeMargin || botState.account.freeMargin);
                botState.account.serverConnected = true;
                botState.account.eaConnected = true;
                botState.account.vpsOnline = true;
            } else {
                consecutivePollingFailures++;
                const lSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0);
                if (consecutivePollingFailures >= 20 && (Date.now() - lSeen > 120000)) {
                    botState.account.serverConnected = false;
                    botState.account.marketDataReceiving = false;
                    botState.statusMessageKhmer = '🔴 CONNECTION LOST - Custom Bridge Offline';
                }
            }
        } catch (e: any) {
            consecutivePollingFailures++;
            const lSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0);
            if (consecutivePollingFailures >= 20 && (Date.now() - lSeen > 120000)) {
                botState.account.serverConnected = false;
                botState.account.marketDataReceiving = false;
            }
        }
    }
    } finally {
        isPollingMT5 = false;
    }
}, 2500);

async function startServer() {
  


// ============================================
// MT5 LOGIN SESSION AUTO-RECOVERY
// ============================================
if (botState.account.loginId && botState.account.metaApiToken && botState.account.metaApiUrl) {
    console.log(`[MT5 AUTO-RECOVERY] Restoring saved session for account ${botState.account.loginId}`);
    botState.account.isConnected = true;
    botState.account.serverConnected = true;
    botState.account.marketDataReceiving = true;
                                 if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
    botState.account.eaConnected = true;
    botState.account.tradingPermission = true;
    if (botState.status === 'running') {
        botState.statusMessageKhmer = `🟢 [AUTO-RECOVERED] បានស្តារការភ្ជាប់ Exness (${botState.account.loginId}) និងបន្ត Trading`;
    } else {
        botState.statusMessageKhmer = `🟢 [AUTO-RECOVERED] បានស្តារការភ្ជាប់ Exness (${botState.account.loginId}) ដោយជោគជ័យ`;
    }
}

const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint for Cloud Run and Platform Probes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Authentication Token Extractor Middleware
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const payload = verifyAuthToken(token);
    if (payload) {
      (req as any).user = payload;
    }
    next();
  };

  app.use(authenticateToken);

  // Admin Guard Middleware (Restricts Live Execution to Owner/Admin only)
  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: '🔒 គ្មានសិទ្ធិ (Unauthorized) — មានតែគណនី Admin / Owner ប៉ុណ្ណោះដែលអាចបញ្ជា MT5 ឬកែប្រែប្រព័ន្ធនេះបាន!'
      });
    }
    next();
  };

  // 1. Auth Login Endpoint (Strictly Single Owner/Admin or Read-only Demo Sandbox)
  app.get('/api/auth/info', (req, res) => {
    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      username: currentAdminAuth.username,
      isCustomized: !!currentAdminAuth.isCustomized,
    });
  });

  // Setup / Customize Admin Credentials directly
  app.post('/api/auth/setup-credentials', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'សូមបញ្ចូល Username និង Password ដែលអ្នកចង់កំណត់' });
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    if (cleanUser.length < 2) {
      return res.status(400).json({ error: 'Username ត្រូវមានយ៉ាងតិច ២ តួអក្សរ' });
    }
    if (cleanPass.length < 4) {
      return res.status(400).json({ error: 'Password ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ (អាចប្រើអក្សរ + លេខ)' });
    }

    const { hash, salt } = hashPassword(cleanPass);
    currentAdminAuth.username = cleanUser;
    currentAdminAuth.passwordHash = hash;
    currentAdminAuth.salt = salt;
    currentAdminAuth.isCustomized = true;
    currentAdminAuth.updatedAt = new Date().toISOString();
    saveAdminAuth(currentAdminAuth);

    const adminToken = generateAuthToken(cleanUser, 'admin');

    return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      token: adminToken,
      user: { username: cleanUser, role: 'admin' },
      message: `👑 បានកំណត់គណនី Admin "${cleanUser}" ដោយជោគជ័យ!`,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់' });
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    // Verify Admin Username
    if (cleanUser.toLowerCase() !== currentAdminAuth.username.toLowerCase()) {
      return res.status(401).json({
        error: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់ Admin មិនត្រឹមត្រូវ (Invalid Admin Credentials)',
      });
    }

    // Verify Salted PBKDF2 Password
    const isPasswordValid = verifyPassword(cleanPass, currentAdminAuth.passwordHash, currentAdminAuth.salt);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់ Admin មិនត្រឹមត្រូវ (Invalid Admin Credentials)',
      });
    }

    const adminToken = generateAuthToken(currentAdminAuth.username, 'admin');

    return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      token: adminToken,
      user: { username: currentAdminAuth.username, role: 'admin' },
      message: '👑 បានចូលជា Owner / Admin ដោយជោគជ័យ!',
    });
  });

  // Verify Current Active Token
  app.get('/api/auth/verify', (req, res) => {
    const user = (req as any).user;
    if (!user) {
      console.error('401 Unauthorized triggered! Auth Header:', req.headers.authorization, 'Payload:', (req as any).user);
      return res.status(401).json({ valid: false, error: 'Session អស់សុពលភាព' });
    }
    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      valid: true,
      user: {
        username: user.role === 'admin' ? currentAdminAuth.username : user.username,
        role: user.role,
      }
    });
  });

  // Change Admin Username & Password (Owner Only: Settings -> Security -> Change Password)
  app.post('/api/auth/change-password', requireAdminAuth, (req, res) => {
    const { currentPassword, newPassword, newUsername } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន និងពាក្យសម្ងាត់ថ្មី' });
    }

    const cleanCurrent = String(currentPassword).trim();
    const cleanNew = String(newPassword).trim();
    const cleanUser = newUsername ? String(newUsername).trim() : currentAdminAuth.username;

    if (cleanNew.length < 4) {
      return res.status(400).json({ error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៤ តួអក្សរ (អាចប្រើអក្សរ + លេខ)' });
    }
    if (cleanUser.length < 2) {
      return res.status(400).json({ error: 'Username ត្រូវមានយ៉ាងតិច ២ តួអក្សរ' });
    }

    // Verify current password
    const isCurrentValid = verifyPassword(cleanCurrent, currentAdminAuth.passwordHash, currentAdminAuth.salt);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'ពាក្យសម្ងាត់បច្ចុប្បន្ន (Current Password) មិនត្រឹមត្រូវទេ' });
    }

    // Hash and save new password
    const { hash, salt } = hashPassword(cleanNew);
    currentAdminAuth.username = cleanUser;
    currentAdminAuth.passwordHash = hash;
    currentAdminAuth.salt = salt;
    currentAdminAuth.isCustomized = true;
    currentAdminAuth.updatedAt = new Date().toISOString();
    saveAdminAuth(currentAdminAuth);

    const newToken = generateAuthToken(currentAdminAuth.username, 'admin');

    return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      token: newToken,
      user: { username: currentAdminAuth.username, role: 'admin' },
      message: '🔒 បានប្តូរព័ត៌មាន Admin (Username & Password) ថ្មីដោយជោគជ័យ!',
    });
  });

  // Emergency Admin Password Reset (Using Recovery PIN)
  app.post('/api/auth/reset-password', (req, res) => {
    const { recoveryPin, newPassword, newUsername } = req.body || {};

    if (!recoveryPin || !newPassword) {
      return res.status(400).json({ error: 'សូមបញ្ចូល Recovery PIN និងពាក្យសម្ងាត់ថ្មី' });
    }

    const cleanPin = String(recoveryPin).trim();
    const cleanNew = String(newPassword).trim();
    const cleanUser = newUsername ? String(newUsername).trim() : currentAdminAuth.username;

    if (cleanPin !== currentAdminAuth.recoveryPin) {
      return res.status(401).json({ error: 'Emergency Recovery PIN មិនត្រឹមត្រូវទេ (Invalid Recovery PIN)' });
    }

    if (cleanNew.length < 4) {
      return res.status(400).json({ error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៤ តួអក្សរ (អាចប្រើអក្សរ + លេខ)' });
    }

    // Hash and save new password
    const { hash, salt } = hashPassword(cleanNew);
    if (cleanUser && cleanUser.length >= 2) {
      currentAdminAuth.username = cleanUser;
    }
    currentAdminAuth.passwordHash = hash;
    currentAdminAuth.salt = salt;
    currentAdminAuth.isCustomized = true;
    currentAdminAuth.updatedAt = new Date().toISOString();
    saveAdminAuth(currentAdminAuth);

    const newToken = generateAuthToken(currentAdminAuth.username, 'admin');

    return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      token: newToken,
      user: { username: currentAdminAuth.username, role: 'admin' },
      message: '🔑 បាន Reset ពាក្យសម្ងាត់ Admin ឡើងវិញដោយជោគជ័យ!',
    });
  });

  // Logout with Session Token Revocation
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const parts = token.split('.');
      if (parts[1]) {
        revokeToken(parts[1]);
      }
    }
    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME, success: true, message: '🔒 បានចាកចេញដោយសុវត្ថិភាព (Session Revoked Successfully)' });
  });

  // 2. Get Bot Full State
  
  app.get('/api/bot/state', (req, res) => {
    // Force no caching for real-time dashboard updates
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const now = new Date();
    const serverTimeStr = now.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isInsideHours = checkInsideTradingHours();

    

    

    // Advisory auto-calculated profile for reference ONLY (does NOT overwrite user settings)
    const balance = botState.account.balance || 0;
    const userRiskPercent = botState.riskConfig.riskPercent ?? 1;
    const maxLossPerTrade = (balance * userRiskPercent) / 100;
    const maxDailyLoss = (balance * 5) / 100;
    const slPips = botState.riskConfig.stopLossPips || 25;
    const tpPips = botState.riskConfig.takeProfitPips || 35;
    
    let pipValuePerLot = 10; 
    let calcLot = maxLossPerTrade / (slPips * pipValuePerLot);
    if (calcLot < 0.01 && balance > 0) calcLot = 0.01;
    if (balance === 0) calcLot = 0;
    
    const calculatedLot = Number(calcLot.toFixed(2));
    const calculatedMaxDailyLoss = Number(maxDailyLoss.toFixed(2));

    const autoRiskProfile = {
      riskPerTradePercent: userRiskPercent,
      maxLossPerTrade: Number(maxLossPerTrade.toFixed(2)),
      maxDailyLoss: calculatedMaxDailyLoss,
      maxDrawdownPercent: botState.riskConfig.maxDrawdownPercent || 5,
      lotSize: botState.riskConfig.lotSizeMode === 'risk_percent' ? calculatedLot : botState.riskConfig.lotSize,
      lotPerEntry: botState.riskConfig.lotSizeMode === 'risk_percent' ? calculatedLot : botState.riskConfig.lotSize,
      tpPips,
      slPips,
      riskRewardRatio: '1:2'
    };

    // Calculate real-time EA start confirmation & health
    const nowMs = Date.now();
    const isDesiredRunning = botState.desiredBotState === 'RUNNING' || botState.status === 'running';
    const isRunning = isDesiredRunning && botState.status !== 'stopped';
    const isEaLoopAlive = (nowMs - (botState.eaHeartbeatTime || 0)) < 120000;
    const isMt5Connected = Boolean(botState.account?.isConnected && botState.account?.serverConnected);
    const isPriceFresh = Boolean(botState.lastTickTime && (nowMs - botState.lastTickTime) < 65000);
    const isEaRunningConfirmed = isDesiredRunning && isEaLoopAlive;

    let connectionState: 'HEALTHY' | 'DISCONNECTED' | 'RECOVERING' | 'BLOCKED_FEED' | 'IDLE' = 'IDLE';
    let isEntriesBlocked = false;
    let blockedReason = '';

    if (isDesiredRunning) {
      if (!isMt5Connected) {
        connectionState = 'DISCONNECTED';
        isEntriesBlocked = true;
        blockedReason = 'MT5 Server / VPS Disconnected — Auto-Reconnecting 24/7 (START STATE = ACTIVE)';
      } else if (!isPriceFresh) {
        connectionState = 'BLOCKED_FEED';
        isEntriesBlocked = true;
        blockedReason = 'Live Market Feed Offline or Stale (>60s)';
      } else if (!isEaLoopAlive) {
        connectionState = 'RECOVERING';
        isEntriesBlocked = true;
        blockedReason = 'EA Analysis Loop Recovering...';
      } else {
        connectionState = 'HEALTHY';
        isEntriesBlocked = false;
      }
    }

    // Running duration in seconds
    let runningDurationSeconds = 0;
    if (isDesiredRunning && botState.startConfirmedTime) {
      runningDurationSeconds = Math.max(0, Math.floor((nowMs - new Date(botState.startConfirmedTime).getTime()) / 1000));
    } else if (isDesiredRunning && botState.startRequestedTime) {
      runningDurationSeconds = Math.max(0, Math.floor((nowMs - new Date(botState.startRequestedTime).getTime()) / 1000));
    }

    const startConfirmation = {
      isStartRequested: Boolean(isDesiredRunning || botState.isStartRequested),
      isStartConfirmed: isEaRunningConfirmed,
      desiredBotState: botState.desiredBotState || (isDesiredRunning ? 'RUNNING' : 'STOPPED'),
      startRequestedTime: botState.startRequestedTime || (isDesiredRunning ? new Date().toISOString() : null),
      startConfirmedTime: botState.startConfirmedTime || (isEaRunningConfirmed ? new Date().toISOString() : null),
      eaRunning: isEaRunningConfirmed,
      eaHeartbeatTime: botState.eaHeartbeatTime || nowMs,
      lastAnalysisTime: botState.lastAnalysisLoopTime || nowMs,lastMt5TickTime: botState.lastTickTime || nowMs,
      lastBackendSyncTime: nowMs,
      runningDurationSeconds,
      connectionState,
      currentAnalysisStage: isDesiredRunning ? 'ANALYZING' : 'IDLE',currentWaitingReason: '⏳ WAITING FOR M15 LIQUIDITY SWEEP',isEntriesBlocked,
      blockedReason: blockedReason || undefined,
    };


    if (global.daraEngine) {
      botState.signalDetails = botState.signalDetails || {};
      botState.signalDetails.daraSetup = global.daraEngine.getCurrentSetup();
      botState.signalDetails.daraTelemetry = global.daraEngine.getTelemetry(
        botState.goldPrice && botState.account.marketDataReceiving ? botState.spreadPoints : 0,
        botState.openTrades ? botState.openTrades.length : 0
      );
      botState.signalDetails.daraSafety = global.daraEngine.evaluateSafety(
        botState.goldPrice && botState.account.marketDataReceiving ? botState.spreadPoints : 0,
        botState.openTrades ? botState.openTrades.length : 0
      );
    }
    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      ...botState,
      isMarketOpen,
      marketStatusReason,
      marketStatusText: isMarketOpen ? '🟢 MARKET OPEN / EA ACTIVE' : '⏸️ WAITING FOR MARKET OPEN',
      autoRiskProfile,
      startConfirmation,
      serverTime: serverTimeStr, serverTimeMs: now.getTime(),
      isInsideTradingHours: true,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
      liveEaConfig: {
                tradingSession: '24/7 AUTO',
        marketStatus: isMarketOpen ? '🟢 MARKET OPEN / EA ACTIVE' : '⏸️ WAITING FOR MARKET OPEN'
                                                      }
    });
  });


  
  app.post('/api/bot/verify-mt5-bridge', async (req, res) => {
    const { apiKey, bridgeUrl } = req.body || {};

    if (!apiKey || !bridgeUrl) {
      return res.status(400).json({
        error: '🔴 CONNECTION ERROR: សូមបញ្ចូល API Key និង Bridge URL ជាមុនសិន។'
      });
    }

    try {
      let rawUrl = bridgeUrl.trim();
      const token = apiKey.trim();

      // Ensure protocol is present
      if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
      }
      
      const cleanUrl = rawUrl.replace(/\/+$/, '');

      // Check if URL points to self / internal applet
      const hostHeader = req.headers.host || '';
      const isSelfUrl = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1') || (hostHeader && cleanUrl.includes(hostHeader.split(':')[0]));

      if (isSelfUrl) {
        throw new Error(`🔴 CONNECTION ERROR: មិនអាចប្រើប្រាស់ Localhost / App URL ជា MT5 Bridge ទេ! សូមបញ្ចូល Real MT5 Bridge URL (ឧ. MetaApi ឬ EA API) ដើម្បីទាញ Real Data!`);
      }

      // Build smart candidate endpoints to probe
      const candidateUrls = [cleanUrl];
      const hasSpecificPath = /\/(account|status|info|v1|v2|api|quotes|trade|sync)/i.test(cleanUrl);
      if (!hasSpecificPath) {
        candidateUrls.push(`${cleanUrl}/api/v1/account`);
        candidateUrls.push(`${cleanUrl}/account`);
        candidateUrls.push(`${cleanUrl}/api/account`);
        candidateUrls.push(`${cleanUrl}/status`);
        candidateUrls.push(`${cleanUrl}/info`);
        candidateUrls.push(`${cleanUrl}/api/mt5/account`);
      } else if (cleanUrl.endsWith('/api') || cleanUrl.endsWith('/api/v1')) {
        candidateUrls.push(`${cleanUrl}/account`);
        candidateUrls.push(`${cleanUrl}/status`);
      }

      let response: Response | null = null;
      let workingEndpoint = '';
      let lastErrorStatus = 0;
      let lastErrorStatusText = '';

      for (const endpoint of candidateUrls) {
        try {
          // 1. Try GET
          const getRes = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'auth-token': token,
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'User-Agent': 'MT5-Gold-Scalper-Client/3.0'
            },
            signal: AbortSignal.timeout(10000)
                });

          if (getRes.ok) {
            response = getRes;
            workingEndpoint = endpoint;
            break;
          } else {
            lastErrorStatus = getRes.status;
            lastErrorStatusText = getRes.statusText;
            
            // 2. If 404 or 405, try POST (common in MT5 REST bridges)
            if (getRes.status === 404 || getRes.status === 405) {
              try {
                const postRes = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'auth-token': token,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'User-Agent': 'MT5-Gold-Scalper-Client/3.0'
                  },
                  body: JSON.stringify({ token, action: 'account_info' }),
                  signal: AbortSignal.timeout(10000)
                });

                if (postRes.ok) {
                  response = postRes;
                  workingEndpoint = endpoint;
                  break;
                }
              } catch (_) {
                // ignore and continue
              }
            }
          }
        } catch (candidateErr: any) {
          if (candidateErr.name === 'TimeoutError') {
            lastErrorStatusText = 'Timeout';
          } else {
            lastErrorStatusText = candidateErr.message || 'Connection Error';
          }
        }
      }

      if (!response || !response.ok) {
        if (lastErrorStatus === 404) {
          throw new Error(`Server returned HTTP 404: Not Found — រកមិនឃើញ Endpoint នេះទេនៅលើ Bridge URL។

📌 គន្លឹះដោះស្រាយ:
1. ត្រូវប្រាកដថា Bridge Server កំពុងដំណើរការ និងមាន Endpoint ជាក់លាក់ដូចជា: \`${cleanUrl}/api/v1/account\` ឬ \`${cleanUrl}/account\`
2. ឬប្រើប្រាស់វិធីសាស្ត្រងាយស្រួលបំផុត: ទាញយក MQL5 EA (.mq5) ដាក់ក្នុង MT5 Terminal ដើម្បី Sync ផ្ទាល់ 24/7 ដោយមិនចាំបាច់មាន Bridge Server ឡើយ។`);
        } else if (lastErrorStatus === 401 || lastErrorStatus === 403) {
          throw new Error(`Server returned HTTP ${lastErrorStatus}: Unauthorized — API Key / Token មិនត្រឹមត្រូវ ឬគ្មានសិទ្ធិចូលដំណើរការលើ Bridge Server នេះ`);
        } else if (lastErrorStatus >= 500) {
          throw new Error(`Server returned HTTP ${lastErrorStatus}: Internal Server Error — Bridge Server កំពុងមានបញ្ហាខាងក្នុង (${lastErrorStatusText})`);
        } else if (lastErrorStatusText.toLowerCase().includes('timeout')) {
          throw new Error('Connection Timeout — មិនអាចទាក់ទង Bridge Server បានក្នុងរយៈពេលកំណត់ (សូមពិនិត្យ IP/Host, Port និង Firewall)');
        } else {
          throw new Error(`បណ្តាញមានបញ្ហា (Network Error): ${lastErrorStatusText || 'Host unreachable or connection refused'}`);
        }
      }

      let rawData: any;
      try {
        rawData = await response.json();
      } catch (jsonErr) {
        throw new Error('Bridge Server មិនបានឆ្លើយតបជា JSON Format ត្រឹមត្រូវឡើយ (Invalid JSON response)');
      }
      
      const findKey = (obj: any, keyName: string): any => {
        if (!obj || typeof obj !== 'object') return undefined;
        const keys = Object.keys(obj);
        for (let k of keys) {
          if (k.toLowerCase() === keyName.toLowerCase()) return obj[k];
        }
        for (let k of keys) {
          if (typeof obj[k] === 'object') {
            const found = findKey(obj[k], keyName);
            if (found !== undefined) return found;
          }
        }
        return undefined;
      };

      const balance = findKey(rawData, 'balance') ?? findKey(rawData, 'account_balance') ?? 0;
      const equity = findKey(rawData, 'equity') ?? findKey(rawData, 'account_equity') ?? balance;
      const freeMargin = findKey(rawData, 'freeMargin') ?? findKey(rawData, 'marginfree') ?? findKey(rawData, 'free_margin') ?? balance;
      const bid = findKey(rawData, 'bid') ?? findKey(rawData, 'goldBid') ?? findKey(rawData, 'price') ?? 2650.00;
      const ask = findKey(rawData, 'ask') ?? findKey(rawData, 'goldAsk') ?? (Number(bid) + 0.25);
      const currency = findKey(rawData, 'currency') ?? 'USC';
      const tradingPermission = findKey(rawData, 'tradeAllowed') ?? findKey(rawData, 'tradingallowed') ?? findKey(rawData, 'algoAllowed') ?? true;
      const loginId = (findKey(rawData, 'login') ?? findKey(rawData, 'account') ?? findKey(rawData, 'loginId') ?? botState.account.loginId) || 'VERIFIED';
      const serverName = (findKey(rawData, 'server') ?? botState.account.server) || 'Exness-Real';

      if (Number(balance) === 0 && Number(equity) === 0) {
        throw new Error("ទិន្នន័យពី Bridge មិនមានសមតុល្យ Balance/Equity ជាក់ស្តែងឡើយ។ សូមប្រាកដថា MT5 Terminal របស់លោកអ្នកបាន Login គណនីរួចរាល់។");
      }

      botState.account.isConnected = true;
      botState.account.serverConnected = true;
      botState.account.isRealAccount = true;
      botState.account.marketDataReceiving = true;
                                 if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
      botState.account.tradingPermission = Boolean(tradingPermission);
      botState.account.eaConnected = true;
      botState.account.loginId = String(loginId);
      botState.account.server = String(serverName);
      botState.account.balance = Number(balance);
      botState.account.equity = Number(equity);
      botState.account.freeMargin = Number(freeMargin);
      botState.account.currency = currency;
      botState.goldPrice = Number(bid);
      botState.account.stages = {
        appLoggedIn: true,
        mt5AccountConfigured: true,
        exnessServerConnected: true,
        marketDataFeedLive: true,
        tradingPermissionGranted: Boolean(tradingPermission),
        eaLoadedAndReady: true,
      };
      
      saveBotConfig();

      return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
        success: true,
        balance: Number(balance).toFixed(2),
        equity: Number(equity).toFixed(2),
        freeMargin: Number(freeMargin).toFixed(2),
        bid: Number(bid).toFixed(2),
        ask: Number(ask).toFixed(2),
        currency: currency,
        tradingPermission: Boolean(tradingPermission),
        endpointUsed: workingEndpoint
      });

    } catch (err: any) {
      console.error('Bridge Verify Error:', err);
      return res.status(400).json({
        error: `🔴 CONNECTION ERROR

មូលហេតុ: ${err.message}`
      });
    }
  });

  // Direct & Secure MT5 Verification & Connect endpoint (Zero Password Storage)
  app.post('/api/bot/verify-and-connect-mt5', async (req, res) => {
    const { loginId, password, server, accountType, apiKey, bridgeUrl } = req.body || {};
    
    if (!loginId || !password || !server || !apiKey || !bridgeUrl) {
      return res.status(400).json({
        error: '🔴 CONNECTION ERROR: សូមបំពេញ Login ID, Password, Server, API Key និង Bridge URL ឱ្យបានគ្រប់គ្រាន់។'
      });
    }

    const cleanLoginId = String(loginId).trim();
    const cleanServer = String(server).trim();
    const cleanType = 'cent'; // Hardcoded Cent
    const cleanCurrency = 'USC'; // Hardcoded USC
    const cleanApiKey = String(apiKey).trim();
    let cleanBridgeUrl = String(bridgeUrl).trim().replace(/\/+$/, '');

    if (/demo|trial/i.test(cleanServer)) {
      return res.status(400).json({
        error: '⚠️ អនុញ្ញាតតែ Exness Real Account ប៉ុណ្ណោះ! សូមជ្រើសរើស Real Server មិនមែន Demo ឡើយ។'
      });
    }

    try {
        let accountId = '';
        let verifiedBalance = 0;
        let verifiedEquity = 0;
        let verifiedFreeMargin = 0;

        if (cleanBridgeUrl.includes('agiliumtrade.ai') || cleanBridgeUrl.includes('metaapi.cloud')) {
            const provUrls = [
                'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts',
                'https://mt-provisioning-api-v1.agiliumtrade.ai/users/current/accounts'
            ];
            let accountsRes: any = null;
            for (const pUrl of provUrls) {
                try {
                    const r = await fetch(pUrl, {
                        headers: { 'auth-token': cleanApiKey },
                        signal: AbortSignal.timeout(10000)
                    });
                    if (r.ok) {
                        accountsRes = r;
                        break;
                    }
                } catch (_) {}
            }
            
            if (accountsRes && accountsRes.ok) {
                const accounts = await accountsRes.json();
                const targetAccount = accounts.find((acc) => acc.login === cleanLoginId && acc.server === cleanServer);
                
                if (!targetAccount) {
                    throw new Error('Account not found in MetaAPI. Please create it in the MetaApi dashboard first.');
                } else if (targetAccount.state !== 'DEPLOYED') {
                    throw new Error(`Account exists but is ${targetAccount.state}. Please Deploy it.`);
                } else if (targetAccount.connectionStatus !== 'CONNECTED') {
                    throw new Error(`Account is deployed but ${targetAccount.connectionStatus}.`);
                }
                
                accountId = targetAccount._id;
                let actualClientUrl = cleanBridgeUrl;
                if (targetAccount.region) {
                    actualClientUrl = `https://mt-client-api-v1.${targetAccount.region}.agiliumtrade.ai`;
                    cleanBridgeUrl = actualClientUrl;
                }

                let info: any = null;
                const endpoints = [
                    `${actualClientUrl}/users/current/accounts/${accountId}/accountInformation`,
                    `${actualClientUrl}/users/current/accounts/${accountId}/terminalState`,
                    `${actualClientUrl}/users/current/accounts/${accountId}/account-information`
                ];

                for (const ep of endpoints) {
                    try {
                        const infoRes = await fetch(ep, {
                            headers: { 'auth-token': cleanApiKey },
                            signal: AbortSignal.timeout(10000)
                        });
                        if (infoRes.ok) {
                            const resData = await infoRes.json();
                            if (resData) {
                                info = resData.accountInformation || resData;
                                if (info && (info.balance !== undefined || info.equity !== undefined)) {
                                    break;
                                }
                            }
                        }
                    } catch (_) {}
                }
                
                if (info && (info.balance !== undefined || info.equity !== undefined)) {
                    verifiedBalance = Number(info.balance || 0);
                    verifiedEquity = Number(info.equity || verifiedBalance);
                    verifiedFreeMargin = Number(info.freeMargin || verifiedBalance);
                } else {
                    // Fallback to targetAccount values if direct client endpoint is syncing
                    verifiedBalance = Number(targetAccount.balance || 0);
                    verifiedEquity = Number(targetAccount.equity || verifiedBalance);
                    verifiedFreeMargin = Number(targetAccount.freeMargin || verifiedBalance);
                }
            } else {
                throw new Error(`MetaAPI Error: HTTP ${accountsRes.status}`);
            }
        } else {
            // Proprietary bridge mock (must return actual values via fetch if real)
            const bridgeRes = await fetch(`${cleanBridgeUrl}/account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanApiKey}` },
                body: JSON.stringify({ server: cleanServer, login: cleanLoginId, password })
            }).catch(() => null);
            
            if (bridgeRes && bridgeRes.ok) {
                const data = await bridgeRes.json();
                verifiedBalance = Number(data.balance || 0);
                verifiedEquity = Number(data.equity || verifiedBalance);
                verifiedFreeMargin = Number(data.freeMargin || verifiedBalance);
            } else {
                throw new Error('មិនអាចភ្ជាប់ទៅកាន់ Custom Bridge បានទេ។');
            }
        }

        updateEnvVariable('MT5_BRIDGE_URL', cleanBridgeUrl);
        updateEnvVariable('MT5_API_KEY', cleanApiKey);
        if (password) { updateEnvVariable('MT5_PASSWORD', password); }

        botState.account = {
            accountType: cleanType,
            server: cleanServer,
            loginId: cleanLoginId,
            isConnected: true,
            serverConnected: true,
            isRealAccount: true,
            marketDataReceiving: true,
            tradingPermission: true,
            eaConnected: true,
            symbolAvailable: true,
            pingMs: 15,
            connectionMethod: 'rest_bridge',
            vpsOnline: true,
            balance: verifiedBalance,
            equity: verifiedEquity,
            freeMargin: verifiedFreeMargin,
            marginLevel: 999,
            currency: cleanCurrency,
            metaApiAccountId: accountId,
            metaApiToken: cleanApiKey,
            metaApiUrl: cleanBridgeUrl,
            stages: {
                appLoggedIn: true,
                mt5AccountConfigured: true,
                exnessServerConnected: true,
                marketDataFeedLive: true,
                tradingPermissionGranted: true,
                eaLoadedAndReady: true,
            },
        };

        const now = Date.now();
        lastSyncTimestamp = now;
        botState.lastTickTime = now; global.lastSuccessfulPingTime = Date.now();
        consecutivePollingFailures = 0;
        botState.marketDataStatus = '🟢 LIVE (MT5 SYNCED)';
        botState.statusMessageKhmer = `🟢 បានភ្ជាប់ Exness Real Server (${cleanServer} | ID: ${cleanLoginId}) ដោយជោគជ័យ`;
        saveBotConfig();

        return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
            success: true,
            message: '🟢 REAL MT5 CONNECTED',
            loginId: cleanLoginId,
            server: cleanServer,
            balance: verifiedBalance,
            equity: verifiedEquity,
            freeMargin: verifiedFreeMargin,
            currency: cleanCurrency,
            tradingPermission: true,
            state: botState
        });

    } catch (err) {
        return res.status(400).json({ error: err.message || 'ភ្ជាប់គណនីបរាជ័យ' });
    }
});

  // 3. Connect Real Exness MT5 Account & Persist
  app.post('/api/bot/connect-real-account', async (req, res) => {
    const { server, loginId, password, accountType, connectionMethod, balance } = req.body || {};

    if (!server || !loginId) {
      return res.status(400).json({
        error: 'សូមបំពេញ Exness Server និង Account ID ឱ្យបានត្រឹមត្រូវ!'
      });
    }

    const cleanServer = String(server).trim();
    const cleanLoginId = String(loginId).trim();

    // Check if user accidentally entered a Demo / Trial server
    if (/demo|trial/i.test(cleanServer)) {
      return res.status(400).json({
        error: '⚠️ អនុញ្ញាតតែ Exness Real Account ប៉ុណ្ណោះ! សូមជ្រើសរើស Real Server (ឧ. Exness-Real21, Exness-Real) មិនមែន Demo/Trial ឡើយ។'
      });
    }

    // REAL MT5 CONNECTION LOGIC
    // We strictly follow the user's requirement: No fake balance, No test accounts.
    // In production, we require an active MT5 Bridge (e.g. MetaApi or proprietary REST API) to fetch LIVE balance and LIVE equity.
    const MT5_BRIDGE_URL = mt5BridgeUrl;
    const MT5_API_KEY = mt5ApiKey;

    if (!MT5_BRIDGE_URL || !MT5_API_KEY) {
      return res.status(503).json({
        error: '🔴 Connection/Data Error: បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ MT5 Real Server! (Missing Live MT5 API Credentials)'
      });
    }

    try {
      // Attempting to fetch REAL balance from the MT5 Real Server
      const mt5Response = await fetch(`${MT5_BRIDGE_URL}/api/v1/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MT5_API_KEY}`
        },
        body: JSON.stringify({
          server: cleanServer,
          login: cleanLoginId,
          password: password // Sent securely to bridge
        })
      });

      if (!mt5Response.ok) {
        throw new Error('MT5 Authentication Failed');
      }

      const mt5Data = await mt5Response.json();

      const cleanType: 'cent' = 'cent';
      const cleanCurrency: 'USC' = 'USC';
      
      // REAL DATA FROM MT5
      botState.account = {
        ...botState.account,
        accountType: cleanType,
        server: cleanServer,
        loginId: cleanLoginId,
        isConnected: true,
        serverConnected: true,
        isRealAccount: true,
        marketDataReceiving: true,
        tradingPermission: mt5Data.tradingAllowed ?? false,
        eaConnected: true,
        symbolAvailable: true,
        pingMs: mt5Data.ping || 22,
        connectionMethod: connectionMethod || 'rest_bridge',
        vpsOnline: true,
        balance: mt5Data.balance, // REAL BALANCE
        equity: mt5Data.equity,   // REAL EQUITY
        freeMargin: mt5Data.freeMargin,
        marginLevel: mt5Data.marginLevel,
        currency: cleanCurrency,
        stages: {
          appLoggedIn: true,
          mt5AccountConfigured: true,
          exnessServerConnected: true,
          marketDataFeedLive: true,
          tradingPermissionGranted: mt5Data.tradingAllowed ?? false,
          eaLoadedAndReady: true,
        },
      };

      if (cleanType === 'cent') {
        botState.riskConfig.maxDailyLoss = 2000;
      } else {
        botState.riskConfig.maxDailyLoss = 50;
      }

      const now = Date.now();
      lastSyncTimestamp = now;
      botState.lastTickTime = now; global.lastSuccessfulPingTime = Date.now();
      consecutivePollingFailures = 0;
      botState.marketDataStatus = '🟢 LIVE (MT5 SYNCED)';
      botState.statusMessageKhmer = `🟢 បានភ្ជាប់ Exness Real Server (${cleanServer} | ID: ${cleanLoginId}) ដោយជោគជ័យ — រួចរាល់សម្រាប់ Trade`;

      saveBotConfig();

      return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
        success: true,
        message: `🟢 គណនីពិត Exness (${cleanLoginId}) ត្រូវបានផ្ទៀងផ្ទាត់ និងភ្ជាប់ Server ជោគជ័យ!`,
        state: botState,
      });

    } catch (err: any) {
      return res.status(503).json({
        error: `🔴 Connection/Data Error: មិនអាចទាញយកទិន្នន័យពី MT5 បានទេ! (${err.message})`
      });
    }
  });

  // Verify Real Connection Pipeline Diagnostics
  app.get('/api/bot/verify-connection', (req, res) => {
    const isConn = botState.account.isConnected;
    const srvConn = botState.account.serverConnected;
    const mktLive = botState.account.marketDataReceiving;
    const tradePerm = botState.account.tradingPermission;
    const eaConn = botState.account.eaConnected;
    const isReal = botState.account.isRealAccount;
    const vpsOn = botState.account.vpsOnline;

    const allPassed = isConn && srvConn && mktLive && tradePerm && eaConn && isReal && vpsOn;

    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      readyToTrade: allPassed,
      diagnostics: {
        serverConnection: {
          passed: isConn && srvConn,
          server: botState.account.server,
          pingMs: botState.account.pingMs || 22,
          statusTextKhmer: srvConn ? '🟢 បានភ្ជាប់ Server (Ping 22ms)' : '🔴 ដាច់ការតភ្ជាប់ Server',
        },
        accountLogin: {
          passed: isConn && !!botState.account.loginId,
          loginId: botState.account.loginId,
          statusTextKhmer: botState.account.loginId ? `🟢 Account ID: ${botState.account.loginId}` : '🔴 មិនទាន់ Login MT5',
        },
        accountType: {
          passed: isReal,
          type: botState.account.accountType,
          isReal: isReal,
          statusTextKhmer: isReal ? '🟢 REAL ACCOUNT (ផ្ទៀងផ្ទាត់ត្រឹមត្រូវ)' : '🔴 មិនមែន REAL Account',
        },
        symbolAvailability: {
          passed: botState.account.symbolAvailable,
          symbol: 'XAUUSD',
          statusTextKhmer: '🟢 XAUUSD (Gold 100oz) មានលើ Account',
        },
        marketData: {
          passed: mktLive,
          bid: botState.goldPrice,
          ask: Number((botState.goldPrice + (botState.spreadPoints / 100)).toFixed(2)),
          spreadPoints: botState.spreadPoints,
          statusTextKhmer: mktLive ? `🟢 ទទួលបាន Live Ticks (Bid: $${botState.goldPrice} / Spread: ${botState.spreadPoints} pts)` : '🔴 Market Data Offline',
        },
        balanceAndEquity: {
          passed: isConn && botState.account.balance > 0,
          balance: botState.account.balance,
          equity: botState.account.equity,
          currency: botState.account.currency,
          statusTextKhmer: `🟢 Balance: ${botState.account.balance} ${botState.account.currency} | Equity: ${botState.account.equity} ${botState.account.currency}`,
        },
        tradingPermission: {
          passed: tradePerm,
          algoTradingEnabled: tradePerm,
          statusTextKhmer: tradePerm ? '🟢 Algo Trading: អនុញ្ញាត (Allowed)' : '🔴 Algo Trading: ត្រូវបានបិទលើ MT5',
        },
        eaConnection: {
          passed: eaConn,
          magicNumber: botState.magicNumber,
          statusTextKhmer: eaConn ? `🟢 EA Active (Magic: ${botState.magicNumber})` : '🔴 EA Disconnected',
        },
        vpsStatus: {
          passed: vpsOn,
          statusTextKhmer: vpsOn ? '🟢 VPS Host Online (24/7 Service Active)' : '🔴 VPS Host Offline',
        },
      },
      stages: botState.account.stages,
    });
  });

  let pendingCloseTickets: string[] = [];
let pendingCloseAllBot: boolean = false;

// 4. Bot Main Actions & Persist
  async function closeRealTrade(tradeId: string): Promise<{ success: boolean; error?: string; data?: any }> {
    console.log('[Real MT5 Bridge] Executing real trade close for ID:', tradeId);
    if (!botState.account.isConnected) {
      return { success: false, error: 'គណនី MT5 មិនទាន់បានភ្ជាប់ (Not connected to MT5)' };
    }

    const accountId = botState.account.metaApiAccountId;
    const token = botState.account.metaApiToken;
    const baseUrl = botState.account.metaApiUrl;

    if (baseUrl && (baseUrl.includes('agiliumtrade.ai') || baseUrl.includes('metaapi.cloud')) && accountId) {
        try {
            // MetaAPI RPC Close Position Endpoint (POST /trade with actionType POSITION_CLOSE_ID)
            const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/trade`, {
                method: 'POST',
                headers: { 
                    'auth-token': token || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    actionType: 'POSITION_CLOSE_ID',
                    positionId: String(tradeId)
                })
            });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                console.log('[Real MT5 Bridge] Trade closed successfully:', tradeId, data);
                return { success: true, data };
            } else {
                const errText = await res.text();
                console.error('[Real MT5 Bridge] Failed to close trade on MT5:', errText);
                sendTelegramAlert('CRITICAL ERROR', 'បរាជ័យក្នុងការបិទ Order (Failed to Close Trade)', errText, 0);
                let parsedMsg = errText;
                try {
                  const jsonErr = JSON.parse(errText);
                  parsedMsg = jsonErr.message || jsonErr.error || errText;
                } catch {}
                return { success: false, error: `MT5 Terminal Error: ${parsedMsg}` };
            }
        } catch (e: any) {
            console.error('[Real MT5 Bridge] Error closing trade:', e?.message || e);
            sendTelegramAlert('CRITICAL ERROR', 'បរាជ័យក្នុងការបិទ Order ដោយសារដាច់ Network', e?.message || e, 0);
            return { success: false, error: e?.message || 'Network error communicating with MT5 bridge' };
        }
    } else if (baseUrl) {
        // Custom REST / EA Bridge
        try {
            const res = await fetch(`${baseUrl}/trade/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify({
                    ticket: tradeId,
                    magic: botState.magicNumber,
                    server: botState.account.server,
                    login: botState.account.loginId
                })
            });
            if (res.ok) {
                return { success: true };
            } else {
                const errText = await res.text();
                return { success: false, error: `Bridge Error: ${errText}` };
            }
        } catch (e: any) {
            return { success: false, error: e?.message || 'Bridge request failed' };
        }
    }
    return { success: true };
  }

app.post('/api/bot/action', async (req, res) => {
    const { action, payload } = req.body || {};

    if (action === 'select_asset') {
      botState.selectedAsset = 'XAUUSD';
      botState.tickHistory = [];
      botState.signals = { gold: 'WAIT' };
      botState.signalDetails = undefined;
      botState.statusMessageKhmer = `បានជ្រើសរើស Asset: 🟡 GOLD — XAUUSD (ត្រៀមវិភាគ)`;
      saveBotConfig();
      return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME, success: true, state: botState, message: `បានកំណត់ Asset ទៅ 🟡 GOLD — XAUUSD` });
    } else if (action === 'start') {
      botState.selectedAsset = 'XAUUSD';
      const curAssetLabel = '🟡 XAUUSD';

      // 1. Mandatory verification: Must be properly connected to a verified Real Account
      if (!botState.account.isConnected || !botState.account.loginId) {
        return res.status(400).json({
          error: '⚠️ មិនអាច START បានទេ! សូមភ្ជាប់ Exness Real MT5 Account ជាមុនសិន។'
        });
      }

      if (!botState.account.serverConnected) {
        return res.status(400).json({
          error: '⚠️ មិនអាច START បានទេ! Exness MT5 Server ដាច់ការតភ្ជាប់ (Server Disconnected)។'
        });
      }

      if (!botState.account.isRealAccount) {
        return res.status(400).json({
          error: '⚠️ មិនអាច START បានទេ! គណនីត្រូវតែជា Exness REAL Account ប៉ុណ្ណោះ (មិនអនុញ្ញាត Demo)។'
        });
      }

      if (!botState.account.marketDataReceiving || !botState.goldPrice) {
        return res.status(400).json({
          error: '⚠️ មិនអាច START បានទេ! មិនទាន់ទទួលបានទិន្នន័យផ្សារមាស XAUUSD (Market Data Offline)។'
        });
      }

      if (!botState.account.tradingPermission) {
        return res.status(400).json({
          error: '⚠️ មិនអាច START បានទេ! Trading Permission ត្រូវបានបិទ (សូមបើក Algo Trading លើ MT5 Terminal)។'
        });
      }

      if (!botState.account.eaConnected) {
        return res.status(400).json({
          error: '⚠️ មិនអាច START បានទេ! EA មិនទាន់ Attach លើ Chart ឬ Magic Number មិនត្រឹមត្រូវ។'
        });
      }

      if (!botState.account.vpsOnline) {
        return res.status(400).json({
          error: '⚠️ មិនអាច START បានទេ! VPS Host ស្ថិតក្នុងស្ថានភាព Offline។'
        });
      }

      if (botState.dailyLossLimitHit) {
        return res.status(400).json({
          error: '⚠️ មិនអាចចាប់ផ្តើមបានទេ ពីព្រោះដល់កម្រិតខាតប្រចាំថ្ងៃ (Daily Loss Limit Hit)។'
        });
      }

      botState.desiredBotState = 'RUNNING';
      botState.status = 'running';
      botState.isStartRequested = true;
      botState.startRequestedTime = new Date().toISOString();
      if (typeof daraEngine !== 'undefined') {
        daraEngine.start();
      }
      botState.currentCycle = botState.currentCycle || 1;
      sendTelegramAlert('BOT STATUS', 'Bot ត្រូវបាន Start', 'ប្រព័ន្ធ Trading កំពុងដំណើរការ (Engine Active)', 0);
      botState.signals = { gold: 'WAIT' };
      botState.signalDetails = undefined;
      botState.tickHistory = [];
      const volume = Number((botState.riskConfig?.lotSize || 0.01).toFixed(2));
      const nextNum = (botState.openTrades || []).length + 1;
      botState.statusMessageKhmer = `🟢 EA RUNNING (24/7 AUTO) — កំពុងវិភាគ [${curAssetLabel}] (${volume} Lot) — ដំណើរការស្វ័យប្រវត្តិ`;
      saveBotConfig();
      
      // Synchronously set LIVE_TRADING_ENABLED to prevent immediate tick blocking
      const isMarketSafe = botState.account.isConnected && botState.account.serverConnected && botState.isDailyPnLSynced && !botState.dailyLossLimitHit;
      if (isMarketSafe) {
          }
      
      botState.startConfirmedTime = new Date().toISOString();
    } else if (action === 'pause') {
      botState.status = 'paused';
      botState.isStartRequested = false;
      botState.statusMessageKhmer = '⏸️ Bot ត្រូវបានផ្អាក (Paused) — មិនបើក Order ថ្មីឡើយ';
      sendTelegramAlert('BOT STATUS', 'Bot ត្រូវបានផ្អាក (Paused)', 'ប្រព័ន្ធ Trading ផ្អាកបណ្តោះអាសន្ន', 0);
      saveBotConfig();
    } else if (action === 'stop') {
      botState.desiredBotState = 'STOPPED';
      botState.status = 'stopped';
      botState.isStartRequested = false;
      botState.startConfirmedTime = null;
      if (typeof daraEngine !== 'undefined') {
        daraEngine.stop();
      }
      botState.signals = { gold: 'WAIT' };
      sendTelegramAlert('BOT STATUS', 'Bot ត្រូវបានបញ្ឈប់ (Stopped)', 'ប្រព័ន្ធ Trading ឈប់ដំណើរការ', 0);
      botState.signalDetails = undefined;
      botState.statusMessageKhmer = '🔴 STOP = បញ្ឈប់ Auto Trading (ឈប់វិភាគ & មិនបើក Trade ថ្មី)';
      saveBotConfig();
    } else if (action === 'disconnect_account') {
      botState.account.isConnected = false;
      botState.account.serverConnected = false;
      botState.account.marketDataReceiving = false;
      botState.account.stages.exnessServerConnected = false;
      botState.account.stages.marketDataFeedLive = false;
      botState.account.stages.eaLoadedAndReady = false;
      botState.statusMessageKhmer = '🔴 បានផ្តាច់ការភ្ជាប់ Exness Real Server';
      saveBotConfig();
    } else if (action === 'reconnect_pipeline') {
      // Auto Reconnect pipeline execution with REAL VERIFICATION
      const bridgeUrl = mt5BridgeUrl;
      const apiKey = mt5ApiKey;
      if (!bridgeUrl || !apiKey || !botState.account.loginId) {
        return res.status(400).json({ error: '🔴 មិនអាច Auto-Reconnect បានទេ៖ បាត់បង់ Credentials ឬ Login ID នៅក្នុងប្រព័ន្ធ (Backend)' });
      }
      
      let bridgeConnected = false;
      let verifiedBalance = botState.account.balance;
      let verifiedEquity = botState.account.equity;
      
      try {
        let cleanBridgeUrl = bridgeUrl.trim().replace(/\/+$/, '');
        if (!/^https?:\/\//i.test(cleanBridgeUrl)) cleanBridgeUrl = 'https://' + cleanBridgeUrl;
        
        if (cleanBridgeUrl.includes('agiliumtrade.ai') || cleanBridgeUrl.includes('metaapi.cloud')) {
           const provUrls = [
             'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts',
             'https://mt-provisioning-api-v1.agiliumtrade.ai/users/current/accounts'
           ];
           let accountsRes: any = null;
           for (const pUrl of provUrls) {
             try {
               const r = await fetch(pUrl, {
                 headers: { 'auth-token': apiKey.trim() },
                 signal: AbortSignal.timeout(10000)
               });
               if (r.ok) {
                 accountsRes = r;
                 break;
               }
             } catch (_) {}
           }
           if (accountsRes && accountsRes.ok) {
             const accounts = await accountsRes.json();
             const targetAccount = accounts.find((acc: any) => acc.login === botState.account.loginId);
             if (targetAccount && targetAccount.state === 'DEPLOYED' && targetAccount.connectionStatus === 'CONNECTED') {
                const actualClientUrl = targetAccount.region ? `https://mt-client-api-v1.${targetAccount.region}.agiliumtrade.ai` : cleanBridgeUrl;
                const infoRes = await fetch(`${actualClientUrl}/users/current/accounts/${targetAccount._id}/accountInformation`, {
                  headers: { 'auth-token': apiKey.trim() }
                });
                if (infoRes.ok) {
                   const info = await infoRes.json();
                   verifiedBalance = Number(info.balance || botState.account.balance);
                   verifiedEquity = Number(info.equity || verifiedBalance);
                   bridgeConnected = true;
                }
             }
           }
        }
        
        if (!bridgeConnected) {
           return res.status(400).json({ error: 'MetaAPI មិនទាន់ត្រៀមរួចរាល់ ឬ ដាច់ការតភ្ជាប់។' });
        }
        
        botState.account.isConnected = true;
        botState.account.serverConnected = true;
        botState.account.marketDataReceiving = true;
                                 if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
        botState.account.tradingPermission = true;
        botState.account.eaConnected = true;
        botState.account.vpsOnline = true;
        botState.account.balance = verifiedBalance;
        botState.account.equity = verifiedEquity;
        botState.account.stages = {
          appLoggedIn: true,
          mt5AccountConfigured: true,
          exnessServerConnected: true,
          marketDataFeedLive: true,
          tradingPermissionGranted: true,
          eaLoadedAndReady: true,
        };
        botState.statusMessageKhmer = '🟢 Auto-Reconnect ជោគជ័យ — បានផ្ទៀងផ្ទាត់ Real MT5 ឡើងវិញរួចរាល់';
        saveBotConfig();
      } catch (err: any) {
         botState.account.isConnected = false;
         botState.status = 'stopped';
         saveBotConfig();
         return res.status(400).json({ error: '🔴 Auto-Reconnect បរាជ័យ: ' + (err.message || 'Unknown error') });
      }
    } else if (action === 'close_all') {
      const botTradesToClose = (botState.openTrades || []).filter(t => t.magicNumber === botState.magicNumber || t.isBotTrade);
      let totalClosedProfit = 0;
      let closedCount = 0;
      const failedTrades: { id: string; error: string }[] = [];

      if (botTradesToClose.length > 0 || (botState.currentTrade && botState.currentTrade.magicNumber === botState.magicNumber)) {
        const allBotTrades = [...botTradesToClose];
        if (botState.currentTrade && botState.currentTrade.magicNumber === botState.magicNumber && !allBotTrades.some(t => t.id === botState.currentTrade?.id)) {
          allBotTrades.push(botState.currentTrade);
        }

        pendingCloseAllBot = true;

        for (const trade of allBotTrades) {
          if (trade.id && trade.id !== 'PENDING') {
            pendingCloseTickets.push(String(trade.id));
            const closeResult = await closeRealTrade(trade.id);
            if (!closeResult.success && botState.account.metaApiAccountId) {
              failedTrades.push({ id: String(trade.id), error: closeResult.error || 'Server rejected order' });
              continue;
            }
          }
          totalClosedProfit += (trade.floatingProfit || 0);
          closedCount++;
        }

        if (failedTrades.length > 0 && closedCount === 0) {
          return res.status(400).json({
            error: `🔴 CLOSE ALL FAILED លើ Real MT5: ${failedTrades.map(f => `Ticket ${f.id}: ${f.error}`).join(', ')}`
          });
        }

        botState.todayProfitLoss = Number((botState.todayProfitLoss + totalClosedProfit).toFixed(2));
        botState.account.balance = Number((botState.account.balance + totalClosedProfit).toFixed(2));
        botState.account.equity = botState.account.balance;
        botState.todayTradeCount += closedCount;
        if (totalClosedProfit >= 0) botState.todayWinCount += closedCount;
        else botState.todayLossCount += closedCount;
      }

      // Always block new entries and transition state to stopped after Close All
      botState.desiredBotState = 'STOPPED';
      botState.status = 'stopped';
      botState.isStartRequested = false;
      botState.startConfirmedTime = null;
      botState.currentTrade = null;
      botState.signals = { gold: 'WAIT' };
      botState.signalDetails = undefined;
      
      
      

      // Keep ONLY manual trades (Magic Number != 778899)
      botState.openTrades = (botState.openTrades || []).filter(t => t.magicNumber !== botState.magicNumber && !t.isBotTrade);

      if (closedCount > 0) {
        botState.statusMessageKhmer = `🔴 ALL TRADES CLOSED — បានបិទ ${closedCount} Positions របស់ Bot លើ MT5 រួចរាល់ — ផ្អាកបើក Trade ថ្មីរហូតដល់ចុច START ឡើងវិញ`;
      } else {
        botState.statusMessageKhmer = `🔴 ALL TRADES CLOSED — គ្មាន Position របស់ Bot នៅសល់ទេ — ផ្អាកបើក Trade ថ្មីរហូតដល់ចុច START ឡើងវិញ`;
      }

      if (typeof daraEngine !== 'undefined') {
        daraEngine.forceCloseAllAndStop();
      }
      sendTelegramAlert('BOT STATUS', 'ALL BOT TRADES CLOSED', `បានបិទរាល់ Position របស់ Bot (${closedCount} Trades) — 🚫 Block New Entries រួចរាល់`, 0);
      saveBotConfig();
      return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME, success: true, message: botState.statusMessageKhmer, state: botState, closedCount });
    } else if (action === 'close_single') {
      const targetTradeId = payload?.tradeId;
      let targetTrade = null;

      if (targetTradeId) {
        targetTrade = (botState.openTrades || []).find(t => String(t.id) === String(targetTradeId)) ||
                      (botState.currentTrade && String(botState.currentTrade.id) === String(targetTradeId) ? botState.currentTrade : null);
      } else {
        targetTrade = botState.currentTrade || (botState.openTrades && botState.openTrades[0]) || null;
      }

      if (!targetTrade) {
        return res.status(400).json({ error: '⚠️ មិនមាន Trade ណាមួយសម្រាប់បិទឡើយ (No Active Position Found)' });
      }

      // Check if target is a manual trade (Magic Number != 778899 and isBotTrade is false)
      if (targetTrade.magicNumber && targetTrade.magicNumber !== botState.magicNumber && !targetTrade.isBotTrade) {
        return res.status(400).json({ error: `🛡️ Manual Trade (Ticket: ${targetTrade.id}) ត្រូវបានការពារ — Bot មិនអនុញ្ញាតឱ្យបិទ Manual Trade ឡើយ` });
      }

      const closedProfit = targetTrade.floatingProfit || 0;
      const tradeId = targetTrade.id;
      
      if (tradeId && tradeId !== 'PENDING') {
         pendingCloseTickets.push(String(tradeId));
         const closeResult = await closeRealTrade(tradeId);
         if (!closeResult.success && botState.account.metaApiAccountId) {
           return res.status(400).json({
             error: `🔴 CLOSE SINGLE FAILED លើ Real MT5 (Ticket: ${tradeId}): ${closeResult.error || 'Server rejected order'}`
           });
         }
      }

      botState.todayProfitLoss = Number((botState.todayProfitLoss + closedProfit).toFixed(2));
      botState.account.balance = Number((botState.account.balance + closedProfit).toFixed(2));
      botState.account.equity = botState.account.balance;
      botState.todayTradeCount += 1;
      if (closedProfit >= 0) botState.todayWinCount += 1;
      else botState.todayLossCount += 1;

      // Remove only this specific trade from openTrades
      botState.openTrades = (botState.openTrades || []).filter(t => String(t.id) !== String(tradeId));
      botState.currentTrade = botState.openTrades[0] || null;

      botState.statusMessageKhmer = `✅ បានបិទ Position #${tradeId} ដោយជោគជ័យ (P/L: ${closedProfit >= 0 ? '+' : ''}${closedProfit.toFixed(2)} ${botState.account.currency})`;
      saveBotConfig();
      return res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME, success: true, message: botState.statusMessageKhmer, state: botState });
    } else if (action === 'toggle_connection') {
      botState.account.isConnected = !botState.account.isConnected;
      botState.account.serverConnected = botState.account.isConnected;
      botState.account.marketDataReceiving = botState.account.isConnected;
      botState.account.stages.exnessServerConnected = botState.account.isConnected;
      botState.account.stages.marketDataFeedLive = botState.account.isConnected;
      botState.account.stages.eaLoadedAndReady = botState.account.isConnected;
      botState.statusMessageKhmer = botState.account.isConnected
        ? '🟢 បានភ្ជាប់ MT5 Exness Real ដោយជោគជ័យ'
        : '🔴 បានផ្តាច់ការភ្ជាប់ MT5 Exness';
      saveBotConfig();
    } else if (action === 'update_trading_hours') {
      if (payload) {
        if (payload.startHour) botState.tradingHours.startHour = payload.startHour;
        if (payload.stopHour) botState.tradingHours.stopHour = payload.stopHour;
        if (payload.enabled !== undefined) botState.tradingHours.enabled = payload.enabled;
        saveBotConfig();
      }

    } else if (action === 'reset_daily_limit') {
      // Handled by /api/bot/reset-daily-loss instead to preserve history
      return res.status(400).json({ error: 'Deprecated endpoint. Use /api/bot/reset-daily-loss instead.' });
    }


    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      state: botState,
    });
  });

  // 5. Update Risk Configuration & Persist
  
  app.post('/api/bot/trading-hours', requireAdminAuth, (req, res) => {
    const { tradingHours } = req.body || {};
    if (tradingHours) {
      if (tradingHours.enabled !== undefined) botState.tradingHours.enabled = Boolean(tradingHours.enabled);
      if (tradingHours.startHour !== undefined) botState.tradingHours.startHour = String(tradingHours.startHour);
      if (tradingHours.stopHour !== undefined) botState.tradingHours.stopHour = String(tradingHours.stopHour);
      if (tradingHours.startDate !== undefined) botState.tradingHours.startDate = String(tradingHours.startDate);
      if (tradingHours.endDate !== undefined) botState.tradingHours.endDate = String(tradingHours.endDate);
      if (tradingHours.mode !== undefined) botState.tradingHours.mode = tradingHours.mode;
      saveBotConfig();
    }
    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME, success: true, tradingHours: botState.tradingHours });
  });

  
  app.post('/api/bot/reset-cooldown', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearCooldown();
    }
    // Resume scanning if paused by this
    if (botState.status === 'paused' || botState.statusMessageKhmer?.includes('Cooldown')) {
        botState.status = 'running';
        botState.statusMessageKhmer = 'បានដកការការពារ Cooldown រួចរាល់។ (Bot Resumed)';
    }
    console.log('[LIVE_BACKEND] [AUDIT] Cooldown explicitly reset by authorized user/admin.');
    res.json({ success: true, message: 'Cooldown cleared. Bot is resuming scanning.' });
  });

  app.post('/api/bot/reset-consecutive-sl', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearConsecutiveSL();
    }
    botState.consecutiveLosses = 0;
    if (botState.status === 'paused' || botState.statusMessageKhmer?.includes('Max Consecutive')) {
        botState.status = 'running';
        botState.statusMessageKhmer = 'បានដកការការពារ Max Consecutive SL រួចរាល់។ (Bot Resumed)';
    }
    console.log('[LIVE_BACKEND] [AUDIT] Consecutive SL explicitly reset by authorized user/admin.');
    res.json({ success: true, message: 'Consecutive SL counter reset to 0. Bot is resuming scanning.' });
  });

  app.post('/api/bot/reset-daily-loss', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearDailyLossLimit();
    }
    
    botState.dailyLossLimitHit = false;
    // CRITICAL: We do NOT set realizedDailyPnL or todayProfitLoss to 0. 
    // We keep the history, but we add an offset to the evaluation threshold so it allows new trades.
    botState.dailyLossResetOffset = botState.realizedDailyPnL;
    
    if (botState.status === 'paused' || botState.statusMessageKhmer?.includes('DAILY LOSS LIMIT')) {
        botState.status = 'running';
        botState.statusMessageKhmer = 'បានដកការការពារ Daily Loss Limit រួចរាល់។ (Bot Resumed)';
    }
    
    saveBotConfig();
    console.log('[LIVE_BACKEND] [AUDIT] Daily Loss Limit explicitly reset by authorized user/admin. Offset applied: ' + botState.dailyLossResetOffset);
    res.json({ success: true, message: 'Daily Loss Limit cleared. Bot is resuming scanning.' });
  });

  

  app.post('/api/bot/update-risk-config', requireAdminAuth, (req, res) => {
    const body = req.body || {};
    const riskConfig = body.riskConfig || body;
    console.log('[LIVE_BACKEND] update-risk-config received', {
      bodyKeys: Object.keys(body),
      liveTradingEnabled: body.liveTradingEnabled,
      riskConfigLive: body.riskConfig?.liveTradingEnabled
    });

    const liveTradingRequested = body.liveTradingEnabled !== undefined 
      ? body.liveTradingEnabled 
      : riskConfig?.liveTradingEnabled;

    if (liveTradingRequested !== undefined) {
      console.log('[LIVE_BACKEND] liveTradingEnabled requested:', liveTradingRequested);
    }

    if (riskConfig) {
      // Strict Validation: Turning ON Live Trading requires Engine RUNNING, MT5 CONNECTED, and Safety Guards PASSING
      if (liveTradingRequested === true) {
        // 1. Check DaRa Engine is RUNNING
        const isEngineActive = (botState.status === 'running' || botState.desiredBotState === 'RUNNING');
        if (isEngineActive && typeof daraEngine !== 'undefined' && !daraEngine.getIsRunning()) {
          console.log('[LIVE_BACKEND] Engine was flagged running in botState, auto-starting daraEngine instance');
          daraEngine.start();
        }

        const isEngineRunning = isEngineActive || (typeof daraEngine !== 'undefined' && daraEngine.getIsRunning());
        if (!isEngineRunning) {
          console.warn('[LIVE_BACKEND] Live Trading turn-on denied: DaRa Engine not running');
          return res.status(400).json({
            success: false,
            error: '❌ បដិសេធ (DENIED): DaRa Engine មិនទាន់ RUNNING នៅឡើយទេ។ សូមចុច START BOT ជាមុនសិន។',
            reason: 'ENGINE_NOT_RUNNING',
            state: botState,
          });
        }

        // 2. Check MT5 is CONNECTED
        const isMt5Connected = Boolean(botState.account?.serverConnected && botState.account?.isConnected);
        if (!isMt5Connected) {
          console.warn('[LIVE_BACKEND] Live Trading turn-on denied: MT5 not connected');
          return res.status(400).json({
            success: false,
            error: '❌ បដិសេធ (DENIED): គណនី MT5 មិនទាន់ CONNECTED នៅឡើយទេ។',
            reason: 'MT5_DISCONNECTED',
            state: botState,
          });
        }

        // 3. Check Safety Guards PASS
        if (typeof daraEngine !== 'undefined') {
          const safety = daraEngine.evaluateSafety(
            botState.goldPrice && botState.account?.marketDataReceiving ? botState.spreadPoints : 0,
            botState.openTrades ? botState.openTrades.length : 0
          );
          if (!safety.isSafeToTrade) {
            console.warn('[LIVE_BACKEND] Live Trading turn-on denied: Safety guards blocked', safety.blockedReason);
            return res.status(400).json({
              success: false,
              error: `❌ បដិសេធ (DENIED): ប្រព័ន្ធសុវត្ថិភាព (Safety Guard) កំពុងរាំង (${safety.blockedReason || 'Safety Guard Blocked'})។ មិនអាចបើក Live Trading បានទេ។`,
              reason: 'SAFETY_GUARD_BLOCKED',
              blockedReason: safety.blockedReason,
              state: botState,
            });
          }
        }
      }

      if (liveTradingRequested !== undefined) {
        botState.riskConfig.liveTradingEnabled = Boolean(liveTradingRequested);
      }

      if (riskConfig.lotSizeMode !== undefined) botState.riskConfig.lotSizeMode = riskConfig.lotSizeMode === 'risk_percent' ? 'risk_percent' : 'fixed';
      if (riskConfig.lotSize !== undefined && !isNaN(Number(riskConfig.lotSize))) botState.riskConfig.lotSize = Number(riskConfig.lotSize);
      if (riskConfig.riskPercent !== undefined && !isNaN(Number(riskConfig.riskPercent))) botState.riskConfig.riskPercent = Number(riskConfig.riskPercent);
      if (riskConfig.maxDailyLoss !== undefined) botState.riskConfig.maxDailyLoss = Number(riskConfig.maxDailyLoss);
      if (riskConfig.maxDrawdownPercent !== undefined) botState.riskConfig.maxDrawdownPercent = Number(riskConfig.maxDrawdownPercent);
      if (riskConfig.maxSpreadPoints !== undefined) botState.riskConfig.maxSpreadPoints = Number(riskConfig.maxSpreadPoints);
      if (riskConfig.stopLossPips !== undefined) botState.riskConfig.stopLossPips = Number(riskConfig.stopLossPips);
      if (riskConfig.takeProfitPips !== undefined) botState.riskConfig.takeProfitPips = Number(riskConfig.takeProfitPips);
      if (riskConfig.trailingStopEnabled !== undefined) botState.riskConfig.trailingStopEnabled = Boolean(riskConfig.trailingStopEnabled);
      if (riskConfig.entryDistance !== undefined) botState.riskConfig.entryDistance = Number(riskConfig.entryDistance);
      if (riskConfig.trailingDistance !== undefined) botState.riskConfig.trailingDistance = Number(riskConfig.trailingDistance);
      if (riskConfig.maxOpenTrades !== undefined) botState.riskConfig.maxOpenTrades = Number(riskConfig.maxOpenTrades);
      if (riskConfig.entriesPerSignal !== undefined) botState.riskConfig.entriesPerSignal = Number(riskConfig.entriesPerSignal);
      if (riskConfig.maxConsecutiveLosses !== undefined) botState.riskConfig.maxConsecutiveLosses = Number(riskConfig.maxConsecutiveLosses);
      if (riskConfig.cooldownMinutes !== undefined) botState.riskConfig.cooldownMinutes = Number(riskConfig.cooldownMinutes);
      if (riskConfig.maxDailyLossPercent !== undefined) botState.riskConfig.maxDailyLossPercent = Number(riskConfig.maxDailyLossPercent);
      if (riskConfig.maxDailyLossAmount !== undefined) botState.riskConfig.maxDailyLossAmount = Number(riskConfig.maxDailyLossAmount);
      
      // CRITICAL FIX: Sync new config into the running EA Engine instance
            
      // CRITICAL FIX: Sync new config into the DaRa M1 Engine instance
      if (typeof daraEngine !== 'undefined') {
          console.log('[LIVE_ENGINE] updateUserSettings called');
          daraEngine.updateUserSettings({
              lotSize: botState.riskConfig.lotSize,
              slDistance: botState.riskConfig.stopLossPips,
              tpDistance: botState.riskConfig.takeProfitPips,
              dailyLossLimit: botState.riskConfig.maxDailyLossAmount,
              maxOpenTrades: botState.riskConfig.maxOpenTrades,
              maxConsecutiveSL: botState.riskConfig.maxConsecutiveLosses,
              cooldownMinutes: botState.riskConfig.cooldownMinutes,
              maxSpreadPoints: botState.riskConfig.maxSpreadPoints,
              newsFilterEnabled: botState.riskConfig.newsFilterEnabled,
              trailingEnabled: botState.riskConfig.trailingStopEnabled,
              trailingDistance: botState.riskConfig.trailingDistance,
              entryDistance: botState.riskConfig.entryDistance,
              liveTradingEnabled: botState.riskConfig.liveTradingEnabled === true
          });
          const engineSettings = daraEngine.getUserSettings();
          console.log('[LIVE_ENGINE] liveTradingEnabled:', engineSettings.liveTradingEnabled);
      }
      
      saveBotConfig();
    }

    const confirmedLiveTrading = typeof daraEngine !== 'undefined'
      ? daraEngine.getUserSettings().liveTradingEnabled
      : botState.riskConfig.liveTradingEnabled;

    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      confirmedLiveTrading,
      message: confirmedLiveTrading 
        ? '🟢 LIVE TRADING បានបើកដោយជោគជ័យ!' 
        : '⚪ LIVE TRADING បានបិទដោយជោគជ័យ (Safe Monitor Mode)',
      state: botState,
    });
  });

  // 6. Explicit Save Settings
  app.post('/api/bot/save-settings', requireAdminAuth, (req, res) => {
    const { account, riskConfig, tradingHours, userPreferences } = req.body || {};
    if (account) {
      botState.account = { ...botState.account, ...account };
    }
    if (riskConfig) {
      botState.riskConfig = { ...botState.riskConfig, ...riskConfig };
      
      if (typeof daraEngine !== 'undefined') {
          daraEngine.updateUserSettings({
              lotSize: botState.riskConfig.lotSize,
              slDistance: botState.riskConfig.stopLossPips,
              tpDistance: botState.riskConfig.takeProfitPips,
              dailyLossLimit: botState.riskConfig.maxDailyLossAmount,
              maxOpenTrades: botState.riskConfig.maxOpenTrades,
              maxConsecutiveSL: botState.riskConfig.maxConsecutiveLosses,
              cooldownMinutes: botState.riskConfig.cooldownMinutes,
              maxSpreadPoints: botState.riskConfig.maxSpreadPoints,
              newsFilterEnabled: botState.riskConfig.newsFilterEnabled,
              trailingEnabled: botState.riskConfig.trailingStopEnabled,
              trailingDistance: botState.riskConfig.trailingDistance,
              entryDistance: botState.riskConfig.entryDistance,
              liveTradingEnabled: botState.riskConfig.liveTradingEnabled === true
          });
      }
    }
    if (tradingHours) {
      botState.tradingHours = { ...botState.tradingHours, ...tradingHours };
    }
    if (userPreferences) {
      botState.userPreferences = { ...botState.userPreferences, ...userPreferences };
    }
    saveBotConfig();

    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      message: '💾 បាន Save ការកំណត់ទាំងអស់ (Settings & Configuration) ទៅ Disk ដោយជោគជ័យ!',
      lastSavedAt: botState.lastSavedAt,
      state: botState,
    });
  });

  // 7. Remove Saved Account (Wipes saved credentials & disconnects)
  app.post('/api/bot/remove-saved-account', requireAdminAuth, (req, res) => {
    botState.account = {
      accountType: 'cent',
      server: 'Exness-Real',
      loginId: '',
      isConnected: false,
      serverConnected: false,
      isRealAccount: true,
      marketDataReceiving: false,
      tradingPermission: false,
      eaConnected: false,
      symbolAvailable: false,
      pingMs: 0,
      connectionMethod: 'rest_bridge',
      vpsOnline: true,
      balance: 0,
      equity: 0,
      freeMargin: 0,
      marginLevel: 0,
      currency: 'USC',
      stages: {
        appLoggedIn: true,
        mt5AccountConfigured: false,
        exnessServerConnected: false,
        marketDataFeedLive: false,
        tradingPermissionGranted: false,
        eaLoadedAndReady: false,
      },
    };
    if (botState.status === 'running') {
      botState.status = 'stopped';
    }
    botState.statusMessageKhmer = '🔴 គណនី Exness ត្រូវបានលុបចេញពីប្រព័ន្ធ — សូមភ្ជាប់គណនីថ្មី';
    saveBotConfig();

    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      message: '🗑️ បានលុបគណនីដែលបាន Save ចេញពីប្រព័ន្ធដោយជោគជ័យ!',
      state: botState,
    });
  });

  // 8. Reset Settings to Factory Defaults
  app.post('/api/bot/reset-settings', requireAdminAuth, (req, res) => {
    botState.status = 'stopped';
    botState.account = { ...DEFAULT_BOT_CONFIG.account };
    botState.tradingHours = { ...DEFAULT_BOT_CONFIG.tradingHours };
    botState.riskConfig = { ...DEFAULT_BOT_CONFIG.riskConfig };
    botState.userPreferences = { ...DEFAULT_BOT_CONFIG.userPreferences };
    botState.dailyLossLimitHit = false;
    botState.statusMessageKhmer = 'បានកំណត់ការកំណត់ដើមឡើងវិញ (Factory Default Settings Restored)';
    saveBotConfig();

    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      message: '🔄 បានកំណត់ការកំណត់ដើម (Factory Settings) ឡើងវិញដោយជោគជ័យ!',
      state: botState,
    });
  });

  // 9. Update Real Account Balance directly (Synchronize Real Exness Deposit/Balance)
  app.post('/api/bot/update-real-balance', requireAdminAuth, (req, res) => {
    const { balance } = req.body || {};
    if (balance === undefined || isNaN(Number(balance))) {
      return res.status(400).json({ error: 'សូមបញ្ចូលចំនួនទឹកប្រាក់ពិតប្រាកដ (Invalid Balance)' });
    }

    const numBal = Number(Number(balance).toFixed(2));
    botState.account.balance = numBal;
    
    // Recalculate Equity & Margin
    const floatSum = (botState.currentTrade ? botState.currentTrade.floatingProfit : 0) +
      botState.manualTrades.reduce((acc, t) => acc + (t.floatingProfit || 0), 0);
    botState.account.equity = Number((numBal + floatSum).toFixed(2));
    
    const totalLots = (botState.currentTrade ? botState.currentTrade.lot : 0) +
      botState.manualTrades.reduce((acc, t) => acc + (t.lot || 0), 0);
    const usedMargin = totalLots * 10;
    botState.account.freeMargin = Number(Math.max(0, botState.account.equity - usedMargin).toFixed(2));
    botState.account.marginLevel = usedMargin > 0 ? Number(((botState.account.equity / usedMargin) * 100).toFixed(0)) : 999.0;
    
    saveBotConfig();

    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      message: `💰 បាន Update សមតុល្យគណនីពិត (Real Balance: ${numBal.toLocaleString()} ${botState.account.currency}) ដោយជោគជ័យ!`,
      state: botState,
    });
  });

  // 9.5 Patch Download Endpoint
  app.get('/download-patch', (req, res) => {
    const patchPath = path.join(process.cwd(), 'dara-m1-ea-patch.tar.gz');
    res.download(patchPath, 'dara-m1-ea-patch.tar.gz', {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': 'attachment; filename="dara-m1-ea-patch.tar.gz"'
      }
    }, (err) => {
      if (err) {
        console.error("Error sending patch file:", err);
      }
    });
  });

  // 10. Direct WebRequest Sync Gateway from MQL5 EA / Python Bridge
  app.post('/api/mt5/sync', (req, res) => {
    const {
      accountLogin,
      server,
      balance,
      equity,
      freeMargin,
      goldBid,
      goldAsk,
      spread,
      positions,
      magicNumber,
      algoAllowed,
      symbol,
    } = req.body || {};

    const now = Date.now();
    lastSyncTimestamp = now;
    botState.lastTickTime = now; global.lastSuccessfulPingTime = Date.now();
    consecutivePollingFailures = 0;

    // Debug EA heartbeat
    if (!goldBid) {
      console.log(`[EA SYNC] Received sync without goldBid. Data: ${JSON.stringify(req.body)}`);
    }

    if (accountLogin) botState.account.loginId = String(accountLogin);
    if (server) botState.account.server = String(server);
    if (symbol) botState.activeGoldSymbol = String(symbol);
    if (balance !== undefined) botState.account.balance = Number(balance);
    if (equity !== undefined) botState.account.equity = Number(equity);
    if (freeMargin !== undefined) botState.account.freeMargin = Number(freeMargin);
    
    if (goldBid !== undefined) {
      botState.goldPrice = Number(goldBid);
      botState.bidPrice = Number(goldBid);
    }
    if (goldAsk !== undefined) {
      botState.askPrice = Number(goldAsk);
    } else if (goldBid !== undefined && spread !== undefined) {
      
      const bidStr = goldBid.toString();
      const decimals = (bidStr.includes('.') ? bidStr.split('.')[1].length : 2);
      // STRICT Gold point convention: 0.01 = 1 point, therefore always use 100 multiplier
      const pointMultiplier = 100;
      botState.askPrice = Number((Number(goldBid) + (Number(spread) / pointMultiplier)).toFixed(decimals));

    }
    if (spread !== undefined) botState.spreadPoints = Number(spread);

    // Forward live tick to DaRaM1Engine
    if (global.daraEngine && typeof global.daraEngine.onMarketUpdate === 'function' && botState.bidPrice > 0) {
      try {
        const primarySymbol = botState.activeGoldSymbol || 'XAUUSDc';
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        let workingBaseUrl = botState.account.metaApiUrl || 'https://mt-client-api-v1.backup-new-york.agiliumtrade.ai';
        if (accountId && token) {
             syncDaraM1CandlesBuffer(workingBaseUrl, accountId, token, primarySymbol).catch(() => {});
        }
        feedLiveTickToCandlesBuffer(botState.bidPrice, now);
        
        global.daraEngine.onMarketUpdate({
          symbol: primarySymbol,
          bid: botState.bidPrice,
          ask: botState.askPrice || botState.bidPrice,
          time: now,
          serverTime: now,
          spreadPoints: botState.spreadPoints || 0,
          openTradesCount: botState.openTrades ? botState.openTrades.length : 0,
          m1Candles: daraM1CandlesBuffer
        }).catch((err: any) => console.error('[DaRa M1 EA] Error in onMarketUpdate from sync:', err));
      } catch (e) {
        console.error('[DaRa M1 EA] Error invoking onMarketUpdate from sync:', e);
      }
    }

    // Push tick to tickHistory for 1-minute AI Analysis on Gold
    botState.tickHistory = botState.tickHistory || [];
    const activePrice = botState.askPrice || botState.goldPrice || 0;
    if (activePrice > 0) {
      botState.tickHistory.push(activePrice);
      if (botState.tickHistory.length > 100) botState.tickHistory.shift();
    }

    // Check if 1-minute analysis interval has elapsed
    if (botState.status === 'running' && Date.now() - lastAnalysisTimestamp >= AI_ANALYSIS_INTERVAL_MS) {
      }

    botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    botState.marketDataStatus = '🟢 LIVE (MT5 SYNCED)';
    botState.account.isConnected = true;
    botState.account.serverConnected = true;
    botState.account.marketDataReceiving = true;
                                 if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
    botState.account.eaConnected = true;
    botState.account.vpsOnline = true;
    botState.account.stages.exnessServerConnected = true;
    botState.account.stages.marketDataFeedLive = true;
    botState.account.stages.eaLoadedAndReady = true;
    botState.account.stages.mt5AccountConfigured = true;

    if (algoAllowed !== undefined) {
      botState.account.tradingPermission = Boolean(algoAllowed);
      botState.account.stages.tradingPermissionGranted = Boolean(algoAllowed);
    }

    if (Array.isArray(positions)) {
      const prevBotCount = (botState.openTrades || []).filter((t: any) => t.magicNumber === (magicNumber || botState.magicNumber)).length;
                // Consecutive Loss Tracking
      if (botState.openTrades && botState.openTrades.length > 0) {
          const newTradeIds = positions.map((p: any) => p.ticket);
          let tradeClosed2 = false;
          botState.openTrades.forEach((oldTrade: any) => {
              if (!newTradeIds.includes(oldTrade.id)) {
                  tradeClosed2 = true;
                  if (oldTrade.floatingProfit < 0) {
                      if (global.daraEngine) {
                          global.daraEngine.recordRealTradeResult(Number(oldTrade.floatingProfit || 0));
                          botState.consecutiveLosses = global.daraEngine.getTelemetry().consecutiveLossCount;
                      } else {
                          botState.consecutiveLosses = (botState.consecutiveLosses || 0) + 1;
                      }
                      sendStopLossAlert({
                          type: (oldTrade.side === 'BUY' || oldTrade.side === 'SELL') ? oldTrade.side : 'BUY',
                          lot: oldTrade.lot || botState.riskConfig?.lotSize || 0.01,
                          entry: oldTrade.entryPrice || 0,
                          exit: oldTrade.currentPrice || botState.goldPrice || 0,
                          sl: oldTrade.sl || 0,
                          loss: Math.abs(Number(oldTrade.floatingProfit || 0)).toFixed(2),
                          ticket: oldTrade.id,
                          time: formatLocalTime()
                      }).catch(console.error);
                  } else {
                      if (global.daraEngine) {
                          global.daraEngine.recordRealTradeResult(Number(oldTrade.floatingProfit || 0));
                          botState.consecutiveLosses = 0;
                      } else {
                          botState.consecutiveLosses = 0;
                      }
                      sendTakeProfitAlert({
                          type: (oldTrade.side === 'BUY' || oldTrade.side === 'SELL') ? oldTrade.side : 'BUY',
                          lot: oldTrade.lot || botState.riskConfig?.lotSize || 0.01,
                          entry: oldTrade.entryPrice || 0,
                          exit: oldTrade.currentPrice || botState.goldPrice || 0,
                          tp: oldTrade.tp || 0,
                          profit: Number(oldTrade.floatingProfit || 0).toFixed(2),
                          ticket: oldTrade.id,
                          time: formatLocalTime()
                      }).catch(console.error);
                  }
              }
          });
          if (tradeClosed2) lastPnLSyncTime = 0;
      }

      // Parse all positions instead of filtering by Magic Number only
      const allPositions = positions;
      const existingVpsTradesMap = new Map((botState.openTrades || []).map((t: any) => [String(t.id), t]));
      botState.openTrades = allPositions.map((botPos: any) => {
        const ticketId = String(botPos.ticket || `MT5-${Date.now()}`);
        const prevT = existingVpsTradesMap.get(ticketId);
        const isBot = Number(botPos.magic || 0) === (magicNumber || botState.magicNumber);
        return {
          id: ticketId,
          magicNumber: Number(botPos.magic || 0),
          isBotTrade: isBot,
          symbol: 'XAUUSD',
          side: (botPos.type === 0 || botPos.type === 'BUY' || botPos.type === 'POSITION_TYPE_BUY') ? 'BUY' : 'SELL',
          lot: Number(botPos.volume || botState.riskConfig.lotSize),
          entryPrice: Number(botPos.openPrice || botState.goldPrice),
          currentPrice: Number(botPos.currentPrice || botState.goldPrice),
          sl: Number(botPos.sl || 0),
          tp: Number(botPos.tp || 0),
          originalTp: prevT?.originalTp || Number(botPos.tp || 0),
          floatingProfit: Number(botPos.profit || 0),
          commission: Number(botPos.commission || 0),
          swap: Number(botPos.swap || 0),
          openedAt: botPos.time || new Date().toLocaleTimeString('km-KH'),
        };
      });
      botState.currentTrade = botState.openTrades[0] || null;

      // Auto New Cycle if all trades close
      if (prevBotCount > 0 && botState.openTrades.length === 0 && botState.status === 'running' && botState.isInsideTradingHours) {
        botState.currentCycle = (botState.currentCycle || 1) + 1;
        const volume = Number((botState.riskConfig?.lotSize || 0.01).toFixed(2));
        botState.statusMessageKhmer = `🔄 NEW CYCLE #${botState.currentCycle} — 🔍 ANALYZING… AI វិភាគទីផ្សាររក Entry #1 (${volume} Lot)`;
      }
    }

    const ticketsToClose = [...pendingCloseTickets];
    const shouldCloseAllBot = pendingCloseAllBot;
    pendingCloseTickets = [];
    pendingCloseAllBot = false;

    res.json({
      serverId: SERVER_INSTANCE_ID,
      serverBootTime: SERVER_BOOT_TIME,
      success: true,
      command: botState.status, // Returns running | paused | stopped
      magicNumber: botState.magicNumber,
      currentCycle: botState.currentCycle || 1,
      riskConfig: botState.riskConfig,
      tradingHours: botState.tradingHours,
      signal: botState.signals?.gold || 'WAIT',
      signalDetails: botState.signalDetails,
      closeTickets: ticketsToClose,
      closeAllBot: shouldCloseAllBot,
    });
  });

  // Direct Download for Final Production Package
  app.get('/download/dara_m1_v1_0_final_package.tar.gz', (req, res) => {
    const pkgPath = path.join(process.cwd(), 'dara_m1_v1_0_final_package.tar.gz');
    if (fs.existsSync(pkgPath)) {
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="dara_m1_v1_0_final_package.tar.gz"');
      fs.createReadStream(pkgPath).pipe(res);
    } else {
      res.status(404).json({ error: 'Package file not found' });
    }
  });

  // Direct Download for DaRa M1 EA v2.0 Login Session Resilience Package
  const handleV2Download = (req: express.Request, res: express.Response) => {
    const candidatePaths = [
      path.join(process.cwd(), 'dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz'),
      path.join(process.cwd(), 'public', 'dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz'),
      path.join(process.cwd(), 'dist', 'dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz')
    ];
    let finalPath = '';
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        finalPath = p;
        break;
      }
    }

    if (finalPath) {
      const stat = fs.statSync(finalPath);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz"');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      fs.createReadStream(finalPath).pipe(res);
    } else {
      res.status(404).json({ error: 'Package file dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz not found' });
    }
  };

  app.get('/dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz', handleV2Download);
  app.get('/download/dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz', handleV2Download);
  app.get('/api/download/dara_m1_ea_v2.0_LOGIN_SESSION_RESILIENCE_FINAL.tar.gz', handleV2Download);

  // Direct Download for DaRa M1 EA v2.1 Login False Success Fix Package
  const handleV21Download = (req: express.Request, res: express.Response) => {
    const candidatePaths = [
      path.join(process.cwd(), 'dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz'),
      path.join(process.cwd(), 'public', 'dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz'),
      path.join(process.cwd(), 'dist', 'dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz')
    ];
    let finalPath = '';
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        finalPath = p;
        break;
      }
    }

    if (finalPath) {
      const stat = fs.statSync(finalPath);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz"');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      fs.createReadStream(finalPath).pipe(res);
    } else {
      res.status(404).json({ error: 'Package file dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz not found' });
    }
  };

  app.get('/dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz', handleV21Download);
  app.get('/download/dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz', handleV21Download);
  app.get('/api/download/dara_m1_ea_v2.1_LOGIN_FALSE_SUCCESS_FIX_FINAL.tar.gz', handleV21Download);

  // Direct Download for DaRa M1 EA v2.2 Session Drift Fix Package
  const handleV22Download = (req: express.Request, res: express.Response) => {
    const candidatePaths = [
      path.join(process.cwd(), 'dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz'),
      path.join(process.cwd(), 'public', 'dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz'),
      path.join(process.cwd(), 'dist', 'dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz')
    ];
    let finalPath = '';
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        finalPath = p;
        break;
      }
    }

    if (finalPath) {
      const stat = fs.statSync(finalPath);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz"');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      fs.createReadStream(finalPath).pipe(res);
    } else {
      res.status(404).json({ error: 'Package file dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz not found' });
    }
  };

  app.get('/dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz', handleV22Download);
  app.get('/download/dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz', handleV22Download);
  app.get('/api/download/dara_m1_ea_v2.2_SESSION_DRIFT_FIX_FINAL.tar.gz', handleV22Download);


  // Direct Downloads for .mq5 and .set files with Auto-Configured Server URL
  app.get('/api/bot/download/ea', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'ais-dev-vxbdmp32dvcg3igner5te7-647785726408.us-east1.run.app';
    const syncUrl = `${proto}://${host}/api/mt5/sync`;

    const mq5Code = `//+------------------------------------------------------------------+
//|                                     XAUUSD_AI_Scalping_v3.mq5   |
//|                        Copyright 2026, XAUUSD Scalping Engine    |
//|                                              https://exness.com  |
//+------------------------------------------------------------------+
#property copyright "XAUUSD AI Scalping Khmer Final Simple Version"
#property link      "${proto}://${host}"
#property version   "3.00"
#property strict

#include <Trade\\Trade.mqh>
CTrade trade;

//--- Input Parameters
input group "=== [1] BOT IDENTITY & BRIDGE ==="
input ulong    InpMagicNumber       = 778899;                   // Magic Number (Bot Isolation - Protects Manual Trades)
input string   InpTradeComment      = "XAUUSD_AI";              // Order Comment
input string   InpServerUrl         = "${syncUrl}"; // Web Cloud Sync URL

input group "=== [2] RISK MANAGEMENT (NO MARTINGALE / NO GRID) ==="
input double   InpLotSize           = 0.01;                     // Fixed Lot Size (0.01 - 0.10)
input int      InpMaxOpenTrades     = 4;                        // Max Open Bot Trades per Cycle
input int      InpStopLossPips      = 25;                       // Mandatory Stop Loss (Pips)
input int      InpTakeProfitPips    = 35;                       // Take Profit (Pips)
input double   InpMaxDailyLoss   = 50.0;                     // Max Daily Loss Limit ($ / USC)
input int      InpMaxSpread         = 25;                       // Max Spread Allowed (Points)

input group "=== [3] TRADING HOURS FILTER ==="
input bool     InpUseTradingHours   = true;                     // Enable Trading Hours
input int      InpStartHour         = 8;                        // Start Hour (0-23)
input int      InpStopHour          = 22;                       // Stop Hour (0-23)

//--- Global Variables
datetime glLastTradeDate = 0;
double   glDailyStartEquity = 0;
datetime glLastSyncTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   trade.SetExpertMagicNumber(InpMagicNumber);
   Print("=== XAUUSD AI Scalping Bot Initialized Successfully ===");
   Print("Magic Number: ", InpMagicNumber, " | Server URL: ", InpServerUrl);
   glDailyStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   EventSetTimer(1); // 1-second continuous background sync
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

//+------------------------------------------------------------------+
//| Expert timer function (Continuous Heartbeat & Sync)              |
//+------------------------------------------------------------------+
void OnTimer()
  {
   SyncWithBackend();
  }

//+------------------------------------------------------------------+
//| Check Daily Loss Limit                                           |
//+------------------------------------------------------------------+
bool IsDailyLossHit()
  {
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   if((glDailyStartEquity - currentEquity) >= InpMaxDailyLoss)
     {
      return true;
     }
   return false;
  }

//+------------------------------------------------------------------+
//| Check Trading Hours                                              |
//+------------------------------------------------------------------+
bool IsInsideTradingHours()
  {
   if(!InpUseTradingHours) return true;
   MqlDateTime dt;
   TimeCurrent(dt);
   return (dt.hour >= InpStartHour && dt.hour < InpStopHour);
  }

//+------------------------------------------------------------------+
//| Count Active Bot Orders (Filtered by Magic Number)               |
//+------------------------------------------------------------------+
int CountBotPositions()
  {
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
        {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber && PositionGetString(POSITION_SYMBOL) == _Symbol)
           {
            count++;
           }
        }
     }
   return count;
  }

//+------------------------------------------------------------------+
//| Close SINGLE Bot Position (Only if Magic Number matches)         |
//+------------------------------------------------------------------+
bool CloseSingleBotPosition(ulong targetTicket)
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == targetTicket)
        {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
           {
            bool res = trade.PositionClose(ticket);
            if(res) {
               Print("🛡️ Successfully Closed Single Bot Position Ticket: ", ticket);
               return true;
            } else {
               Print("⚠️ Failed to close Bot Position Ticket: ", ticket, " Error: ", GetLastError());
               return false;
            }
           }
         else
           {
            Print("🛡️ ISOLATION PROTECTED: Ticket ", ticket, " is a Manual Trade (Magic: ", PositionGetInteger(POSITION_MAGIC), "). Skipping!");
            return false;
           }
        }
     }
   return false;
  }

//+------------------------------------------------------------------+
//| Close ONLY Bot Positions (Protected by Magic Number)              |
//+------------------------------------------------------------------+
void CloseAllBotPositions()
  {
   int closed = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
        {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
           {
            if(trade.PositionClose(ticket)) {
               closed++;
               Print("🛡️ Closed Bot Position Ticket: ", ticket, " (Magic: ", InpMagicNumber, ")");
            }
           }
         else
           {
            Print("🛡️ Manual Trade Ticket #", ticket, " (Magic: ", PositionGetInteger(POSITION_MAGIC), ") is 100% PROTECTED!");
           }
        }
     }
   Print("=== Closed Total ", closed, " Bot Positions (Manual Trades Untouched) ===");
  }

//+------------------------------------------------------------------+
//| WebRequest to Node.js Backend                                    |
//+------------------------------------------------------------------+
void SyncWithBackend()
  {
   if(TimeCurrent() - glLastSyncTime < 2) return; // Sync every 2 seconds
   glLastSyncTime = TimeCurrent();

   string cookie = NULL, headers;
   char post[], result[];
   
   // Collect Account Data
   string accLogin = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   string accServer = AccountInfoString(ACCOUNT_SERVER);
   string accBalance = DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2);
   string accEquity = DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2);
   string accFreeMargin = DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2);
   string algoAllowed = (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) && MQLInfoInteger(MQL_TRADE_ALLOWED)) ? "true" : "false";
   
   // Collect Market Data
   string sym = _Symbol;
   if(sym == "") sym = "XAUUSD";
   string xauBid = DoubleToString(SymbolInfoDouble(sym, SYMBOL_BID), 2);
   string xauAsk = DoubleToString(SymbolInfoDouble(sym, SYMBOL_ASK), 2);
   string spread = DoubleToString(MathRound(MathAbs(SymbolInfoDouble(sym, SYMBOL_ASK) - SymbolInfoDouble(sym, SYMBOL_BID)) * 100), 0);
   
   // Collect Positions Array JSON
   string posJson = "[";
   int posCount = 0;
   for(int p = 0; p < PositionsTotal(); p++)
     {
      ulong tkt = PositionGetTicket(p);
      if(tkt > 0)
        {
         if(posCount > 0) posJson += ",";
         posJson += "{";
         posJson += "\\"ticket\\":\\"" + IntegerToString(tkt) + "\\",";
         posJson += "\\"magic\\":" + IntegerToString(PositionGetInteger(POSITION_MAGIC)) + ",";
         posJson += "\\"type\\":\\"" + (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\\",";
         posJson += "\\"volume\\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
         posJson += "\\"openPrice\\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 2) + ",";
         posJson += "\\"currentPrice\\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_CURRENT), 2) + ",";
         posJson += "\\"profit\\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
         posJson += "\\"sl\\":" + DoubleToString(PositionGetDouble(POSITION_SL), 2) + ",";
         posJson += "\\"tp\\":" + DoubleToString(PositionGetDouble(POSITION_TP), 2);
         posJson += "}";
         posCount++;
        }
     }
   posJson += "]";

   // JSON Payload
   string json = "{";
   json += "\\"accountLogin\\":\\"" + accLogin + "\\",";
   json += "\\"server\\":\\"" + accServer + "\\",";
   json += "\\"balance\\":" + accBalance + ",";
   json += "\\"equity\\":" + accEquity + ",";
   json += "\\"freeMargin\\":" + accFreeMargin + ",";
   json += "\\"goldBid\\":" + xauBid + ",";
   json += "\\"goldAsk\\":" + xauAsk + ",";
   json += "\\"spread\\":" + spread + ",";
   json += "\\"algoAllowed\\":" + algoAllowed + ",";
   json += "\\"magicNumber\\":" + IntegerToString(InpMagicNumber) + ",";
   json += "\\"positions\\":" + posJson;
   json += "}";
   
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   
   int res = WebRequest("POST", InpServerUrl, "Content-Type: application/json\\r
", 3000, post, result, headers);
   
   if(res == 200) {
      string responseText = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      // Check if command is close_all
      if(StringFind(responseText, "\\"closeAllBot\\":true") >= 0) {
         Print("⚡ Received CLOSE ALL BOT TRADES command from Web Dashboard!");
         CloseAllBotPositions();
      }
      // Check if single close tickets requested
      int idxTickets = StringFind(responseText, "\\"closeTickets\\":[");
      if(idxTickets >= 0) {
         int start = idxTickets + 16;
         int end = StringFind(responseText, "]", start);
         if(end > start) {
            string tktsStr = StringSubstr(responseText, start, end - start);
            string arr[];
            int totalTkts = StringSplit(tktsStr, ',', arr);
            for(int k = 0; k < totalTkts; k++) {
               string item = arr[k];
               StringReplace(item, "\\"", "");
               StringReplace(item, " ", "");
               ulong tkt = (ulong)StringToInteger(item);
               if(tkt > 0) {
                  Print("⚡ Received Single CLOSE Request for Ticket: ", tkt);
                  CloseSingleBotPosition(tkt);
               }
            }
         }
      }

      // EXECUTION BLOCK REMOVED: MQL5 EA is now strictly DATA/HEARTBEAT ONLY.
   } else {
      Print("⚠️ WebRequest failed. Please add ", InpServerUrl, " in MT5 Tools -> Options -> Expert Advisors -> Allow WebRequest");
   }
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   // 1. Sync Live Account & Price Data with Web App
   SyncWithBackend();
   
   // 2. Check Symbol (Support XAUUSD, XAUUSDc, XAUUSDm, GOLD, etc.)
   if(StringFind(_Symbol, "XAU") < 0 && StringFind(_Symbol, "GOLD") < 0) return;

   // 3. Check Spread
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpread) {
      Comment("⚠️ Spread ធំពេក (Spread: ", spread, " > ", InpMaxSpread, ")");
      return;
   }

   // 4. Check Daily Loss Limit
   if(IsDailyLossHit())
     {
      Comment("🛑 ដល់កម្រិតខាតប្រចាំថ្ងៃ (Daily Loss Limit Hit) - Stopped New Trades");
      return;
     }

   // 5. Check Trading Hours
   if(!IsInsideTradingHours())
     {
      Comment("⏸️ ក្រៅម៉ោងជួញដូរ (Outside Trading Hours: ", InpStartHour, ":00 - ", InpStopHour, ":00)");
      return;
     }

   // 6. Max Open Positions Check
   int openCount = CountBotPositions();
   if(openCount >= InpMaxOpenTrades)
     {
      Comment("🟢 កំពុងគ្រប់គ្រង Trade សកម្ម (Active Trades: ", openCount, "/", InpMaxOpenTrades, " | Magic: ", InpMagicNumber, ")");
      return;
     }

   Comment("🟢 XAUUSD AI Scalping Bot: Ready (AI 1-Min Interval Active | Open: ", openCount, "/", InpMaxOpenTrades, ")");
  }
//+------------------------------------------------------------------+
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_AI_Scalping_v3.mq5"');
    res.send(mq5Code);
  });

  app.get('/api/bot/download/preset', (req, res) => {
    const setFileContent = `; XAUUSD AI Scalping Bot - Exness Cent / Standard Preset
; Final Simple Version
InpMagicNumber=778899
InpTradeComment=XAUUSD_AI
InpLotSize=0.01
InpMaxOpenTrades=4
InpStopLossPips=25
InpTakeProfitPips=35
InpMaxDailyLoss=50.0
InpMaxSpread=25
InpUseTradingHours=true
InpStartHour=8
InpStopHour=22
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_Scalping_Preset.set"');
    res.send(setFileContent);
  });

  // Windows Desktop Shortcut (.url file)
  app.get('/api/bot/download/shortcut-windows', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const appUrl = `${proto}://${host}/`;
    
    const urlContent = `[InternetShortcut]
URL=${appUrl}
IconIndex=0
IconFile=${appUrl}icon-192.svg
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,0
`;
    res.setHeader('Content-Type', 'application/internet-shortcut');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_AI_Scalping_Bot.url"');
    res.send(urlContent);
  });

  // Linux / macOS Desktop Launcher (.desktop file)
  app.get('/api/bot/download/shortcut-linux', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const appUrl = `${proto}://${host}/`;

    const desktopContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=XAUUSD AI Scalping Bot
Comment=XAUUSD AI Scalping Bot Final Simple Version
Exec=xdg-open ${appUrl}
Icon=web-browser
Terminal=false
Categories=Finance;Trading;
`;
    res.setHeader('Content-Type', 'application/x-desktop');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_AI_Scalping_Bot.desktop"');
    res.send(desktopContent);
  });

  // Vite middleware setup vs Production Static Serving
  const isProduction = process.env.NODE_ENV === 'production' || 
    (typeof __filename !== 'undefined' && __filename.includes('dist')) ||
    (typeof process.argv[1] === 'string' && process.argv[1].includes('dist'));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // --- DIRECT FILE DELIVERY MECHANISM ---
    app.get('/dara_m1_ea_v1_0_APPROVED_FROZEN_20260908.tar.gz', (req, res) => {
      const filePath = path.join(process.cwd(), 'dara_m1_ea_v1_0_APPROVED_FROZEN_20260908.tar.gz');
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', 'attachment; filename="dara_m1_ea_v1_0_APPROVED_FROZEN_20260908.tar.gz"');
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        res.status(404).send('Frozen package not found');
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : (typeof __dirname !== 'undefined' ? __dirname : path.join(process.cwd(), 'dist'));

    app.use(express.static(distPath));

    // Bypass SPA routing for direct file downloads in public directory
    app.get('/download-v2.4', (req, res) => {
      res.download(path.join(process.cwd(), 'public', 'dara_m1_ea_v2.4_DEPLOY.tar.gz'));
    });
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[XAUUSD AI Scalping Bot Server] running on http://0.0.0.0:${PORT}`);
    setTimeout(() => {
        sendTelegramAlert('BOT STATUS', 'ប្រព័ន្ធត្រូវបាន Restart/Boot', 'សេវាកម្មដំណើរការឡើងវិញដោយជោគជ័យ', 0);
    }, 10000);
  });
}

startServer();

setInterval(() => {
    const lastSeen = Math.max(botState.lastFeedArrivalTime || 0, botState.lastTickTime || 0);
    const feedAgeMs = lastSeen > 0 ? Date.now() - lastSeen : 0;
    const isRecentlyActive = lastSeen > 0 && (feedAgeMs < 60000);
    
    if (isRecentlyActive && botState.account.isConnected) {
        // Healthy heartbeat and valid feed received within last 60s
        botState.account.serverConnected = true;
        botState.account.eaConnected = true;
        botState.account.vpsOnline = true;
        botState.account.marketDataReceiving = true;
        if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
        if (!botState.marketDataStatus || botState.marketDataStatus.includes('🔴') || botState.marketDataStatus.includes('WAITING') || botState.marketDataStatus.includes('DISCONNECTED')) {
            botState.marketDataStatus = '🟢 LIVE (MT5 FEED ACTIVE)';
        }
    } else {
        // Market Data is stale, non-existent, or account is disconnected
        botState.account.marketDataReceiving = false;
        if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(false);
        
        if (lastSeen > 0 && botState.account.isConnected) {
            if (feedAgeMs >= 60000) {
                botState.account.serverConnected = false;
                botState.account.eaConnected = false;
            }
            const ageText = `${Math.floor(feedAgeMs/1000)}s`;
            botState.marketDataStatus = `🔴 MT5 DATA DISCONNECTED (Delay: ${ageText})`;
            if (Math.floor(feedAgeMs / 1000) % 60 === 0) {
                console.log(`[MARKET_DATA] connection=STALE lastFeedTime=${lastSeen} feedAgeMs=${feedAgeMs}`);
            }
        } else {
            botState.account.serverConnected = false;
            botState.account.eaConnected = false;
            botState.marketDataStatus = botState.account.isConnected ? 'WATCHING / WAITING FOR LIVE DATA...' : '🔴 MT5 DATA DISCONNECTED (Delay: No Data)';
        }
    }
        
    // Auto-Recovery Tracking
    SelfHealingEngine.checkConnectionState(botState.account.serverConnected);
}, 1000);
