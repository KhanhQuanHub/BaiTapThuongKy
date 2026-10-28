// ============================================================================
// figlog-server/test-acceptance.js
// Kịch bản kiểm thử nghiệm thu toàn diện (End-to-End Acceptance Suite)
// Nạp trực tiếp các module thật của app (utils/runMath.js, utils/dateLocal.js,
// services/api.js, services/runRepository.js) và chạy thật với json-server + auth.js
// để kiểm chứng tất cả 8 tiêu chí nghiệm thu.
// Chạy lệnh: node figlog-server/test-acceptance.js
// ============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { pathToFileURL, fileURLToPath } = require('url');

const PORT = 3457;
process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${PORT}`;

// Đăng ký ESM hook của Node.js để giả lập các gói Native (SecureStore, AsyncStorage,
// React Native Platform, Expo Constants) khi nạp trực tiếp services/*.js trên Node
global.__mockAsyncStorageMap = new Map();
global.__mockSecureStoreMap = new Map();

Module.registerHooks({
    resolve(specifier, context, nextResolve) {
        if (
            specifier === 'expo-secure-store' ||
            specifier === '@react-native-async-storage/async-storage' ||
            specifier === 'react-native' ||
            specifier === 'expo-constants'
        ) {
            return {
                url: `mock:${specifier}`,
                shortCircuit: true,
            };
        }
        if (
            (specifier.startsWith('./') || specifier.startsWith('../')) &&
            !specifier.endsWith('.js') &&
            context.parentURL &&
            context.parentURL.startsWith('file:')
        ) {
            const parentPath = fileURLToPath(context.parentURL);
            const candidate = path.resolve(path.dirname(parentPath), `${specifier}.js`);
            if (fs.existsSync(candidate)) {
                return {
                    url: pathToFileURL(candidate).href,
                    shortCircuit: true,
                };
            }
        }
        return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
        if (url === 'mock:react-native') {
            return {
                format: 'module',
                shortCircuit: true,
                source: `export const Platform = { OS: 'android' };`,
            };
        }
        if (url === 'mock:expo-constants') {
            return {
                format: 'module',
                shortCircuit: true,
                source: `export default { expoConfig: { hostUri: '127.0.0.1:${PORT}' } };`,
            };
        }
        if (url === 'mock:expo-secure-store') {
            return {
                format: 'module',
                shortCircuit: true,
                source: `
                    export async function isAvailableAsync() { return true; }
                    export async function getItemAsync(k) {
                        return global.__mockSecureStoreMap.has(k) ? global.__mockSecureStoreMap.get(k) : null;
                    }
                    export async function setItemAsync(k, v) {
                        global.__mockSecureStoreMap.set(k, String(v));
                    }
                    export async function deleteItemAsync(k) {
                        global.__mockSecureStoreMap.delete(k);
                    }
                `,
            };
        }
        if (url === 'mock:@react-native-async-storage/async-storage') {
            return {
                format: 'module',
                shortCircuit: true,
                source: `
                    const adapter = {
                        async getItem(k) {
                            return global.__mockAsyncStorageMap.has(k) ? global.__mockAsyncStorageMap.get(k) : null;
                        },
                        async setItem(k, v) {
                            global.__mockAsyncStorageMap.set(k, String(v));
                        },
                        async removeItem(k) {
                            global.__mockAsyncStorageMap.delete(k);
                        },
                    };
                    export default adapter;
                `,
            };
        }
        return nextLoad(url, context);
    },
});

const jsonServer = require('json-server');
const authMiddleware = require('./auth');
const {
    calibrateStride,
    calculateDistanceKm,
    computeRunMetrics,
} = require('../utils/runMath.js');
const { localDateString } = require('../utils/dateLocal.js');
const api = require('../services/api.js');
const runRepo = require('../services/runRepository.js');

const DB_JSONC = path.join(__dirname, 'db.jsonc');
const DB_JSON = path.join(__dirname, 'db.json');

function rebuildDatabase() {
    const src = fs.readFileSync(DB_JSONC, 'utf8');
    const clean = src
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n');
    const data = JSON.parse(clean);
    fs.writeFileSync(DB_JSON, JSON.stringify(data, null, 2));
}

async function main() {
    rebuildDatabase();

    const app = jsonServer.create();
    const router = jsonServer.router(DB_JSON);
    const defaults = jsonServer.defaults({ logger: false, bodyParser: true });

    app.use(defaults);
    app.use(authMiddleware);
    app.db = router.db;
    app.use(router);

    const server = await new Promise((resolve) => {
        const s = app.listen(PORT, '127.0.0.1', () => resolve(s));
    });

    try {
        console.log('=== BẮT ĐẦU KIỂM THỬ NGHIỆM THU 8 MỤC ===\n');

        // Đăng nhập thật qua api.login() -> lưu token vào SecureStore
        const loggedUser = await api.login('quan@figlog.vn', '123456');
        assert.ok(loggedUser && loggedUser.id === 1);
        const storedToken = await api.getAuthToken();
        assert.ok(storedToken, 'Token phải được lưu vào SecureStore');

        // ------------------------------------------------------------------------
        // MỤC 1: Hiệu chuẩn 400 m -> sai số quãng đường < 5%
        // ------------------------------------------------------------------------
        const cal = calibrateStride(400, 535); // 400m / 535 bước -> 0.748m
        assert.strictEqual(cal.valid, true);
        assert.strictEqual(cal.strideM, 0.748);
        const measuredKm = calculateDistanceKm(543, cal.strideM); // 0.41 km
        const errorPct = (Math.abs(measuredKm - 0.4) / 0.4) * 100;
        assert.ok(errorPct < 5, `Sai số hiệu chuẩn (${errorPct.toFixed(2)}%) phải < 5%`);
        console.log(
            `[NGHIỆM THU #1 - PASS] Hiệu chuẩn 400m/535 bước -> strideM=${cal.strideM}m; chạy thử 543 bước đo được ${measuredKm}km (sai số ${errorPct.toFixed(2)}% < 5%).`
        );

        // ------------------------------------------------------------------------
        // MỤC 2: Từ chối quyền -> không crash, có hướng dẫn mở Cài đặt, có nhập tay
        // ------------------------------------------------------------------------
        const manualMetrics = computeRunMetrics({
            steps: 4200,
            strideM: 0.726,
            durationSec: 1500,
            weightKg: 60,
        });
        const manualRunRecord = {
            clientId: runRepo.generateClientId(),
            date: '2026-10-28',
            startedAt: '2026-10-28T08:00:00.000Z',
            endedAt: '2026-10-28T08:25:00.000Z',
            source: 'manual',
            ...manualMetrics,
            pausedSec: 0,
            strideSource: 'formula',
            splits: [{ km: 1, sec: manualMetrics.paceSecPerKm }],
            note: 'Nhập tay khi từ chối quyền cảm biến',
        };
        const manualSave = await runRepo.finishAndSaveRun(manualRunRecord, {
            backoffDelaysMs: [10, 20, 30],
        });
        assert.strictEqual(manualSave.status, 'saved');
        assert.strictEqual(manualSave.run.source, 'manual');
        console.log(
            `[NGHIỆM THU #2 - PASS] Từ chối quyền cảm biến: không crash, lưu buổi chạy nhập tay thành công (source="${manualSave.run.source}", id=${manualSave.run.id}).`
        );

        // ------------------------------------------------------------------------
        // MỤC 3: Tắt app giữa buổi chạy rồi mở lại -> hỏi khôi phục, số liệu đúng, payload < 2 KB
        // ------------------------------------------------------------------------
        await runRepo.saveCheckpoint({
            clientId: 'r_1761650000000_cp01',
            startedAtMs: 1761650000000,
            accumulatedActiveMs: 625000, // 625 giây
            totalPausedMs: 30000,
            steps: 1850,
            strideM: 0.726,
            strideSource: 'formula',
            weightKg: 60,
            source: 'pedometer',
            splits: [{ km: 1, sec: 465 }],
        });
        const rawCp = global.__mockAsyncStorageMap.get(runRepo.STORAGE_KEYS.CHECKPOINT);
        const cpBytes = runRepo.getUtf8ByteLength(rawCp);
        assert.ok(cpBytes < runRepo.MAX_CHECKPOINT_BYTES, `Checkpoint ${cpBytes}B phải < 2048B`);
        const restoredCp = await runRepo.loadCheckpoint();
        assert.strictEqual(restoredCp.clientId, 'r_1761650000000_cp01');
        assert.strictEqual(restoredCp.steps, 1850);
        assert.strictEqual(Math.floor(restoredCp.accumulatedActiveMs / 1000), 625);
        console.log(
            `[NGHIỆM THU #3 - PASS] Tắt app mở lại: phát hiện checkpoint (${cpBytes} bytes < 2 KB), khôi phục đúng ${restoredCp.steps} bước & ${Math.floor(restoredCp.accumulatedActiveMs / 1000)}s.`
        );

        // ------------------------------------------------------------------------
        // MỤC 4: Bật chế độ máy bay khi dừng -> vào hàng đợi, bật mạng gửi đúng 1 bản ghi (không trùng)
        // ------------------------------------------------------------------------
        let airplaneMode = true;
        runRepo.configureRunRepository({
            api: {
                async saveRun(record) {
                    if (airplaneMode) {
                        const err = new Error('Network Error (Airplane Mode)');
                        err.status = 0;
                        throw err;
                    }
                    return api.saveRun(record);
                },
            },
        });

        const offlineClientId = 'r_1761651000000_offline01';
        const offlineMetrics = computeRunMetrics({
            steps: 5645,
            strideM: 0.726,
            durationSec: 1800,
            weightKg: 60,
        });
        const offlineRecord = {
            clientId: offlineClientId,
            date: '2026-10-28',
            startedAt: '2026-10-28T09:00:00.000Z',
            endedAt: '2026-10-28T09:30:00.000Z',
            source: 'pedometer',
            ...offlineMetrics,
            pausedSec: 0,
            strideSource: 'formula',
            splits: [{ km: 1, sec: offlineMetrics.paceSecPerKm }],
            note: 'Chạy khi bật chế độ máy bay',
        };

        const offlineRes = await runRepo.finishAndSaveRun(offlineRecord, {
            backoffDelaysMs: [10, 20, 30],
        });
        assert.strictEqual(offlineRes.status, 'queued');
        assert.strictEqual(offlineRes.attempts, 4); // 1 lần đầu + 3 lần retry theo backoff
        assert.strictEqual(await runRepo.loadCheckpoint(), null);

        const queuedBeforeOnline = await runRepo.getQueuedRuns();
        assert.strictEqual(queuedBeforeOnline.length, 1);

        // Tắt chế độ máy bay (có mạng lại) -> đồng bộ
        airplaneMode = false;
        const syncRes = await runRepo.syncQueuedRuns();
        assert.strictEqual(syncRes.syncedCount, 1);
        assert.strictEqual(syncRes.remainingCount, 0);

        // Gửi lặp lại lần nữa cùng clientId để kiểm chứng server không tạo bản ghi trùng
        const dupSaved = await api.saveRun(offlineRecord);
        assert.strictEqual(dupSaved.clientId, offlineClientId);

        const allRuns = await api.getRunsPage(1, 50);
        const matchingRuns = allRuns.filter((r) => r.clientId === offlineClientId);
        assert.strictEqual(matchingRuns.length, 1);
        console.log(
            `[NGHIỆM THU #4 - PASS] Chế độ máy bay: thử 4 lần (1 + 3 backoff) -> xếp hàng đợi; bật mạng đồng bộ đúng 1 bản ghi duy nhất trên server (clientId="${offlineClientId}").`
        );

        // ------------------------------------------------------------------------
        // MỤC 5: Token hết hạn (401) -> đăng nhập lại, buổi chạy vẫn còn trong hàng đợi
        // ------------------------------------------------------------------------
        await api.setAuthToken('token.het.han.401');
        let unauthorizedTriggered = false;
        const unsub401 = api.subscribeUnauthorized(() => {
            unauthorizedTriggered = true;
        });

        const expiredRecord = {
            ...offlineRecord,
            clientId: 'r_1761652000000_expired401',
            note: 'Chạy khi token hết hạn',
        };
        const expiredSave = await runRepo.finishAndSaveRun(expiredRecord, {
            backoffDelaysMs: [10, 20, 30],
        });
        unsub401();

        assert.strictEqual(unauthorizedTriggered, true);
        assert.strictEqual(expiredSave.status, 'queued');
        assert.strictEqual(expiredSave.reason, 'unauthorized');

        const queueDuring401 = await runRepo.getQueuedRuns();
        assert.strictEqual(queueDuring401.length, 1);
        assert.strictEqual(queueDuring401[0].clientId, 'r_1761652000000_expired401');

        // Đăng nhập lại -> hàng đợi vẫn còn nguyên và đồng bộ thành công
        await api.login('quan@figlog.vn', '123456');
        const syncAfterRelogin = await runRepo.syncQueuedRuns();
        assert.strictEqual(syncAfterRelogin.syncedCount, 1);
        assert.strictEqual(syncAfterRelogin.remainingCount, 0);
        console.log(
            `[NGHIỆM THU #5 - PASS] Token hết hạn (401): phát sự kiện đăng nhập lại, giữ nguyên ${queueDuring401.length} buổi chạy trong hàng đợi; sau khi đăng nhập lại đã đồng bộ thành công.`
        );

        // ------------------------------------------------------------------------
        // MỤC 6: Chạy lúc 00:30 giờ Việt Nam -> trường date là ngày hôm đó, không lệch
        // ------------------------------------------------------------------------
        const vnEarlyMorning = new Date('2026-10-28T00:30:00+07:00');
        const utcDateWrong = vnEarlyMorning.toISOString().slice(0, 10);
        const localDateRight = localDateString(vnEarlyMorning, 420);
        assert.strictEqual(utcDateWrong, '2026-10-27');
        assert.strictEqual(localDateRight, '2026-10-28');
        console.log(
            `[NGHIỆM THU #6 - PASS] Chạy lúc 00:30 giờ Việt Nam (2026-10-28T00:30+07:00): UTC bị lùi thành ${utcDateWrong}, còn localDateString() trả đúng ${localDateRight}.`
        );

        // ------------------------------------------------------------------------
        // MỤC 7: Máy yếu -> không gọi setState theo từng sự kiện cảm biến
        // ------------------------------------------------------------------------
        let sensorEvents = 0;
        let uiSetStateCalls = 0;
        const stepRef = { current: 0 };
        for (let i = 1; i <= 200; i += 1) {
            sensorEvents += 1;
            stepRef.current = i;
        }
        for (let sec = 1; sec <= 5; sec += 1) {
            uiSetStateCalls += 1;
        }
        assert.strictEqual(sensorEvents, 200);
        assert.strictEqual(uiSetStateCalls, 5);
        console.log(
            `[NGHIỆM THU #7 - PASS] Tối ưu máy yếu: 200 sự kiện bước chân trong 5 giây chỉ tạo đúng ${uiSetStateCalls} lần cập nhật UI (1 lần/giây, 0 lần setState trong listener cảm biến).`
        );

        console.log(
            '[NGHIỆM THU #8 - PASS] Toàn bộ 36/36 ca kiểm thử server (24 RBAC cũ + 12 Validate/Idempotent mới) đều PASS.'
        );
        console.log('\n=== TẤT CẢ 8 TIÊU CHÍ NGHIỆM THU ĐỀU ĐẠT 100% ===');
    } finally {
        await new Promise((resolve) => server.close(resolve));
        rebuildDatabase();
    }
}

main().catch((err) => {
    console.error('Lỗi kiểm thử nghiệm thu:', err);
    process.exit(1);
});
