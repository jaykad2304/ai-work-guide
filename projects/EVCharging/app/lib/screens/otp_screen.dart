import 'package:material_ui/material_ui.dart';

import '../api/auth_api.dart';
import '../config/client_config.dart';
import '../errors.dart';
import '../l10n/app_localizations.dart';
import 'consent_screen.dart';
import 'widgets.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({
    super.key,
    required this.config,
    required this.api,
    required this.phone,
    required this.onLocaleChanged,
  });

  final ClientConfig config;
  final AuthApi api;
  final String phone;
  final ValueChanged<Locale> onLocaleChanged;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _code = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final l = AppLocalizations.of(context)!;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final token = await widget.api.verifyOtp(widget.phone, _code.text.trim());
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => ConsentScreen(config: widget.config, api: widget.api, token: token),
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
    return Scaffold(
      appBar: AppBar(title: Text(l.enterCodeTitle)),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(
          children: [
            BrandHeader(config: widget.config),
            const SizedBox(height: 16),
            LanguageChips(
              config: widget.config,
              current: Localizations.localeOf(context),
              onChanged: widget.onLocaleChanged,
            ),
            const SizedBox(height: 16),
            Text(l.sentTo(widget.phone)),
            const SizedBox(height: 12),
            TextField(
              key: const Key('otp'),
              controller: _code,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(counterText: ''),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, key: const Key('error'), style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 12),
            FilledButton(
              key: const Key('verifyCode'),
              onPressed: _busy ? null : _verify,
              child: Text(l.verifyCode),
            ),
          ],
        ),
      ),
    );
  }
}
