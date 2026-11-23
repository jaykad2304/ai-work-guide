import 'package:flutter_localizations/flutter_localizations.dart' show GlobalWidgetsLocalizations;
import 'package:material_ui/material_ui.dart';

import 'api/auth_api.dart';
import 'config/client_config.dart';
import 'l10n/app_localizations.dart';
import 'screens/login_screen.dart';
import 'theme.dart';

/// The customer app for one client. Name, colours and languages come from [config].
class CustomerApp extends StatefulWidget {
  const CustomerApp({super.key, required this.config, required this.api});

  final ClientConfig config;
  final AuthApi api;

  @override
  State<CustomerApp> createState() => _CustomerAppState();
}

class _CustomerAppState extends State<CustomerApp> {
  late Locale _locale;

  @override
  void initState() {
    super.initState();
    _locale = Locale(widget.config.defaultLanguage);
  }

  void _setLocale(Locale locale) => setState(() => _locale = locale);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: widget.config.displayName,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(widget.config),
      locale: _locale,
      supportedLocales: widget.config.locales,
      localizationsDelegates: [
        AppLocalizations.delegate,
        ...GlobalMaterialLocalizations.delegates,
        GlobalWidgetsLocalizations.delegate,
      ],
      home: LoginScreen(
        config: widget.config,
        api: widget.api,
        onLocaleChanged: _setLocale,
      ),
    );
  }
}
