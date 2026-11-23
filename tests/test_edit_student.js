// Test harness: chạy logic edit-student.gs trong Node với stub tối thiểu cho GAS.
// Usage: node test_edit_student.js <appscript dir>
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const dir = process.argv[2];
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');
const extractFn = (src, name) => {
  const m = src.match(new RegExp(`^function ${name}\\([^]*?^}`, 'm'));
  if (!m) throw new Error('cannot extract ' + name);
  return m[0];
};

// --- stubs cho GAS ---
global.Utilities = { formatDate: () => { throw new Error('Utilities.formatDate should not be hit in tests'); } };
global.Logger = { log: () => {} };

// --- load code thật ---
// Harness này cố ý thực thi source của chính dự án (các file .gs trong thư mục được truyền vào),
// không chạy dữ liệu ngoài. runInThisContext mô phỏng cách Apps Script nạp nhiều file vào
// một global scope chung (const ở top-level file này thấy được từ file khác).
const vm = require('vm');
const load = (code, name) => vm.runInThisContext(code, { filename: name });
load(read('utils.gs'), 'utils.gs');                                          // parseDate, validatePhone, validateIdCard, formatMoney, formatDate
load(extractFn(read('conversation.gs'), 'parseMoney'), 'parseMoney');      // parseMoney
load(extractFn(read('telegram.gs'), 'createInlineButton'), 'createInlineButton');
load(read('edit-student.gs'), 'edit-student.gs');

const F = vm.runInThisContext('EDIT_STUDENT_FIELDS');
const byteLen = s => Buffer.byteLength(s, 'utf8');
let passed = 0;
const t = (name, fn) => { fn(); passed++; };

// 1. Mỗi trường có label và đúng 1 trong 2 kiểu: (prompt + validate) hoặc choices
t('field shape', () => {
  for (const [k, d] of Object.entries(F)) {
    assert.ok(d.label, k + ' missing label');
    const textual = !!(d.prompt && typeof d.validate === 'function');
    const choice = Array.isArray(d.choices);
    assert.ok(textual !== choice, k + ' must be exactly one of text/choice');
    if (choice) d.choices.forEach(row => assert.ok(Array.isArray(row) && row.length > 0, k + ' choices rows'));
  }
  assert.ok(!('daDong' in F), 'daDong must not be editable via bot');
});

// 2. Validators chuẩn hóa / từ chối đúng
t('validators', () => {
  assert.strictEqual(F.sdt.validate('0901234567'), '0901234567');
  assert.strictEqual(F.sdt.validate('123'), null);
  assert.strictEqual(F.sdt.validate('1901234567'), null);

  assert.strictEqual(F.cmnd.validate('123456789'), '123456789');
  assert.strictEqual(F.cmnd.validate('123456789012'), '123456789012');
  assert.strictEqual(F.cmnd.validate('12'), null);

  assert.strictEqual(F.ngaySinh.validate('01052002'), '01/05/2002');
  assert.strictEqual(F.ngaySinh.validate('5/3/2001'), '05/03/2001');
  assert.strictEqual(F.ngaySinh.validate('05-03-2001'), '05/03/2001');
  assert.strictEqual(F.ngaySinh.validate('32/13/2000'), null);
  assert.strictEqual(F.ngayNopHoSo.validate('11/11/2021'), '11/11/2021');

  assert.strictEqual(F.hocPhi.validate('12tr'), 12000000);
  assert.strictEqual(F.hocPhi.validate('19 triệu'), 19000000);
  assert.strictEqual(F.hocPhi.validate('19.000.000'), 19000000);
  assert.strictEqual(F.hocPhi.validate('abc'), null);

  assert.strictEqual(F.hoTen.validate('A'), null);
  assert.strictEqual(F.hoTen.validate('An'), 'An');
  assert.strictEqual(F.giaoVien.validate('X'), null);
  assert.strictEqual(F.diaChiNha.validate('ngắn'), null);
  assert.strictEqual(F.diaChiNha.validate('123 Lê Lợi, Q1'), '123 Lê Lợi, Q1');

  // optional fields: '-' xóa, text giữ nguyên
  for (const k of ['diaChiLamViec', 'ghiChuDiaChi', 'ghiChu']) {
    assert.strictEqual(F[k].validate('-'), '');
    assert.strictEqual(F[k].validate('ABC'), 'ABC');
  }
});

// 3. format hiển thị giá trị hiện tại
t('format', () => {
  assert.strictEqual(F.hocPhi.format(12000000), '12.000.000₫');
  assert.strictEqual(F.ngaySinh.format('01/05/2002'), '01/05/2002');
});

// 4. Mọi callback_data <= 64 bytes (giới hạn Telegram)
t('callback_data length', () => {
  const sid = 'HV999';
  for (const [k, d] of Object.entries(F)) {
    assert.ok(byteLen(`edit_field:${sid}:${k}`) <= 64, k);
    if (d.choices) d.choices.flat().forEach(c => {
      assert.ok(byteLen(`edit_value:${c}`) <= 64, c);
      assert.ok(!c.includes(':'), 'choice must not contain ":" -> ' + c);
    });
  }
});

// 5. Bàn phím chọn trường: đủ 14 trường, mỗi trường đúng 1 lần, có nút Hủy
t('field keyboard', () => {
  global.getStudentById = id => ({ id, hoTen: 'Nguyễn Văn A' });
  let captured = null;
  global.sendMessageWithKeyboard = (chatId, text, buttons) => { captured = { text, buttons }; };
  global.sendMessage = () => { throw new Error('should not send plain message'); };

  startEditStudent(1, 'HV001');
  const datas = captured.buttons.flat().map(b => b.callback_data);
  const fields = datas.filter(d => d.startsWith('edit_field:')).map(d => d.split(':')[2]);
  assert.deepStrictEqual([...fields].sort(), Object.keys(F).sort(), 'keyboard fields != EDIT_STUDENT_FIELDS');
  assert.strictEqual(new Set(fields).size, fields.length, 'duplicate field button');
  assert.ok(datas.includes('edit_cancel'));
  captured.buttons.forEach(row => assert.ok(row.length <= 3, 'row too wide'));
});

// 6. Chọn trường: state + prompt đúng kiểu
t('field callback', () => {
  const states = {};
  global.setConversationState = (uid, s) => { states[uid] = s; };
  global.getConversationState = uid => states[uid] || null;
  global.clearConversationState = uid => { delete states[uid]; };
  global.getStudentById = id => ({ id, hoTen: 'Nguyễn Văn A', sdt: '0901234567', trangThai: 'Đang học', hocPhi: 12000000, ghiChu: '' });

  let captured = null;
  global.sendMessageWithKeyboard = (chatId, text, buttons) => { captured = { text, buttons }; };

  handleEditFieldCallback(1, 7, 'HV001', 'sdt');
  assert.strictEqual(states[7].type, 'edit_student');
  assert.strictEqual(states[7].step, 'nhap_gia_tri');
  assert.deepStrictEqual(states[7].data, { studentId: 'HV001', field: 'sdt' });
  assert.ok(captured.text.includes('Hiện tại: 0901234567'));
  assert.ok(captured.text.includes(F.sdt.prompt));

  handleEditFieldCallback(1, 7, 'HV001', 'trangThai');
  assert.strictEqual(states[7].step, 'chon_gia_tri');
  const values = captured.buttons.flat().map(b => b.callback_data).filter(d => d.startsWith('edit_value:'));
  assert.strictEqual(values.length, 5);

  handleEditFieldCallback(1, 7, 'HV001', 'ghiChu');
  assert.ok(captured.text.includes('Hiện tại: (trống)'));

  handleEditFieldCallback(1, 7, 'HV001', 'hocPhi');
  assert.ok(captured.text.includes('Hiện tại: 12.000.000₫'));
});

// 7. Luồng lưu: text hợp lệ -> updateStudent đúng field, state xóa, hiện lại chi tiết; text sai -> không lưu
t('save flow', () => {
  const states = { 7: { type: 'edit_student', step: 'nhap_gia_tri', data: { studentId: 'HV001', field: 'sdt' } } };
  global.setConversationState = (uid, s) => { states[uid] = s; };
  global.getConversationState = uid => states[uid] || null;
  global.clearConversationState = uid => { delete states[uid]; };
  const updates = [];
  global.updateStudent = (id, u) => { updates.push([id, u]); return true; };
  const viewed = [];
  global.handleViewStudent = (chatId, id) => viewed.push(id);
  const sent = [];
  global.sendMessage = (chatId, text) => sent.push(text);

  handleEditStudentStep(1, 7, states[7], '  abc  ');
  assert.strictEqual(updates.length, 0, 'invalid value must not save');
  assert.ok(sent[0].includes('không hợp lệ'));
  assert.ok(states[7], 'state kept after invalid input');

  handleEditStudentStep(1, 7, states[7], ' 0912345678 ');
  assert.deepStrictEqual(updates, [['HV001', { sdt: '0912345678' }]]);
  assert.strictEqual(states[7], undefined, 'state cleared after save');
  assert.deepStrictEqual(viewed, ['HV001']);

  // chọn bằng nút
  states[7] = { type: 'edit_student', step: 'chon_gia_tri', data: { studentId: 'HV001', field: 'trangThai' } };
  handleEditValueCallback(1, 7, 'Rớt');
  assert.strictEqual(updates.length, 1, 'value outside choices must not save');
  handleEditValueCallback(1, 7, 'Chờ xử lý hồ sơ');
  assert.deepStrictEqual(updates[1], ['HV001', { trangThai: 'Chờ xử lý hồ sơ' }]);

  // gõ text khi đang ở bước chọn nút -> nhắc, không lưu
  states[7] = { type: 'edit_student', step: 'chon_gia_tri', data: { studentId: 'HV001', field: 'loaiBang' } };
  handleEditStudentStep(1, 7, states[7], 'B2');
  assert.strictEqual(updates.length, 2);
  assert.ok(sent[sent.length - 1].includes('chọn một trong các nút'));

  // hủy: chỉ xóa state của edit
  handleEditCancelCallback(1, 7);
  assert.strictEqual(states[7], undefined);
  states[7] = { type: 'add_student', step: 'ho_ten', data: {} };
  handleEditCancelCallback(1, 7);
  assert.ok(states[7], 'cancel must not clear another flow state');
});

console.log(`edit-student: ${passed}/7 test groups passed`);
