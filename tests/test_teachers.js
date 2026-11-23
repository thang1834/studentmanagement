// Test harness: chạy teachers.gs trong Node với stub tối thiểu cho Apps Script.
// Usage: node test_teachers.js <appscript dir>
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const dir = process.argv[2];
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');

// ---------- stub Apps Script ----------
const props = {};
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: k => (k in props ? props[k] : null),
    setProperty: (k, v) => { props[k] = String(v); },
    deleteProperty: k => { delete props[k]; }
  })
};
global.Logger = { log: () => {} };

// Sheet giả: mảng 2 chiều
function fakeSheet(rows) {
  const data = rows.map(r => r.slice());
  return {
    data,
    getLastRow: () => data.length,
    getRange: (r, c, nr, nc) => ({
      getValues: () => data.slice(r - 1, r - 1 + nr).map(row => { const out = []; for (let i = 0; i < nc; i++) out.push(row[c - 1 + i] === undefined ? '' : row[c - 1 + i]); return out; }),
      setValues: vals => { vals.forEach((row, i) => { data[r - 1 + i] = row.slice(); }); return { setFontWeight: () => {} }; },
      setValue: v => { data[r - 1][c - 1] = v; },
      setDataValidation: () => {}
    }),
    appendRow: row => data.push(row.slice()),
    setFrozenRows: () => {}
  };
}
function fakeSpreadsheet(id, sheets) {
  return {
    id, sheets,
    getId: () => id,
    getUrl: () => `https://docs.google.com/spreadsheets/d/${id}/edit`,
    getSheetByName: name => sheets[name] || null,
    insertSheet: name => { sheets[name] = fakeSheet([]); return sheets[name]; },
    addEditor: email => { if (email.endsWith('@fail.com')) throw new Error('no permission'); created.shared.push([id, email]); }
  };
}
const master = fakeSpreadsheet('MASTER', {});
const created = { spreadsheets: {}, shared: [] };
global.SpreadsheetApp = {
  getActiveSpreadsheet: () => master,
  openById: id => { if (!created.spreadsheets[id]) throw new Error('not found ' + id); return created.spreadsheets[id]; },
  create: name => { const id = 'SS_' + Object.keys(created.spreadsheets).length; const ss = fakeSpreadsheet(id, {}); ss.name = name; created.spreadsheets[id] = ss; return ss; },
  newDataValidation: () => ({ requireValueInList: () => ({ build: () => ({}) }) })
};

// stub các hàm của dự án mà teachers.gs gọi
const sent = [];
global.sendMessage = (chatId, text, options) => { sent.push({ chatId: String(chatId), text }); return { ok: !String(chatId).startsWith('999') }; };
const setupCalls = [];
global.setupAllSheets = ss => setupCalls.push(ss.getId());
global.getCurrentTimestamp = () => '23/11/2026 07:00';
global.formatMoney = n => String(n) + '₫';
global.calculateStatistics = () => { const ss = getDb(); return ss.stats; };
global.getStudentsWithDebt = () => getDb().debts || [];

vm.runInThisContext(read('teachers.gs'), { filename: 'teachers.gs' });

let passed = 0;
const t = (name, fn) => { fn(); passed++; };
const lastText = () => sent[sent.length - 1].text;

// 1. admin ids: fallback TEST_CHAT_ID, rồi ADMIN_IDS
t('admin ids', () => {
  props.TEST_CHAT_ID = '111';
  assert.deepStrictEqual(getAdminIds(), ['111']);
  assert.ok(isAdmin(111) && isAdmin('111') && !isAdmin('222'));
  props.ADMIN_IDS = '111, 112';
  assert.deepStrictEqual(getAdminIds(), ['111', '112']);
  assert.ok(isAdmin('112'));
});

// 2. sổ giáo viên: tự tạo tab, đọc dòng, quyền theo trạng thái
t('teacher registry', () => {
  assert.strictEqual(master.getSheetByName(TEACHER_SHEET), null);
  const sheet = getTeacherSheet();
  assert.ok(master.getSheetByName(TEACHER_SHEET), 'tab GIÁO VIÊN phải được tạo');
  assert.deepStrictEqual(getAllTeachers(), []);
  assert.ok(!isAuthorized('222'));
  assert.ok(isAuthorized('111'), 'admin luôn được dùng');

  created.spreadsheets.SS_T1 = fakeSpreadsheet('SS_T1', {});
  created.spreadsheets.SS_T2 = fakeSpreadsheet('SS_T2', {});
  sheet.appendRow([222, 'Thầy Hai', 'SS_T1', 'url1', TEACHER_STATUS_ACTIVE, 'x']);
  sheet.appendRow([333, 'Thầy Ba', 'SS_T2', 'url2', TEACHER_STATUS_LOCKED, 'x']);
  assert.strictEqual(getAllTeachers().length, 2);
  assert.strictEqual(getTeacherByUserId(222).name, 'Thầy Hai');
  assert.strictEqual(getTeacherByUserId(222)._row, 2);
  assert.ok(isAuthorized(222), 'thầy hoạt động');
  assert.ok(!isAuthorized(333), 'thầy bị khóa');
  assert.deepStrictEqual(getActiveTeachers().map(x => x.userId), ['222']);
});

// 3. ngữ cảnh
t('context', () => {
  assert.strictEqual(getDb(), master, 'không có ngữ cảnh → file gốc');
  assert.strictEqual(getContextLine(), '');

  setCurrentUser('222');
  assert.strictEqual(getDb().getId(), 'SS_T1');
  assert.ok(!isAdminAtRoot());
  assert.ok(getContextLine().includes('Thầy Hai'));

  setCurrentUser('111');
  assert.strictEqual(getDb(), master, 'admin → file gốc');
  assert.ok(isAdminAtRoot());

  setViewingTeacher('111', '222');
  setCurrentUser('111');
  assert.strictEqual(getDb().getId(), 'SS_T1', 'admin đang xem thầy Hai');
  assert.ok(!isAdminAtRoot());
  assert.ok(getContextLine().includes('Thầy Hai'));

  // thầy đang xem bị mất file → quay về gốc và xóa lựa chọn
  created.spreadsheets.SS_T1_backup = created.spreadsheets.SS_T1;
  delete created.spreadsheets.SS_T1;
  setCurrentUser('111');
  assert.strictEqual(getDb(), master);
  assert.strictEqual(props['VIEW_AS_111'], undefined);
  created.spreadsheets.SS_T1 = created.spreadsheets.SS_T1_backup;

  // withTeacher khôi phục ngữ cảnh cũ, kể cả khi lỗi
  setCurrentUser('111');
  const inside = withTeacher(getTeacherByUserId(222), () => getDb().getId());
  assert.strictEqual(inside, 'SS_T1');
  assert.strictEqual(getDb(), master);
  assert.throws(() => withTeacher(getTeacherByUserId(222), () => { throw new Error('boom'); }));
  assert.strictEqual(getDb(), master);

  // forEachActiveTeacher: cộng dồn, lỗi một thầy không chặn
  getTeacherSheet().appendRow([444, 'Thầy Tư', 'SS_MISSING', 'url', TEACHER_STATUS_ACTIVE, 'x']);
  const seen = [];
  const total = forEachActiveTeacher(tc => { seen.push(tc.userId); return 2; });
  assert.deepStrictEqual(seen, ['222'], 'thầy Tư mất file bị bỏ qua');
  assert.strictEqual(total, 2);
  getTeacherSheet().data.pop();
});

// 4. /them_gv
t('add teacher', () => {
  sent.length = 0;
  handleAddTeacher('111', []);
  assert.ok(lastText().includes('Cú pháp'));
  handleAddTeacher('111', ['abc', 'Tên']);
  assert.ok(lastText().includes('Cú pháp'));
  handleAddTeacher('111', ['111', 'Tên Admin']);
  assert.ok(lastText().includes('admin'));
  handleAddTeacher('111', ['222', 'Trùng']);
  assert.ok(lastText().includes('đã có'));

  sent.length = 0;
  handleAddTeacher('111', ['555', 'Nguyễn', 'Văn', 'Năm', 'nam@example.com']);
  const teacher = getTeacherByUserId('555');
  assert.ok(teacher && teacher.name === 'Nguyễn Văn Năm' && teacher.trangThai === TEACHER_STATUS_ACTIVE);
  assert.ok(created.spreadsheets[teacher.spreadsheetId].name.includes('Nguyễn Văn Năm'));
  assert.deepStrictEqual(setupCalls, [teacher.spreadsheetId], 'setupAllSheets phải chạy trên Sheet mới');
  assert.deepStrictEqual(created.shared, [[teacher.spreadsheetId, 'nam@example.com']]);
  assert.ok(sent.some(m => m.chatId === '555' && m.text.includes('/start')), 'báo cho thầy');
  assert.ok(lastText().includes('Đã thêm giáo viên') && lastText().includes('Đã chia sẻ') && lastText().includes('Đã báo cho thầy'));

  // email nằm giữa, chia sẻ lỗi, thầy chưa nhắn bot (999...)
  sent.length = 0;
  handleAddTeacher('111', ['9991', 'x@fail.com', 'Thầy', 'Chín']);
  assert.strictEqual(getTeacherByUserId('9991').name, 'Thầy Chín');
  assert.ok(lastText().includes('Không chia sẻ được') && lastText().includes('Chưa báo được'));
});

// 5. /ds_gv, /xoa_gv, /chon_gv
t('list/remove/select', () => {
  sent.length = 0;
  handleListTeachers('111');
  assert.ok(lastText().includes('Thầy Hai') && lastText().includes('🔒 *Thầy Ba*') && lastText().includes('Nguyễn Văn Năm'));

  handleRemoveTeacher('111', ['555']);
  assert.strictEqual(getTeacherByUserId('555').trangThai, TEACHER_STATUS_LOCKED);
  assert.ok(!isAuthorized('555'));
  handleRemoveTeacher('111', ['555']);
  assert.ok(lastText().includes('đã bị khóa'));
  handleRemoveTeacher('111', ['000']);
  assert.ok(lastText().includes('Cú pháp'));

  handleSelectTeacher('111', '111', ['000']);
  assert.ok(lastText().includes('Không có giáo viên'));
  handleSelectTeacher('111', '111', ['222']);
  assert.strictEqual(props['VIEW_AS_111'], '222');
  handleSelectTeacher('111', '111', []);
  assert.strictEqual(props['VIEW_AS_111'], undefined);
  assert.ok(lastText().includes('file gốc'));
});

// 6. tổng hợp toàn trường
t('admin aggregate', () => {
  created.spreadsheets.SS_T1.stats = { students: { total: 3, active: 2 }, schedules: { today: 1 }, finance: { totalFees: 100, collected: 40, debt: 60 }, vehicles: { total: 1 } };
  created.spreadsheets.SS_T1.debts = [{ id: 'HV001', hoTen: 'A_B', conNo: 60 }];
  created.spreadsheets.SS_T9 = fakeSpreadsheet('SS_T9', {});
  created.spreadsheets.SS_T9.stats = { students: { total: 2, active: 1 }, schedules: { today: 0 }, finance: { totalFees: 50, collected: 50, debt: 0 }, vehicles: { total: 2 } };
  created.spreadsheets.SS_T9.debts = [];
  getTeacherSheet().appendRow([777, 'Thầy Bảy', 'SS_T9', 'url', TEACHER_STATUS_ACTIVE, 'x']);

  handleRemoveTeacher('111', ['9991']); // thầy Chín không có số liệu giả → khóa để không vào tổng hợp
  sent.length = 0;
  handleAdminStatistics('111');
  const s = lastText();
  assert.ok(s.includes('2 giáo viên'), s);
  assert.ok(s.includes('Học viên: 5 (đang học 3)'), s);
  assert.ok(s.includes('Tổng học phí: 150₫') && s.includes('Đã thu: 90₫ (60%)') && s.includes('Còn nợ: 60₫') && s.includes('Xe tập: 3'), s);

  handleAdminDebt('111');
  const d = lastText();
  assert.ok(d.includes('Thầy Hai') && d.includes('A\\_B') && d.includes('Tổng công nợ: 60₫* (1 học viên)'), d);
  assert.ok(!d.includes('Thầy Bảy'), 'thầy không nợ không hiện');
  assert.strictEqual(getDb(), master, 'ngữ cảnh admin được giữ sau tổng hợp');
});

// 7. mdEscape
t('mdEscape', () => {
  assert.strictEqual(mdEscape('a_b*c'), 'a\\_b\\*c');
  assert.strictEqual(mdEscape(null), '');
});

console.log(`teachers: ${passed}/7 test groups passed`);
