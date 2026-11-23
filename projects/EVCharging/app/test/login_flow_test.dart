import 'package:customer_app/api/auth_api.dart';
import 'package:customer_app/app.dart';
import 'package:customer_app/config/client_config.dart';
import 'package:customer_app/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';

ClientConfig config({List<String> languages = const ['en', 'hi', 'mr'], String defaultLanguage = 'en'}) {
  return ClientConfig.fromJson({
    'clientId': 'client-a',
    'displayName': 'Client A EV',
    'mark': 'A',
    'primaryColor': '#0a6cff',
    'accentColor': '#14a86b',
    'languages': languages,
    'defaultLanguage': defaultLanguage,
    'currency': 'INR',
    'gstRate': 0.18,
    'features': {'wallet': true, 'reservations': true, 'faults': true},
    'supportEmail': 'support@example.com',
  });
}

class FakeAuthApi implements AuthApi {
  FakeAuthApi(this.cfg);
  final ClientConfig cfg;

  @override
  Future<ClientConfig> fetchConfig() async => cfg;

  @override
  Future<void> requestOtp(String phone) async {}

  @override
  Future<String> verifyOtp(String phone, String code) async {
    if (code != '123456') {
      throw AuthFailure('WRONG_CODE');
    }
    return 'token-abc';
  }

  @override
  Future<void> recordConsent(String token, String consentType, String version) async {}
}

Future<void> pumpApp(WidgetTester tester, ClientConfig cfg) async {
  await tester.pumpWidget(CustomerApp(config: cfg, api: FakeAuthApi(cfg)));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('login screen shows the client name', (tester) async {
    await pumpApp(tester, config());
    expect(find.text('Client A EV'), findsWidgets);
  });

  testWidgets('client with three languages offers English, Hindi and Marathi', (tester) async {
    await pumpApp(tester, config());
    expect(find.text('English'), findsOneWidget);
    expect(find.text('हिन्दी'), findsOneWidget);
    expect(find.text('मराठी'), findsOneWidget);
  });

  testWidgets('client enabling only English shows only English', (tester) async {
    await pumpApp(tester, config(languages: const ['en']));
    expect(find.text('English'), findsOneWidget);
    expect(find.text('हिन्दी'), findsNothing);
    expect(find.text('मराठी'), findsNothing);
  });

  testWidgets('wrong code shows the message in the selected language', (tester) async {
    await pumpApp(tester, config(defaultLanguage: 'mr'));
    await tester.enterText(find.byKey(const Key('phone')), '98765 43210');
    await tester.tap(find.byKey(const Key('sendCode')));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('otp')), '000000');
    await tester.tap(find.byKey(const Key('verifyCode')));
    await tester.pumpAndSettle();

    final mr = lookupAppLocalizations(const Locale('mr'));
    expect(find.text(mr.errWrongCode), findsOneWidget);
  });

  testWidgets('consent button stays disabled until terms are accepted', (tester) async {
    await pumpApp(tester, config());
    await tester.enterText(find.byKey(const Key('phone')), '98765 43210');
    await tester.tap(find.byKey(const Key('sendCode')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('otp')), '123456');
    await tester.tap(find.byKey(const Key('verifyCode')));
    await tester.pumpAndSettle();

    expect(tester.widget<FilledButton>(find.byKey(const Key('continue'))).onPressed, isNull);

    await tester.tap(find.byKey(const Key('terms')));
    await tester.pumpAndSettle();
    expect(tester.widget<FilledButton>(find.byKey(const Key('continue'))).onPressed, isNotNull);
  });
}
