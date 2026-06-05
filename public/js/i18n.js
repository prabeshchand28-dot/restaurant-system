// public/js/i18n.js — Language Support
// English, Japanese, Nepali

const TRANSLATIONS = {
  en: {
    // Common
    appName:        'Restaurant',
    save:           'Save',
    cancel:         'Cancel',
    delete:         'Delete',
    edit:           'Edit',
    add:            'Add',
    close:          'Close',
    print:          'Print',
    back:           'Back',
    loading:        'Loading...',
    noData:         'No data yet',
    confirm:        'Are you sure?',

    // Login
    loginTitle:     'Owner Login',
    username:       'Username',
    password:       'Password',
    loginBtn:       'Login to Dashboard',
    loginHint:      'Default',
    invalidCreds:   'Invalid credentials',
    connecting:     'Logging in…',

    // Dashboard Nav
    orders:         'Orders',
    menu:           'Menu',
    tablesQR:       'Tables & QR',
    guests:         'Guests',
    reports:        'Reports',
    kitchen:        'Kitchen',
    live:           'Live',

    // Stats
    totalOrders:    'Total Orders',
    revenue:        'Revenue',
    pending:        'Pending',
    today:          'Today',
    paid:           'Paid',
    awaiting:       'Awaiting',

    // Orders
    kitchenOrders:  'Kitchen Orders',
    all:            'All',
    preparing:      'Preparing',
    completed:      'Completed',
    cancelled:      'Cancelled',
    orderNum:       'ORDER',
    startPreparing: 'Start Preparing',
    markCompleted:  'Mark Completed',
    noOrders:       'No orders yet',
    totalGuests:    'Total Guests',

    // Menu
    menuItems:      'Menu Items',
    addItem:        'Add Item',
    itemName:       'Item Name',
    price:          'Price',
    category:       'Category',
    photo:          'Photo',
    uploadPhoto:    'Click to upload photo',
    available:      'Available',
    saveItem:       'Save Item',
    deleteItem:     'Delete this item?',

    // Tables
    tableQR:        'Table QR Codes',
    printAll:       'Print All',
    tableNo:        'Table no.',
    addTable:       'Add Table',
    deleteTable:    'Delete table',
    printNow:       'Print Now',

    // Guests
    guestInfo:      'Guest Info',
    table:          'Table',
    guestCount:     'Guests',
    guestType:      'Type',
    time:           'Time',
    noGuests:       'No guests yet',

    // Reports
    summaryReport:  'Summary Report',
    totalRevenue:   'Total Revenue',
    topItems:       'Top Selling Items',
    guestBreakdown: 'Guest Breakdown',
    byStatus:       'Orders by Status',
    paymentMethods: 'Payment Methods',
    sold:           'sold',
    noPayments:     'No payments yet',

    // Order Page (Customer)
    welcome:        'Welcome',
    howMany:        'How many guests?',
    guestTypeLabel: 'Guest Type',
    male:           'Male',
    female:         'Female',
    other:          'Other',
    children:       'Children',
    guestTotalLabel: 'guests',
    viewMenu:       'View Menu →',
    myOrders:       'My Orders',
    placeOrder:     'Place Order',
    placingOrder:   'Placing order…',
    orderPlaced:    '✅ Order placed! We\'ll prepare it shortly.',
    noOrdersYet:    'No orders yet',
    items:          'items',
    item:           'item',
    tapToReview:    '▲ Tap to review',
    tapToClose:     '▼ Tap to close',
    total:          'Total',
    newBadge:       'NEW',

    // Status
    statusPending:   '⏳ Pending',
    statusPreparing: '👨‍🍳 Preparing',
    statusCompleted: '✅ Completed',

    // Kitchen
    kitchenDisplay: 'Kitchen Display',
    newOrder:       '🔔 New Order!',
    pendingOrders:  'Pending Orders',
    preparingNow:   'Preparing',
    noPending:      'No pending orders',
    noPreparing:    'Nothing preparing',
    startPrep:      '🔥 Start Preparing',
    markDone:       '✅ Done',
    pay:            '💳 Pay',

    // Payment
    paymentTitle:   'Payment',
    orderSummary:   'Order Summary',
    paymentMethod:  'Payment Method',
    cash:           'Cash',
    card:           'Card',
    qrPay:          'QR Pay',
    amountReceived: 'Amount Received (Rs.)',
    change:         'Change',
    processPayment: 'Process Payment',
    processing:     'Processing…',
    paymentDone:    'Payment Done!',
    receiptGenerated: 'Receipt generated successfully',
    printReceipt:   '🖨️ Print Receipt',
    thankYou:       'Thank you! Come again! 🙏',
  },

  ja: {
    // Common
    appName:        'レストラン',
    save:           '保存',
    cancel:         'キャンセル',
    delete:         '削除',
    edit:           '編集',
    add:            '追加',
    close:          '閉じる',
    print:          '印刷',
    back:           '戻る',
    loading:        '読み込み中...',
    noData:         'データなし',
    confirm:        '本当によろしいですか？',

    // Login
    loginTitle:     'オーナーログイン',
    username:       'ユーザー名',
    password:       'パスワード',
    loginBtn:       'ダッシュボードへログイン',
    loginHint:      'デフォルト',
    invalidCreds:   '認証情報が無効です',
    connecting:     'ログイン中…',

    // Dashboard Nav
    orders:         '注文',
    menu:           'メニュー',
    tablesQR:       'テーブル & QR',
    guests:         'ゲスト',
    reports:        'レポート',
    kitchen:        'キッチン',
    live:           'ライブ',

    // Stats
    totalOrders:    '総注文数',
    revenue:        '売上',
    pending:        '保留中',
    today:          '本日',
    paid:           '支払済',
    awaiting:       '待機中',

    // Orders
    kitchenOrders:  'キッチン注文',
    all:            '全て',
    preparing:      '準備中',
    completed:      '完了',
    cancelled:      'キャンセル',
    orderNum:       '注文',
    startPreparing: '準備開始',
    markCompleted:  '完了にする',
    noOrders:       '注文なし',
    totalGuests:    '総ゲスト数',

    // Menu
    menuItems:      'メニュー一覧',
    addItem:        '品目を追加',
    itemName:       '品目名',
    price:          '価格',
    category:       'カテゴリー',
    photo:          '写真',
    uploadPhoto:    'クリックして写真をアップロード',
    available:      '利用可能',
    saveItem:       '保存',
    deleteItem:     'この品目を削除しますか？',

    // Tables
    tableQR:        'テーブルQRコード',
    printAll:       '全て印刷',
    tableNo:        'テーブル番号',
    addTable:       'テーブル追加',
    deleteTable:    'テーブルを削除',
    printNow:       '今すぐ印刷',

    // Guests
    guestInfo:      'ゲスト情報',
    table:          'テーブル',
    guestCount:     'ゲスト数',
    guestType:      '種類',
    time:           '時間',
    noGuests:       'ゲストなし',

    // Reports
    summaryReport:  'サマリーレポート',
    totalRevenue:   '総売上',
    topItems:       '売れ筋商品',
    guestBreakdown: 'ゲスト内訳',
    byStatus:       'ステータス別注文',
    paymentMethods: '支払方法',
    sold:           '販売',
    noPayments:     '支払いなし',

    // Order Page (Customer)
    welcome:        'ようこそ',
    howMany:        '何名様ですか？',
    guestTypeLabel: 'ゲストタイプ',
    male:           '男性',
    female:         '女性',
    other:          'その他',
    children:       '子供',
    guestTotalLabel: '名',
    viewMenu:       'メニューを見る →',
    myOrders:       '注文履歴',
    placeOrder:     '注文する',
    placingOrder:   '注文中…',
    orderPlaced:    '✅ ご注文ありがとうございます！',
    noOrdersYet:    'まだ注文はありません',
    items:          '品',
    item:           '品',
    tapToReview:    '▲ タップして確認',
    tapToClose:     '▼ タップして閉じる',
    total:          '合計',
    newBadge:       '新着',

    // Status
    statusPending:   '⏳ 保留中',
    statusPreparing: '👨‍🍳 準備中',
    statusCompleted: '✅ 完了',

    // Kitchen
    kitchenDisplay: 'キッチン表示',
    newOrder:       '🔔 新しい注文！',
    pendingOrders:  '保留中の注文',
    preparingNow:   '準備中',
    noPending:      '保留中の注文なし',
    noPreparing:    '準備中のものなし',
    startPrep:      '🔥 準備開始',
    markDone:       '✅ 完了',
    pay:            '💳 支払い',

    // Payment
    paymentTitle:   'お支払い',
    orderSummary:   '注文内容',
    paymentMethod:  '支払方法',
    cash:           '現金',
    card:           'カード',
    qrPay:          'QR支払い',
    amountReceived: '受取金額 (Rs.)',
    change:         'おつり',
    processPayment: '支払いを処理',
    processing:     '処理中…',
    paymentDone:    'お支払い完了！',
    receiptGenerated: 'レシートが生成されました',
    printReceipt:   '🖨️ レシートを印刷',
    thankYou:       'ありがとうございました！またお越しください 🙏',
  },

  ne: {
    // Common
    appName:        'रेस्टुरेन्ट',
    save:           'सेभ गर्नुस्',
    cancel:         'रद्द गर्नुस्',
    delete:         'मेटाउनुस्',
    edit:           'सम्पादन',
    add:            'थप्नुस्',
    close:          'बन्द गर्नुस्',
    print:          'प्रिन्ट',
    back:           'पछाडि',
    loading:        'लोड हुँदैछ...',
    noData:         'कुनै डेटा छैन',
    confirm:        'के तपाईं निश्चित हुनुहुन्छ?',

    // Login
    loginTitle:     'मालिक लगइन',
    username:       'प्रयोगकर्ता नाम',
    password:       'पासवर्ड',
    loginBtn:       'ड्यासबोर्डमा लगइन',
    loginHint:      'डिफल्ट',
    invalidCreds:   'प्रमाणपत्र अमान्य छ',
    connecting:     'लगइन हुँदैछ…',

    // Dashboard Nav
    orders:         'अर्डर',
    menu:           'मेनु',
    tablesQR:       'टेबल र QR',
    guests:         'अतिथि',
    reports:        'रिपोर्ट',
    kitchen:        'किचन',
    live:           'लाइभ',

    // Stats
    totalOrders:    'कुल अर्डर',
    revenue:        'आम्दानी',
    pending:        'बाँकी',
    today:          'आज',
    paid:           'भुक्तान',
    awaiting:       'प्रतीक्षामा',

    // Orders
    kitchenOrders:  'किचन अर्डर',
    all:            'सबै',
    preparing:      'तयार हुँदैछ',
    completed:      'सम्पन्न',
    cancelled:      'रद्द',
    orderNum:       'अर्डर',
    startPreparing: 'तयार गर्न सुरु गर्नुस्',
    markCompleted:  'सम्पन्न भयो',
    noOrders:       'कुनै अर्डर छैन',
    totalGuests:    'कुल अतिथि',

    // Menu
    menuItems:      'मेनु वस्तुहरू',
    addItem:        'वस्तु थप्नुस्',
    itemName:       'वस्तुको नाम',
    price:          'मूल्य',
    category:       'श्रेणी',
    photo:          'फोटो',
    uploadPhoto:    'फोटो अपलोड गर्न क्लिक गर्नुस्',
    available:      'उपलब्ध',
    saveItem:       'वस्तु सेभ गर्नुस्',
    deleteItem:     'यो वस्तु मेटाउने?',

    // Tables
    tableQR:        'टेबल QR कोड',
    printAll:       'सबै प्रिन्ट गर्नुस्',
    tableNo:        'टेबल नम्बर',
    addTable:       'टेबल थप्नुस्',
    deleteTable:    'टेबल मेटाउने?',
    printNow:       'अहिले प्रिन्ट गर्नुस्',

    // Guests
    guestInfo:      'अतिथि जानकारी',
    table:          'टेबल',
    guestCount:     'अतिथि संख्या',
    guestType:      'प्रकार',
    time:           'समय',
    noGuests:       'कुनै अतिथि छैन',

    // Reports
    summaryReport:  'सारांश रिपोर्ट',
    totalRevenue:   'कुल आम्दानी',
    topItems:       'बढी बिक्री भएका वस्तु',
    guestBreakdown: 'अतिथि विवरण',
    byStatus:       'स्थिति अनुसार अर्डर',
    paymentMethods: 'भुक्तान विधि',
    sold:           'बिक्री',
    noPayments:     'कुनै भुक्तान छैन',

    // Order Page (Customer)
    welcome:        'स्वागत छ',
    howMany:        'कति जना हुनुहुन्छ?',
    guestTypeLabel: 'अतिथि प्रकार',
    male:           'पुरुष',
    female:         'महिला',
    other:          'अन्य',
    children:       'बालबालिका',
    guestTotalLabel: 'जना',
    viewMenu:       'मेनु हेर्नुस् →',
    myOrders:       'मेरा अर्डर',
    placeOrder:     'अर्डर गर्नुस्',
    placingOrder:   'अर्डर गर्दैछ…',
    orderPlaced:    '✅ अर्डर भयो! हामी छिट्टै तयार गर्छौं।',
    noOrdersYet:    'अहिलेसम्म कुनै अर्डर छैन',
    items:          'वस्तु',
    item:           'वस्तु',
    tapToReview:    '▲ समीक्षा गर्न थिच्नुस्',
    tapToClose:     '▼ बन्द गर्न थिच्नुस्',
    total:          'जम्मा',
    newBadge:       'नयाँ',

    // Status
    statusPending:   '⏳ बाँकी',
    statusPreparing: '👨‍🍳 तयार हुँदैछ',
    statusCompleted: '✅ सम्पन्न',

    // Kitchen
    kitchenDisplay: 'किचन डिस्प्ले',
    newOrder:       '🔔 नयाँ अर्डर!',
    pendingOrders:  'बाँकी अर्डर',
    preparingNow:   'तयार हुँदैछ',
    noPending:      'कुनै बाँकी अर्डर छैन',
    noPreparing:    'केही तयार भइरहेको छैन',
    startPrep:      '🔥 तयार गर्न सुरु गर्नुस्',
    markDone:       '✅ सकियो',
    pay:            '💳 भुक्तान',

    // Payment
    paymentTitle:   'भुक्तान',
    orderSummary:   'अर्डर सारांश',
    paymentMethod:  'भुक्तान विधि',
    cash:           'नगद',
    card:           'कार्ड',
    qrPay:          'QR भुक्तान',
    amountReceived: 'प्राप्त रकम (Rs.)',
    change:         'फिर्ता',
    processPayment: 'भुक्तान प्रक्रिया गर्नुस्',
    processing:     'प्रक्रिया हुँदैछ…',
    paymentDone:    'भुक्तान सम्पन्न!',
    receiptGenerated: 'रसिद सफलतापूर्वक बनाइयो',
    printReceipt:   '🖨️ रसिद प्रिन्ट गर्नुस्',
    thankYou:       'धन्यवाद! फेरि आउनुहोस् 🙏',
  }
};

// ── Language Manager ──
const i18n = {
  current: localStorage.getItem('lang') || 'en',

  t(key) {
    return TRANSLATIONS[this.current]?.[key] || TRANSLATIONS['en'][key] || key;
  },

  set(lang) {
    this.current = lang;
    localStorage.setItem('lang', lang);
    this.apply();
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });
  }
};

// Apply on load
document.addEventListener('DOMContentLoaded', () => i18n.apply());