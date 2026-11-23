import 'package:material_ui/material_ui.dart';

import '../api/auth_api.dart';
import '../config/client_config.dart';
import '../errors.dart';
import '../l10n/app_localizations.dart';
import 'otp_screen.dart';
import 'widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.config, required this.api, required this.onLocaleChanged});

  final ClientConfig config;
  final AuthApi api;
  final ValueChanged<Locale> onLocaleChanged;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final l = AppLocalizations.of(context)!;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.api.requestOtp(_phone.text.trim());
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => OtpScreen(
          config: widget.config,
          api: widget.api,
          phone: _phone.text.trim(),
          onLocaleChanged: widget.onLocaleChanged,
        ),
      ));
    } on AuthFailure catch (e) {
      setState(() => _error = authErrorMessage(l, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ListView(
            children: [
              BrandHeader(config: widget.config),
              const SizedBox(height: 16),
              LanguageChips(config: widget.config, current: locale, onChanged: widget.onLocaleChanged),
              const SizedBox(height: 24),
              Text(l.loginSubtitle),
              const SizedBox(height: 16),
              TextField(
                key: const Key('phone'),
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: l.phoneLabel, prefixText: '+91 '),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, key: const Key('error'), style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 16),
              FilledButton(
                key: const Key('sendCode'),
                onPressed: _busy ? null : _sendCode,
                child: Text(l.sendCode),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
